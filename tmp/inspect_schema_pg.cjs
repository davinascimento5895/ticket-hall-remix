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
    SELECT c.relname AS table_name,
           pg_get_userbyid(c.relowner) AS owner,
           c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `, 'Tables');

  results.columns = await query(client, `
    SELECT c.relname AS table_name,
           a.attname AS column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
           CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
           pg_get_expr(d.adbin, d.adrelid) AS column_default
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY c.relname, a.attnum
  `, 'Columns');

  results.indexes = await query(client, `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `, 'Indexes');

  results.constraints = await query(client, `
    SELECT conrelid::regclass AS table_name,
           conname AS constraint_name,
           CASE contype
             WHEN 'p' THEN 'PRIMARY KEY'
             WHEN 'f' THEN 'FOREIGN KEY'
             WHEN 'u' THEN 'UNIQUE'
             WHEN 'c' THEN 'CHECK'
             WHEN 'x' THEN 'EXCLUSION'
           END AS constraint_type,
           pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
    ORDER BY conrelid::regclass::text, conname
  `, 'Constraints');

  results.functions = await query(client, `
    SELECT p.proname AS routine_name,
           pg_get_function_identity_arguments(p.oid) AS args,
           pg_get_function_result(p.oid) AS return_type
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname
  `, 'Functions');

  results.triggers = await query(client, `
    SELECT tgname AS trigger_name,
           tgrelid::regclass AS table_name,
           CASE tgtype & 66
             WHEN 2 THEN 'BEFORE'
             WHEN 64 THEN 'INSTEAD OF'
             ELSE 'AFTER'
           END AS timing,
           CASE
             WHEN tgtype & 4 > 0 THEN 'INSERT'
             WHEN tgtype & 8 > 0 THEN 'DELETE'
             WHEN tgtype & 16 > 0 THEN 'UPDATE'
             WHEN tgtype & 32 > 0 THEN 'TRUNCATE'
           END AS event,
           t.tgenabled AS enabled,
           p.proname AS function_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
    ORDER BY tgrelid::regclass::text, tgname
  `, 'Triggers');

  results.rls_policies = await query(client, `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `, 'RLS Policies');

  results.enums = await query(client, `
    SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `, 'Enums');

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

  results.foreign_keys = await query(client, `
    SELECT conrelid::regclass AS table_name,
           conname AS constraint_name,
           pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND contype = 'f'
    ORDER BY conrelid::regclass::text, conname
  `, 'Foreign Keys');

  results.scheduled_functions = await query(client, `
    SELECT 
      s.schedule,
      s.command,
      s.jobname,
      s.active
    FROM pg_extension e
    JOIN LATERAL pg_catalog.pg_schedules(e.oid) s ON true
    WHERE e.extname = 'pg_cron'
  `, 'Scheduled Functions');

  await client.end();

  fs.writeFileSync('tmp/new_schema_audit_pg.json', JSON.stringify(results, null, 2));
  console.log('Schema audit written to tmp/new_schema_audit_pg.json');
}

main().catch(e => { console.error(e); process.exit(1); });
