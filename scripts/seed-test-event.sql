-- =============================================================================
-- TicketHall - Seed de Evento para Load Testing
-- Cria um evento com tiers de teste para simular carga
-- =============================================================================

BEGIN;

-- 1. Criar produtor de teste (se não existir)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'producer-loadtest@ticket.test',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"full_name": "Load Test Producer"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, producer_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Load Test Producer',
    'approved'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'producer')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Criar evento de teste
INSERT INTO events (
    id,
    producer_id,
    title,
    slug,
    description,
    category,
    status,
    venue_name,
    venue_city,
    venue_state,
    start_date,
    end_date,
    platform_fee_percent,
    max_capacity,
    is_featured
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Show Load Test - 3000 Ingressos',
    'show-load-test-3000',
    'Evento criado exclusivamente para testes de carga. Não é um evento real.',
    'music',
    'published',
    'Estádio de Testes',
    'São Paulo',
    'SP',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '30 days 6 hours',
    7.0,
    3000,
    false
)
ON CONFLICT (id) DO UPDATE SET
    status = 'published',
    max_capacity = 3000;

-- 3. Criar tiers de teste
-- Opção A: 1 tier com 3000 ingressos (para testar gargalo)
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    description,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible,
    is_transferable,
    is_resellable
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Único Tier (Teste Gargalo)',
    'Tier único com 3000 ingressos. Usar para testar limites de concorrência.',
    'paid',
    100.00,
    3000,
    0,
    0,
    1,
    10,
    true,
    true,
    false
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 3000,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Opção B: Múltiplos tiers (para testar distribuição de carga)
-- Tier B1
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 1',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Tier B2
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 2',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Tier B3
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 3',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Tier B4
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 4',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Tier B5
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 5',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- Tier B6
INSERT INTO ticket_tiers (
    id,
    event_id,
    name,
    tier_type,
    price,
    quantity_total,
    quantity_sold,
    quantity_reserved,
    min_per_order,
    max_per_order,
    is_visible
) VALUES (
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000002',
    'Ingresso Geral - Lote 6',
    'paid',
    100.00,
    500,
    0,
    0,
    1,
    10,
    true
)
ON CONFLICT (id) DO UPDATE SET
    quantity_total = 500,
    quantity_sold = 0,
    quantity_reserved = 0;

-- 4. Criar cupom de teste (opcional)
INSERT INTO coupons (
    id,
    event_id,
    producer_id,
    code,
    discount_type,
    discount_value,
    max_uses,
    uses_count,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'LOADTEST10',
    'percentage',
    10.00,
    1000,
    0,
    true
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 5. Output dos IDs para referência
SELECT 
    'EVENT_ID' as type,
    '00000000-0000-0000-0000-000000000002' as id,
    'Show Load Test - 3000 Ingressos' as name
UNION ALL
SELECT 
    'TIER_SINGLE' as type,
    '00000000-0000-0000-0000-000000000003' as id,
    'Ingresso Geral - Único Tier (3000 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_1' as type,
    '00000000-0000-0000-0000-000000000004' as id,
    'Ingresso Geral - Lote 1 (500 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_2' as type,
    '00000000-0000-0000-0000-000000000005' as id,
    'Ingresso Geral - Lote 2 (500 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_3' as type,
    '00000000-0000-0000-0000-000000000006' as id,
    'Ingresso Geral - Lote 3 (500 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_4' as type,
    '00000000-0000-0000-0000-000000000007' as id,
    'Ingresso Geral - Lote 4 (500 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_5' as type,
    '00000000-0000-0000-0000-000000000008' as id,
    'Ingresso Geral - Lote 5 (500 unidades)' as name
UNION ALL
SELECT 
    'TIER_MULTI_6' as type,
    '00000000-0000-0000-0000-000000000009' as id,
    'Ingresso Geral - Lote 6 (500 unidades)' as name
UNION ALL
SELECT 
    'COUPON' as type,
    '00000000-0000-0000-0000-000000000010' as id,
    'LOADTEST10 (10% off)' as name;
