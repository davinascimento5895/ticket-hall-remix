const fs = require('fs');

const audit = require('./new_schema_audit_pg.json');
const migrations = require('./migration_objects_v3.json');

// Clean up false positives
const expectedTriggers = migrations.triggers.filter(t => !['for', 'function'].includes(t));
const expectedFunctions = migrations.functions;
const expectedPolicies = migrations.policies;
const expectedIndexes = migrations.indexes;
const expectedTables = migrations.tables;
const expectedEnums = ['app_role', 'producer_status'];

const actualTables = new Set(audit.tables.rows.map(r => r.table_name));
const actualFuncs = new Set(audit.functions.rows.map(r => r.routine_name));
const actualTriggers = new Set(audit.triggers.rows.map(r => r.trigger_name));
const actualPolicies = new Set(audit.rls_policies.rows.map(r => r.policyname));
const actualIndexes = new Set(audit.indexes.rows.map(r => r.indexname));
const actualEnums = new Set(audit.enums.rows.map(r => r.enum_name));

// on_auth_user_created is on auth.users, not public schema, so it won't be in pg_catalog public query
const authTriggers = expectedTriggers.filter(t => t === 'on_auth_user_created');
const publicTriggers = expectedTriggers.filter(t => t !== 'on_auth_user_created');

console.log('=== FINAL SCHEMA COMPARISON: MIGRATIONS vs NEW PROJECT ===\n');

// Tables
const missingTables = expectedTables.filter(x => !actualTables.has(x));
console.log('Tables: expected=' + expectedTables.length + ', actual=' + actualTables.size);
if (missingTables.length) console.log('  MISSING:', missingTables);
else console.log('  ✅ All tables match');

// Functions
const missingFuncs = expectedFunctions.filter(x => !actualFuncs.has(x));
const extraFuncs = [...actualFuncs].filter(x => !expectedFunctions.includes(x));
console.log('\nFunctions: expected=' + expectedFunctions.length + ', actual=' + actualFuncs.size);
if (missingFuncs.length) console.log('  MISSING:', missingFuncs);
else console.log('  ✅ All functions match');
if (extraFuncs.length) console.log('  EXTRA in DB:', extraFuncs);

// Triggers
const missingPublicTriggers = publicTriggers.filter(x => !actualTriggers.has(x));
console.log('\nTriggers: expected=' + expectedTriggers.length + ' (public=' + publicTriggers.length + ', auth=' + authTriggers.length + '), actual public=' + actualTriggers.size);
if (missingPublicTriggers.length) console.log('  MISSING public triggers:', missingPublicTriggers);
else console.log('  ✅ All public triggers match');
if (authTriggers.length) console.log('  ⚠️  Auth schema trigger not verifiable via public schema query:', authTriggers);

// Policies
const missingPolicies = expectedPolicies.filter(x => !actualPolicies.has(x));
const extraPolicies = [...actualPolicies].filter(x => !expectedPolicies.includes(x));
console.log('\nRLS Policies: expected=' + expectedPolicies.length + ', actual=' + actualPolicies.size);
if (missingPolicies.length) console.log('  MISSING:', missingPolicies);
else console.log('  ✅ All policies match');
if (extraPolicies.length) console.log('  EXTRA in DB:', extraPolicies);

// Indexes
const missingIndexes = expectedIndexes.filter(x => !actualIndexes.has(x));
const extraIndexes = [...actualIndexes].filter(x => !expectedIndexes.includes(x));
console.log('\nIndexes: explicit expected=' + expectedIndexes.length + ', actual=' + actualIndexes.size);
if (missingIndexes.length) console.log('  MISSING explicit indexes:', missingIndexes);
else console.log('  ✅ All explicit indexes present');
console.log('  Note: ' + extraIndexes.length + ' additional indexes are auto-generated (PK/UNIQUE constraints)');

// Enums
const missingEnums = expectedEnums.filter(x => !actualEnums.has(x));
console.log('\nEnums: expected=' + expectedEnums.length + ', actual=' + actualEnums.size);
if (missingEnums.length) console.log('  MISSING:', missingEnums);
else console.log('  ✅ All enums match');

// Constraints
console.log('\nConstraints: actual=' + audit.constraints.rows.length);
console.log('Foreign Keys: actual=' + audit.foreign_keys.rows.length);

// RLS enabled
const rlsEnabledCount = audit.tables.rows.filter(r => r.rls_enabled).length;
console.log('\nRLS-enabled tables: expected=' + expectedTables.length + ', actual=' + rlsEnabledCount);
if (rlsEnabledCount !== expectedTables.length) {
  const missingRls = expectedTables.filter(t => !audit.tables.rows.find(r => r.table_name === t && r.rls_enabled));
  console.log('  Tables without RLS:', missingRls);
} else {
  console.log('  ✅ All tables have RLS enabled');
}

// Save report
const report = {
  summary: {
    tables: { expected: expectedTables.length, actual: actualTables.size, missing: missingTables },
    functions: { expected: expectedFunctions.length, actual: actualFuncs.size, missing: missingFuncs, extra: extraFuncs },
    triggers: { expected: expectedTriggers.length, actual_public: actualTriggers.size, missing_public: missingPublicTriggers, auth_only: authTriggers },
    policies: { expected: expectedPolicies.length, actual: actualPolicies.size, missing: missingPolicies, extra: extraPolicies },
    indexes: { expected: expectedIndexes.length, actual: actualIndexes.size, missing: missingIndexes },
    enums: { expected: expectedEnums.length, actual: actualEnums.size, missing: missingEnums },
    constraints: { actual: audit.constraints.rows.length },
    foreign_keys: { actual: audit.foreign_keys.rows.length },
    rls_enabled: { expected: expectedTables.length, actual: rlsEnabledCount }
  }
};
fs.writeFileSync('./final_migration_report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Report saved to tmp/final_migration_report.json');
