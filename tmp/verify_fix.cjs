const { Client } = require('pg');
const client = new Client({
  host: 'db.wmuwctsmuagetcjqeboz.supabase.co',
  port: 5432,
  user: 'cli_login_postgres',
  password: 'UNHNMZeXLQmQRXAbKPArChJMllrqWncm',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  // Check wallet_withdrawals columns
  const res1 = await client.query(`
    SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) as type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'wallet_withdrawals' AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY a.attnum
  `);
  const walletCols = res1.rows.map(r => r.attname);
  const missingWalletCols = ['expected_payment_date', 'processed_by', 'receipt_url', 'admin_notes', 'wallet_transaction_id'].filter(c => !walletCols.includes(c));
  console.log('wallet_withdrawals missing columns:', missingWalletCols.length ? missingWalletCols : 'None ✅');
  
  // Check indexes
  const res2 = await client.query(`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'wallet_withdrawals'
  `);
  const indexes = res2.rows.map(r => r.indexname);
  console.log('idx_wallet_withdrawals_processed present:', indexes.includes('idx_wallet_withdrawals_processed') ? 'Yes ✅' : 'No ❌');
  
  // Check constraints
  const res3 = await client.query(`
    SELECT conname FROM pg_constraint
    WHERE conrelid IN ('wallet_withdrawals'::regclass, 'resale_listings'::regclass, 'payment_webhook_events'::regclass)
      AND contype = 'c'
  `);
  const constraints = res3.rows.map(r => r.conname);
  console.log('wallet_withdrawals_pix_key_type_check present:', constraints.includes('wallet_withdrawals_pix_key_type_check') ? 'Yes ✅' : 'No ❌');
  console.log('wallet_withdrawals_status_check present:', constraints.includes('wallet_withdrawals_status_check') ? 'Yes ✅' : 'No ❌');
  console.log('resale_listings_status_check present:', constraints.includes('resale_listings_status_check') ? 'Yes ✅' : 'No ❌');
  console.log('payment_webhook_events_attempt_count_positive present:', constraints.includes('payment_webhook_events_attempt_count_positive') ? 'Yes ✅' : 'No ❌');
  
  // Check auth trigger
  const res4 = await client.query(`
    SELECT tgname FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  `);
  console.log('on_auth_user_created trigger present:', res4.rows.some(r => r.tgname === 'on_auth_user_created') ? 'Yes ✅' : 'No ❌');
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
