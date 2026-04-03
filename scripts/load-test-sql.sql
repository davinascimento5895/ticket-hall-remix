-- =============================================================================
-- TicketHall - Load Testing SQL Scripts
-- Testes de carga e verificação de consistência no PostgreSQL
-- 
-- Como usar:
-- 1. Execute em uma sessão separada durante o load test
-- 2. Monitore os valores em tempo real
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MONITORAMENTO EM TEMPO REAL (execute em loop)
-- -----------------------------------------------------------------------------

-- Verificar estoque disponível
SELECT 
    tt.id AS tier_id,
    tt.name AS tier_name,
    tt.quantity_total,
    tt.quantity_sold,
    COALESCE(tt.quantity_reserved, 0) AS quantity_reserved,
    (tt.quantity_total - tt.quantity_sold - COALESCE(tt.quantity_reserved, 0)) AS available,
    ROUND(
        (tt.quantity_sold::numeric / NULLIF(tt.quantity_total, 0) * 100), 
        2
    ) AS percent_sold
FROM ticket_tiers tt
WHERE tt.event_id = 'SEU_EVENT_ID_AQUI'  -- Substitua pelo ID do evento
ORDER BY tt.name;

-- -----------------------------------------------------------------------------
-- 2. VERIFICAÇÃO DE CONSISTÊNCIA (CRÍTICO)
-- -----------------------------------------------------------------------------

-- Verificar se há overselling (estoque negativo)
SELECT 
    'OVERSELLING DETECTADO!' AS alert,
    tt.id,
    tt.name,
    tt.quantity_total,
    tt.quantity_sold,
    COALESCE(tt.quantity_reserved, 0) AS reserved,
    (tt.quantity_total - tt.quantity_sold - COALESCE(tt.quantity_reserved, 0)) AS available
FROM ticket_tiers tt
WHERE (tt.quantity_total - tt.quantity_sold - COALESCE(tt.quantity_reserved, 0)) < 0;

-- Verificar inconsistência: tickets ativos vs quantity_sold
WITH ticket_counts AS (
    SELECT 
        t.tier_id,
        COUNT(*) AS actual_active_tickets
    FROM tickets t
    WHERE t.status = 'active'
    GROUP BY t.tier_id
)
SELECT 
    'INCONSISTÊNCIA ESTOQUE!' AS alert,
    tt.id AS tier_id,
    tt.name,
    tt.quantity_sold AS expected_sold,
    COALESCE(tc.actual_active_tickets, 0) AS actual_tickets,
    tt.quantity_sold - COALESCE(tc.actual_active_tickets, 0) AS difference
FROM ticket_tiers tt
LEFT JOIN ticket_counts tc ON tt.id = tc.tier_id
WHERE tt.quantity_sold != COALESCE(tc.actual_active_tickets, 0);

-- Verificar reservas órfãs (reservas de pedidos já expirados/cancelados)
SELECT 
    'RESERVAS ÓRFÃS!' AS alert,
    COUNT(*) AS orphan_reservations
FROM tickets t
JOIN orders o ON t.order_id = o.id
WHERE t.status = 'reserved' 
  AND o.status IN ('expired', 'cancelled', 'refunded');

-- -----------------------------------------------------------------------------
-- 3. ESTATÍSTICAS DE VENDAS DURANTE O TESTE
-- -----------------------------------------------------------------------------

-- Total de vendas por minuto (útil durante load test)
SELECT 
    DATE_TRUNC('minute', o.created_at) AS minute,
    COUNT(*) AS orders_created,
    COUNT(*) FILTER (WHERE o.status = 'paid') AS orders_paid,
    COUNT(*) FILTER (WHERE o.status = 'expired') AS orders_expired,
    SUM(o.total) FILTER (WHERE o.status = 'paid') AS revenue_paid
FROM orders o
WHERE o.created_at > NOW() - INTERVAL '30 minutes'
GROUP BY DATE_TRUNC('minute', o.created_at)
ORDER BY minute DESC;

-- Taxa de conversão em tempo real
SELECT 
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid')::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    ) AS conversion_rate,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'paid') AS avg_time_to_payment_seconds
FROM orders
WHERE created_at > NOW() - INTERVAL '1 hour';

