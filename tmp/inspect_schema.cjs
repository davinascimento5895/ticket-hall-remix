const { Client } = require('pg');
const fs = require('fs');

const NEW_DB = {
  host: 'db.wmuwctsmuagetcjqeboz.supabase.co',
  port: 5432,
  user: 'cli_login_postgres',
  password: 'HQLtcXbVrTAuqaxtIlOZvPcZiMWLFpmp',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function query(client, sql, label) {
  try {
    const res = await client.query(sql);
    return { label, rows: res.rows, count: res.rowCount };
  } catch (e) {
    return { label, error: e.message, rows: [], count: 0 };
  }
}

async function main() {
  const client = new Client(NEW_DB);
  await client.connect();

  const results = {};

  results.tables = await query(client, `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `, 'Tables');

  results.columns = await query(client, `
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `, 'Columns');

  results.indexes = await query(client, `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `, 'Indexes');

  results.constraints = await query(client, `
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
           kcu.column_name, ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `, 'Constraints');

  results.functions = await query(client, `
    SELECT routine_name, routine_type, data_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    ORDER BY routine_name
  `, 'Functions');

  results.triggers = await query(client, `
    SELECT event_object_table AS table_name, trigger_name, event_manipulation AS event,
           action_timing, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `, 'Triggers');

  results.rls_policies = await query(client, `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `, 'RLS Policies');

  results.enums = await query(client, `
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `, 'Enums');

  results.rls_enabled = await query(client, `
    SELECT relname AS table_name, relrowsecurity AS rls_enabled
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND relkind = 'r'
    ORDER BY relname
  `, 'RLS Enabled');

  results.extensions = await query(client, `
    SELECT extname FROM pg_extension ORDER BY extname
  `, 'Extensions');

  results.cron_jobs = await query(client, `
    SELECT jobid, schedule, command, active
    FROM cron.job
    ORDER BY jobid
  `, 'Cron Jobs');

  results.storage_buckets = await query(client, `
    SELECT id, name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets
    ORDER BY id
  `, 'Storage Buckets');

  results.storage_policies = await query(client, `
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage'
    ORDER BY tablename, policyname
  `, 'Storage Policies');

  results.edge_functions = await query(client, `
    SELECT name, slug, verify_jwt
    FROM supabase_functions.functions
    ORDER BY name
  `, 'Edge Functions');

  await client.end();

  fs.writeFileSync('tmp/new_schema_audit.json', JSON.stringify(results, null, 2));
  console.log('Schema audit written to tmp/new_schema_audit.json');
}

main().catch(e => { console.error(e); process.exit(1); });
