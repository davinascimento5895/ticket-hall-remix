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
  
  const res = await client.query(`
    SELECT relname, reltuples::bigint as estimated_rows
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('wallet_withdrawals', 'resale_listings', 'payment_webhook_events')
    ORDER BY relname
  `);
  console.log('Estimated rows (from pg_class):');
  for (const r of res.rows) {
    console.log(`  ${r.relname}: ${r.estimated_rows}`);
  }
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