-- -----------------------------------------------------------------------------
-- 4. DETECÇÃO DE DEADLOCKS E PROBLEMAS DE CONCORRÊNCIA
-- -----------------------------------------------------------------------------

-- Verificar queries bloqueadas (execute como superuser)
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Verificar conexões ativas
SELECT 
    datname AS database,
    usename AS username,
    state,
    COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname, usename, state;

-- Verificar transações longas (possíveis problemas)
SELECT 
    pid,
    usename,
    state,
    EXTRACT(EPOCH FROM (NOW() - xact_start)) AS transaction_duration_seconds,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND xact_start IS NOT NULL
  AND EXTRACT(EPOCH FROM (NOW() - xact_start)) > 5  -- Transações > 5 segundos
ORDER BY xact_start;

-- -----------------------------------------------------------------------------
-- 5. SIMULAÇÃO DE CARGA (para testar manualmente)
-- -----------------------------------------------------------------------------

-- Função auxiliar para simular múltiplas compras simultâneas
CREATE OR REPLACE FUNCTION simulate_concurrent_purchases(
    p_tier_id UUID,
    p_num_purchases INTEGER,
    p_quantity_per_purchase INTEGER
) RETURNS TABLE(
    attempt_number INTEGER,
    success BOOLEAN,
    order_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_order_id UUID;
    v_result BOOLEAN;
    v_buyer_id UUID;
BEGIN
    FOR i IN 1..p_num_purchases LOOP
        -- Criar usuário de teste
        v_buyer_id := gen_random_uuid();
        
        BEGIN
            -- Criar pedido
            INSERT INTO orders (buyer_id, event_id, status, subtotal, platform_fee, total)
            SELECT 
                v_buyer_id,
                event_id,
                'pending',
                price * p_quantity_per_purchase,
                price * p_quantity_per_purchase * 0.07,
                price * p_quantity_per_purchase * 1.07
            FROM ticket_tiers
            WHERE id = p_tier_id
            RETURNING id INTO v_order_id;
            
            -- Tentar reservar
            SELECT reserve_tickets(p_tier_id, p_quantity_per_purchase, v_order_id) INTO v_result;
            
            IF v_result THEN
                -- Confirmar pagamento
                PERFORM confirm_order_payment(v_order_id, 'test_payment_' || i, 100);
                RETURN QUERY SELECT i, true, v_order_id, NULL::TEXT;
            ELSE
                -- Reverter pedido
                UPDATE orders SET status = 'cancelled' WHERE id = v_order_id;
                RETURN QUERY SELECT i, false, v_order_id, 'Estoque insuficiente'::TEXT;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT i, false, v_order_id, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso (execute em múltiplas sessões simultâneas):
-- SELECT * FROM simulate_concurrent_purchases('TIER_ID_AQUI', 100, 2);

-- -----------------------------------------------------------------------------
-- 6. LIMPEZA PÓS-TESTE
-- -----------------------------------------------------------------------------

-- Remover pedidos de teste (CUIDADO! Execute apenas em ambiente de teste)
/*
BEGIN;
-- Primeiro cancelar tickets
UPDATE tickets 
SET status = 'cancelled' 
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE buyer_id IN (SELECT id FROM profiles WHERE email LIKE '%@loadtest.com')
);

-- Depois remover pedidos
DELETE FROM orders 
WHERE buyer_id IN (SELECT id FROM profiles WHERE email LIKE '%@loadtest.com');

-- Remover perfis de teste
DELETE FROM profiles WHERE email LIKE '%@loadtest.com';
DELETE FROM auth.users WHERE email LIKE '%@loadtest.com';

COMMIT;
*/

-- Resetar estoque de teste (se necessário)
/*
UPDATE ticket_tiers 
SET 
    quantity_sold = 0,
    quantity_reserved = 0
WHERE event_id = 'SEU_EVENT_ID_DE_TESTE';

DELETE FROM tickets 
WHERE order_id IN (
    SELECT o.id FROM orders o
    JOIN events e ON o.event_id = e.id
    WHERE e.id = 'SEU_EVENT_ID_DE_TESTE'
);

DELETE FROM orders 
WHERE event_id = 'SEU_EVENT_ID_DE_TESTE';
*/
