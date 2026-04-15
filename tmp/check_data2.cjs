const { Client } = require('pg');
const client = new Client({
  host: 'db.wmuwctsmuagetcjqeboz.supabase.co',
  port: 5432,
  user: 'cli_login_postgres',
  password: 'dbvgUrLPNiIPkkNuftOFDIYINoacdiAl',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  const tables = ['wallet_withdrawals', 'resale_listings', 'payment_webhook_events'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT a.attname AS column_name, pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = $1 AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum
    `, [t]);
    console.log(`\n${t} columns:`);
    for (const r of res.rows) {
      console.log(`  ${r.column_name}: ${r.data_type}`);
    }
  }
  
  // Check auth trigger
  const res4 = await client.query(`
    SELECT tgname 
    FROM pg_trigger t 
    JOIN pg_class c ON c.oid = t.tgrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  `);
  console.log('\nAuth triggers on auth.users:', res4.rows.map(r => r.tgname));
  
  // Check create_order_validated signatures
  const res5 = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args 
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname = 'create_order_validated'
  `);
  console.log('\ncreate_order_validated signatures:', res5.rows.map(r => r.args));
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
