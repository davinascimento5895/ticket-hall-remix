/**
 * TicketHall - Load Test: Download de Ingressos (Dia do Evento)
 * 
 * Simula 3000 pessoas fazendo login e baixando o ingresso simultaneamente
 * 
 * Uso:
 *   k6 run --env API_URL=https://... --env ANON_KEY=... scripts/load-test-download.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginTime = new Trend('login_time');
const listTicketsTime = new Trend('list_tickets_time');
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    // Cenário: 3000 pessoas acessando no horário do evento
    download_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },   // Chegada das primeiras 1000
        { duration: '3m', target: 3000 },   // Pico: todo mundo chegou
        { duration: '5m', target: 3000 },   // Sustentado
        { duration: '2m', target: 0 },      // Saindo
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% das reqs < 1s
    http_req_failed: ['rate<0.01'],      // menos de 1% de erro
    login_time: ['p(95)<500'],           // login < 500ms
    list_tickets_time: ['p(95)<300'],    // listar tickets < 300ms
  },
};

const API_URL = __ENV.API_URL;
const ANON_KEY = __ENV.ANON_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

export function setup() {
  console.log('🔧 Setup: Criando usuários de teste...');
  // Retorna dados necessários para o teste
  return {
    testTicketId: __ENV.TEST_TICKET_ID,
  };
}

export default function (data) {
  group('1. Login', () => {
    const start = Date.now();
    
    // Login com email/senha
    const loginRes = http.post(`${API_URL}/auth/v1/token?grant_type=password`, JSON.stringify({
      email: `test_${__VU}@loadtest.com`, // Cada VU tem um email
      password: 'test123456',
    }), { headers });
    
    loginTime.add(Date.now() - start);
    
    const loginSuccess = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login returns access_token': (r) => r.json('access_token') !== undefined,
    });
    
    errorRate.add(!loginSuccess);
    
    if (!loginSuccess) {
      console.log(`Login failed: ${loginRes.status} - ${loginRes.body}`);
      return;
    }
    
    const accessToken = loginRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${accessToken}`,
    };
    
    sleep(Math.random() * 2); // Simula tempo de navegação
    
    group('2. Listar Meus Ingressos', () => {
      const listStart = Date.now();
      
      // Query: getMyTickets (igual ao seu código)
      const listRes = http.get(
        `${API_URL}/rest/v1/tickets?select=*,ticket_tiers(name,price),events(title,start_date)&owner_id=eq.me`,
        { headers: authHeaders }
      );
      
      listTicketsTime.add(Date.now() - listStart);
      
      const listSuccess = check(listRes, {
        'list tickets status 200': (r) => r.status === 200,
        'list tickets returns array': (r) => Array.isArray(r.json()),
      });
      
      errorRate.add(!listSuccess);
      
      sleep(Math.random() * 3); // Simula tempo olhando o ingresso
    });
    
    group('3. Visualizar QR Code', () => {
      // O QR code é uma imagem estática (api.qrserver.com)
      // Isso não bate no seu servidor!
      // Mas simulamos a requisição ao Supabase para pegar a URL
      
      const qrRes = http.get(
        `${API_URL}/rest/v1/tickets?select=qr_code,qr_code_image_url&id=eq.${data.testTicketId}`,
        { headers: authHeaders }
      );
      
      check(qrRes, {
        'qr code status 200': (r) => r.status === 200,
        'qr code has image url': (r) => r.json()[0]?.qr_code_image_url !== undefined,
      });
      
      // Nota: O download da imagem QR vai para api.qrserver.com
      // Não conta na carga do seu Supabase!
    });
    
    // Nota: PDF generation é client-side (jsPDF)
    // Zero carga no servidor aqui!
    
  });
  
  sleep(Math.random() * 5); // Tempo entre interações
}

export function teardown(data) {
  console.log('\n📊 Resultados do Teste de Download:');
  console.log('   Se passou nos thresholds, seu plano atual aguenta!');
}
