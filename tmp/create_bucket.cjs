const { Client } = require('pg');
const client = new Client({
  host: 'db.wmuwctsmuagetcjqeboz.supabase.co',
  port: 5432,
  user: 'cli_login_postgres',
  password: 'JpOWRPVoQPESRDOYjrKrwfCXSOtpcDnN',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    await client.query("INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT (id) DO NOTHING");
    console.log('Bucket inserted successfully ✅');
  } catch (e) {
    console.error('Error:', e.message);
  }
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
