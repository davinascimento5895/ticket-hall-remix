const fs = require('fs');

const audit = require('./new_schema_audit_pg.json');
const migrations = require('./migration_objects.json');

// Fix trigger parsing - get real trigger names from migrations
const path = require('path');
const files = fs.readdirSync('../supabase/migrations').filter(f => f.endsWith('.sql')).sort();
const realTriggers = new Set();
for (const file of files) {
  const content = fs.readFileSync(path.join('../supabase/migrations', file), 'utf8');
  // Match CREATE TRIGGER <name> [BEFORE|AFTER|INSTEAD OF] [EVENT] ON <table>
  const matches = content.match(/CREATE\s+TRIGGER\s+([a-z_][a-z0-9_]*)\s+(?:BEFORE|AFTER|INSTEAD\s+OF)/gi) || [];
  for (const m of matches) {
    const name = m.replace(/CREATE\s+TRIGGER\s+/i, '').replace(/\s+(?:BEFORE|AFTER|INSTEAD\s+OF)/i, '');
    realTriggers.add(name);
  }
}

console.log('=== COMPARISON: MIGRATIONS vs NEW PROJECT ===\n');

// Tables
const actualTables = new Set(audit.tables.rows.map(r => r.table_name));
const expectedTables = new Set(migrations.rlsTables); // All tables with RLS are all tables in this project
const missingTables = [...expectedTables].filter(x => !actualTables.has(x));
console.log('Tables: expected=' + expectedTables.size + ', actual=' + actualTables.size);
if (missingTables.length) console.log('  MISSING tables:', missingTables);
else console.log('  ✅ All tables match');

// Functions
const actualFuncs = new Set(audit.functions.rows.map(r => r.routine_name));
const expectedFuncs = new Set(migrations.functions);
const missingFuncs = [...expectedFuncs].filter(x => !actualFuncs.has(x));
const extraFuncs = [...actualFuncs].filter(x => !expectedFuncs.has(x));
console.log('\nFunctions: expected=' + expectedFuncs.size + ', actual=' + actualFuncs.size);
if (missingFuncs.length) console.log('  MISSING functions:', missingFuncs);
else console.log('  ✅ All functions match');
if (extraFuncs.length) console.log('  EXTRA functions in DB:', extraFuncs);

// Triggers
const actualTriggers = new Set(audit.triggers.rows.map(r => r.trigger_name));
const expectedTriggers = new Set(realTriggers);
const missingTriggers = [...expectedTriggers].filter(x => !actualTriggers.has(x));
const extraTriggers = [...actualTriggers].filter(x => !expectedTriggers.has(x));
console.log('\nTriggers: expected=' + expectedTriggers.size + ', actual=' + actualTriggers.size);
if (missingTriggers.length) console.log('  MISSING triggers:', missingTriggers);
else console.log('  ✅ All triggers match');
if (extraTriggers.length) console.log('  EXTRA triggers in DB:', extraTriggers);

// RLS Policies
const actualPolicies = new Set(audit.rls_policies.rows.map(r => r.policyname));
const expectedPolicies = new Set(migrations.policies);
const missingPolicies = [...expectedPolicies].filter(x => !actualPolicies.has(x));
const extraPolicies = [...actualPolicies].filter(x => !expectedPolicies.has(x));
console.log('\nRLS Policies: expected=' + expectedPolicies.size + ', actual=' + actualPolicies.size);
if (missingPolicies.length) console.log('  MISSING policies:', missingPolicies);
else console.log('  ✅ All policies match');
if (extraPolicies.length) console.log('  EXTRA policies in DB:', extraPolicies);

// Indexes
const actualIndexes = new Set(audit.indexes.rows.map(r => r.indexname));
const expectedIndexes = new Set(migrations.indexes);
const missingIndexes = [...expectedIndexes].filter(x => !actualIndexes.has(x));
console.log('\nIndexes: explicit from migrations=' + expectedIndexes.size + ', actual in DB=' + actualIndexes.size);
if (missingIndexes.length) console.log('  MISSING explicit indexes:', missingIndexes);
else console.log('  ✅ All explicit indexes present');

// Enums
const actualEnums = new Set(audit.enums.rows.map(r => r.enum_name));
const expectedEnums = new Set(migrations.enums);
const missingEnums = [...expectedEnums].filter(x => !actualEnums.has(x));
console.log('\nEnums: expected=' + expectedEnums.size + ', actual=' + actualEnums.size);
if (missingEnums.length) console.log('  MISSING enums:', missingEnums);
else console.log('  ✅ All enums match');

// Constraints summary
console.log('\nConstraints: actual=' + audit.constraints.rows.length);
console.log('Foreign Keys: actual=' + audit.foreign_keys.rows.length);

// RLS enabled
console.log('\nRLS-enabled tables: expected=' + migrations.rlsTables.length + ', actual=' + audit.rls_enabled.rows.filter(r => r.rls_enabled).length);

// Save detailed report
const report = {
  summary: {
    tables: { expected: expectedTables.size, actual: actualTables.size, missing: missingTables },
    functions: { expected: expectedFuncs.size, actual: actualFuncs.size, missing: missingFuncs, extra: extraFuncs },
    triggers: { expected: expectedTriggers.size, actual: actualTriggers.size, missing: missingTriggers, extra: extraTriggers },
    policies: { expected: expectedPolicies.size, actual: actualPolicies.size, missing: missingPolicies, extra: extraPolicies },
    indexes: { expected: expectedIndexes.size, actual: actualIndexes.size, missing: missingIndexes },
    enums: { expected: expectedEnums.size, actual: actualEnums.size, missing: missingEnums }
  },
  actual: {
    tables: [...actualTables].sort(),
    functions: [...actualFuncs].sort(),
    triggers: [...actualTriggers].sort(),
    policies: [...actualPolicies].sort(),
    indexes: [...actualIndexes].sort(),
    enums: [...actualEnums].sort()
  }
};
fs.writeFileSync('./migration_comparison.json', JSON.stringify(report, null, 2));
console.log('\nDetailed report saved to tmp/migration_comparison.json');
