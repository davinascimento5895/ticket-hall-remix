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
    SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
           CASE WHEN a.attnotnull THEN 'NOT NULL' ELSE 'NULL' END as nullability,
           pg_get_expr(d.adbin, d.adrelid) as default_val
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'wallet_withdrawals' AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY a.attnum
  `);
  console.log('wallet_withdrawals columns:');
  for (const r of res.rows) {
    console.log(`  ${r.attname}: ${r.type} ${r.nullability} ${r.default_val || ''}`);
  }
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
