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
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'payment_webhook_events'::regclass AND contype = 'c'
  `);
  console.log('payment_webhook_events CHECK constraints:');
  for (const r of res.rows) {
    console.log(`  ${r.conname}: ${r.def}`);
  }
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
