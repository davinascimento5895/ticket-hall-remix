/**
 * TicketHall - Load Testing Script
 * Testa a capacidade de venda de ingressos com concorrência
 * 
 * Uso: node scripts/load-test.js
 * Requer: npm install k6 (ou @grafana/k6 no windows)
 * 
 * Para rodar com k6:
 *   k6 run --env API_URL=https://sua-api.supabase.co scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const reservationSuccess = new Rate('reservation_success');
const orderCreationTime = new Trend('order_creation_time');
const stockConsistency = new Rate('stock_consistency');

// Configuração de carga
export const options = {
  scenarios: {
    // Cenário 1: Pico de vendas (2000 usuários em 1 minuto)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 },   // Aquecimento
        { duration: '1m', target: 2000 },   // Pico máximo
        { duration: '30s', target: 0 },     // Cool down
      ],
      gracefulRampDown: '30s',
    },
    
    // Cenário 2: Sustentado (3000 usuários ao longo de 10 min)
    sustained_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },
        { duration: '5m', target: 3000 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
      startTime: '3m', // Inicia após o spike
    },
    
    // Cenário 3: Teste de estoque (todos tentam comprar o mesmo lote)
    stock_race: {
      executor: 'shared-iterations',
      vus: 100,
      iterations: 1000,
      maxDuration: '5m',
      startTime: '10m',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições < 2s
    http_req_failed: ['rate<0.05'],     // menos de 5% de erros
    errors: ['rate<0.1'],
    reservation_success: ['rate>0.8'],  // 80%+ de sucesso em reservas
  },
};

const API_URL = __ENV.API_URL;
const ANON_KEY = __ENV.ANON_KEY;

// Helpers
const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomEmail() {
  return `test_${Math.random().toString(36).substring(7)}_${Date.now()}@loadtest.com`;
}

// Autenticação anônima (simula usuário)
function authenticate() {
  const res = http.post(`${API_URL}/auth/v1/token?grant_type=password`, JSON.stringify({
    email: randomEmail(),
    password: 'loadtest123456',
  }), { headers });
  
  if (res.status !== 200) {
    // Se usuário não existe, cria
    const signup = http.post(`${API_URL}/auth/v1/signup`, JSON.stringify({
      email: randomEmail(),
      password: 'loadtest123456',
    }), { headers });
    
    if (signup.status === 200) {
      return signup.json('access_token');
    }
  }
  
  return res.json('access_token');
}

// 1. Teste: Listar eventos (read-heavy)
function listEvents() {
  const start = Date.now();
  const res = http.get(`${API_URL}/rest/v1/events?status=eq.published&select=*`, { headers });
  const duration = Date.now() - start;
  
  check(res, {
    'list events status 200': (r) => r.status === 200,
    'list events response time < 500ms': (r) => duration < 500,
  });
  
  return res.json();
}

// 2. Teste: Criar pedido (write-heavy)
function createOrder(token, tierIds, quantities) {
  const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };
  const start = Date.now();
  
  const res = http.post(`${API_URL}/rest/v1/rpc/create_order_validated`, JSON.stringify({
    p_tier_ids: tierIds,
    p_quantities: quantities,
    p_buyer_id: generateUUID(), // Será ignorado no server, mas necessário
    p_coupon_code: null,
    p_promoter_event_id: null,
  }), { headers: authHeaders });
  
  orderCreationTime.add(Date.now() - start);
  
  const success = check(res, {
    'create order success': (r) => r.status === 200,
    'create order has order_id': (r) => r.json('order_id') !== undefined,
  });
  
  errorRate.add(!success);
  return res.json();
}

// 3. Teste: Reservar ingressos (critical - com locking)
function reserveTickets(token, tierId, quantity, orderId) {
  const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };
  const start = Date.now();
  
  const res = http.post(`${API_URL}/rest/v1/rpc/reserve_tickets`, JSON.stringify({
    p_tier_id: tierId,
    p_quantity: quantity,
    p_order_id: orderId,
  }), { headers: authHeaders });
  
  const success = res.status === 200 && res.body === 'true';
  reservationSuccess.add(success);
  
  check(res, {
    'reserve tickets success': (r) => success,
    'reserve tickets time < 2s': (r) => (Date.now() - start) < 2000,
  });
  
  return success;
}

// 4. Teste: Verificar consistência de estoque
function checkStockConsistency(tierId, expectedAvailable) {
  const res = http.get(
    `${API_URL}/rest/v1/ticket_tiers?id=eq.${tierId}&select=quantity_total,quantity_sold,quantity_reserved`,
    { headers }
  );
  
  if (res.status === 200) {
    const tier = res.json()[0];
    const available = tier.quantity_total - tier.quantity_sold - (tier.quantity_reserved || 0);
    const consistent = available >= 0 && available <= tier.quantity_total;
    stockConsistency.add(consistent);
    
    check(res, {
      'stock never negative': (r) => available >= 0,
      'stock never exceeds total': (r) => available <= tier.quantity_total,
    });
    
    return available;
  }
  return null;
}

// 5. Teste: Processar pagamento (simula confirmação)
function confirmPayment(token, orderId) {
  const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };
  
  const res = http.post(`${API_URL}/rest/v1/rpc/confirm_order_payment`, JSON.stringify({
    p_order_id: orderId,
    p_asaas_payment: 'test_payment_' + Date.now(),
    p_net_value: 100.00,
  }), { headers: authHeaders });
  
  check(res, {
    'confirm payment success': (r) => r.status === 200,
  });
  
  return res.status === 200;
}

// Main test flow
export default function () {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  group('Browse Events', () => {
    const events = listEvents();
    sleep(Math.random() * 2);
  });
  
  group('Purchase Flow', () => {
    // Simula: 70% dos usuários apenas browsam, 30% tentam comprar
    if (Math.random() > 0.3) {
      sleep(Math.random() * 5);
      return;
    }
    
    // Tier de teste (substitua por um ID real do seu ambiente de teste)
    const testTierId = __ENV.TEST_TIER_ID || '00000000-0000-0000-0000-000000000000';
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 ingressos
    
    // Criar pedido
    const orderResult = createOrder(token, [testTierId], [quantity]);
    if (!orderResult || orderResult.error) {
      errorRate.add(1);
      return;
    }
    
    const orderId = orderResult.order_id;
    
    // Reservar ingressos (critical section)
    const reserved = reserveTickets(token, testTierId, quantity, orderId);
    
    if (reserved) {
      // Simula processamento de pagamento (apenas 50% dos casos)
      if (Math.random() > 0.5) {
        sleep(Math.random() * 3); // Tempo de digitar dados do cartão
        confirmPayment(token, orderId);
      }
    }
    
    // Verifica consistência
    checkStockConsistency(testTierId);
  });
  
  sleep(Math.random() * 3);
}

// Setup: Criar dados de teste
export function setup() {
  console.log('🔧 Setup: Criando evento e tier de teste...');
  console.log(`📍 API URL: ${API_URL}`);
  
  // Aqui você pode criar um evento de teste via SQL ou API
  // Ex: inserir 1000 ingressos em um tier específico para o teste
  
  return {
    testTierId: __ENV.TEST_TIER_ID,
    initialStock: 1000,
  };
}

// Teardown: Limpar dados e relatório
export function teardown(data) {
  console.log('\n📊 Load Test Summary:');
  console.log(`   Tier ID: ${data.testTierId}`);
  console.log(`   Initial Stock: ${data.initialStock}`);
  console.log('\n⚠️  IMPORTANTE: Verificar se há:');
  console.log('   - Overselling (vendas acima do estoque)');
  console.log('   - Deadlocks no banco');
  console.log('   - Reservas órfãs (não expiradas corretamente)');
}
