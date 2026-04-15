const { Client } = require('pg');
const client = new Client({
  host: 'db.wmuwctsmuagetcjqeboz.supabase.co',
  port: 5432,
  user: 'cli_login_postgres',
  password: 'HQLtcXbVrTAuqaxtIlOZvPcZiMWLFpmp',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  const res = await client.query(`
    SELECT tgname, tgrelid::regclass 
    FROM pg_trigger t 
    JOIN pg_class c ON c.oid = t.tgrelid 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  `);
  console.log('Auth triggers on auth.users:', JSON.stringify(res.rows, null, 2));
  
  const res2 = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args 
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname = 'create_order_validated'
  `);
  console.log('create_order_validated signatures:', JSON.stringify(res2.rows, null, 2));
  
  const res3 = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args 
    FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE n.nspname = 'public' AND p.proname = 'revoke_certificate'
  `);
  console.log('revoke_certificate signatures:', JSON.stringify(res3.rows, null, 2));
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
