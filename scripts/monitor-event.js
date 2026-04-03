#!/usr/bin/env node
/**
 * TicketHall - Monitor de Evento em Tempo Real
 * 
 * Uso:
 *   node scripts/monitor-event.js EVENT_ID
 * 
 * Exemplo:
 *   node scripts/monitor-event.js 00000000-0000-0000-0000-000000000002
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sua-service-role-key';

const eventId = process.argv[2];

if (!eventId) {
  console.error('❌ Erro: Especifique o EVENT_ID');
  console.error('   Uso: node scripts/monitor-event.js EVENT_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

async function getEventStats() {
  // Estatísticas do evento
  const { data: event } = await supabase
    .from('events')
    .select('title, max_capacity')
    .eq('id', eventId)
    .single();

  // Estatísticas por tier
  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('name, quantity_total, quantity_sold, quantity_reserved')
    .eq('event_id', eventId)
    .order('name');

  // Pedidos recentes
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('status, created_at')
    .eq('event_id', eventId)
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // últimos 5 min
    .order('created_at', { ascending: false });

  // Bloqueios ativos (se tiver acesso)
  const { data: locks } = await supabase.rpc('check_active_locks').catch(() => ({ data: null }));

  return { event, tiers, recentOrders, locks };
}

function formatNumber(num) {
  return num?.toString().padStart(4, ' ') || '   0';
}

function progressBar(current, total, width = 30) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((width * percent) / 100);
  const empty = width - filled;
  
  let color = colors.green;
  if (percent > 80) color = colors.yellow;
  if (percent > 95) color = colors.red;
  
  return `[${color}${'█'.repeat(filled)}${' '.repeat(empty)}${colors.reset}] ${percent}%`;
}

async function monitor() {
  console.clear();
  console.log(`${colors.bold}${colors.cyan}🎫 TicketHall - Monitor de Evento${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
  console.log('');

  try {
    const { event, tiers, recentOrders, locks } = await getEventStats();

    if (!event) {
      console.log(`${colors.red}❌ Evento não encontrado: ${eventId}${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.bold}📊 Evento: ${event.title}${colors.reset}`);
    console.log(`   Capacidade máxima: ${event.max_capacity || 'N/A'}`);
    console.log('');

    // Tabela de tiers
    console.log(`${colors.bold}📦 Estoque por Tier:${colors.reset}`);
    console.log('┌─────────────────────────────────┬────────┬────────┬─────────┬───────────┐');
    console.log('│ Tier                            │ Total  │ Vendid │ Reserv  │ Disp.     │');
    console.log('├─────────────────────────────────┼────────┼────────┼─────────┼───────────┤');

    let totalTotal = 0;
    let totalSold = 0;
    let totalReserved = 0;

    for (const tier of tiers || []) {
      const available = tier.quantity_total - tier.quantity_sold - (tier.quantity_reserved || 0);
      totalTotal += tier.quantity_total;
      totalSold += tier.quantity_sold;
      totalReserved += tier.quantity_reserved || 0;

      const name = tier.name.substring(0, 31).padEnd(31);
      const status = available < 0 ? `${colors.red}ESGOTADO${colors.reset}` : 
                    available === 0 ? `${colors.yellow}ZERADO${colors.reset}` :
                    `${colors.green}${available.toString().padStart(3)}${colors.reset}`;

      console.log(
        `│ ${name} │ ${formatNumber(tier.quantity_total)} │ ${formatNumber(tier.quantity_sold)} │ ${formatNumber(tier.quantity_reserved)} │ ${status} │`
      );
    }

    console.log('├─────────────────────────────────┼────────┼────────┼─────────┼───────────┤');
    const totalAvailable = totalTotal - totalSold - totalReserved;
    console.log(
      `│ ${'TOTAL'.padEnd(31)} │ ${formatNumber(totalTotal)} │ ${formatNumber(totalSold)} │ ${formatNumber(totalReserved)} │ ${totalAvailable.toString().padStart(3)} │`
    );
    console.log('└─────────────────────────────────┴────────┴────────┴─────────┴───────────┘');

    // Progresso geral
    console.log('');
    console.log(`${colors.bold}📈 Progresso Geral:${colors.reset}`);
    console.log(`   ${progressBar(totalSold, totalTotal)}`);
    console.log(`   Vendidos: ${totalSold}/${totalTotal} | Reservados: ${totalReserved} | Disponíveis: ${totalAvailable}`);

    // Pedidos recentes
    console.log('');
    console.log(`${colors.bold}🛒 Pedidos (últimos 5 minutos):${colors.reset}`);
    
    const pending = recentOrders?.filter(o => o.status === 'pending').length || 0;
    const paid = recentOrders?.filter(o => o.status === 'paid').length || 0;
    const expired = recentOrders?.filter(o => o.status === 'expired').length || 0;
    const cancelled = recentOrders?.filter(o => o.status === 'cancelled').length || 0;

    console.log(`   ⏳ Pendentes: ${pending} | ✅ Pagos: ${paid} | ❌ Expirados: ${expired} | 🚫 Cancelados: ${cancelled}`);
    
    const totalRecent = recentOrders?.length || 0;
    const conversionRate = totalRecent > 0 ? Math.round((paid / totalRecent) * 100) : 0;
    const conversionColor = conversionRate >= 60 ? colors.green : conversionRate >= 40 ? colors.yellow : colors.red;
    console.log(`   📊 Taxa de conversão: ${conversionColor}${conversionRate}%${colors.reset}`);

    // Alertas
    console.log('');
    console.log(`${colors.bold}⚠️  Alertas:${colors.reset}`);
    
    const alerts = [];
    if (totalAvailable < 0) alerts.push(`${colors.red}🚨 OVSELLING DETECTADO!${colors.reset}`);
    if (totalAvailable === 0) alerts.push(`${colors.yellow}⚠️  Evento esgotado${colors.reset}`);
    if (totalReserved > totalTotal * 0.3) alerts.push(`${colors.yellow}⚠️  Muitas reservas pendentes (>30%)${colors.reset}`);
    if (pending > 50) alerts.push(`${colors.yellow}⚠️  Muitos pedidos pendentes (${pending})${colors.reset}`);
    if (conversionRate < 40 && totalRecent > 10) alerts.push(`${colors.yellow}⚠️  Taxa de conversão baixa${colors.reset}`);
    if (locks && locks.length > 0) alerts.push(`${colors.red}🚨 ${locks.length} bloqueios ativos no banco!${colors.reset}`);

    if (alerts.length === 0) {
      console.log(`   ${colors.green}✅ Tudo normal${colors.reset}`);
    } else {
      alerts.forEach(alert => console.log(`   ${alert}`));
    }

    // Dica
    console.log('');
    console.log(`${colors.cyan}💡 Pressione Ctrl+C para sair${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Erro: ${error.message}${colors.reset}`);
  }
}

// Atualizar a cada 3 segundos
monitor();
const interval = setInterval(monitor, 3000);

// Cleanup
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n\n👋 Monitor encerrado');
  process.exit(0);
});
