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
  
  const tables = ['resale_listings', 'wallet_withdrawals', 'payment_webhook_events', 'rate_limits'];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) as count FROM public.${t}`);
    console.log(`${t}: ${res.rows[0].count} rows`);
  }
  
  // Check columns in wallet_withdrawals
  const res2 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'wallet_withdrawals'
    ORDER BY ordinal_position
  `);
  console.log('\nwallet_withdrawals columns:');
  for (const r of res2.rows) {
    console.log(`  ${r.column_name}: ${r.data_type}`);
  }
  
  // Check columns in resale_listings
  const res3 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'resale_listings'
    ORDER BY ordinal_position
  `);
  console.log('\nresale_listings columns:');
  for (const r of res3.rows) {
    console.log(`  ${r.column_name}: ${r.data_type}`);
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
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
