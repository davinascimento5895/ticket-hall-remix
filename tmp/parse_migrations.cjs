const fs = require('fs');
const path = require('path');
const files = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();

const enums = new Set();
const funcs = new Set();
const triggers = new Set();
const policies = new Set();
const indexes = new Set();
const rlsTables = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join('supabase/migrations', file), 'utf8');
  
  const enumMatches = content.match(/CREATE TYPE\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+AS ENUM/gi) || [];
  for (const m of enumMatches) {
    const name = m.replace(/CREATE TYPE\s+(?:public\.)?/i, '').replace(/\s+AS ENUM/i, '');
    enums.add(name);
  }
  
  const enumAlterMatches = content.match(/ALTER TYPE\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of enumAlterMatches) {
    const name = m.replace(/ALTER TYPE\s+(?:public\.)?/i, '');
    enums.add(name);
  }

  const funcMatches = content.match(/CREATE OR REPLACE FUNCTION\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of funcMatches) {
    const name = m.replace(/CREATE OR REPLACE FUNCTION\s+(?:public\.)?/i, '');
    funcs.add(name);
  }
  
  const funcMatches2 = content.match(/CREATE FUNCTION\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of funcMatches2) {
    const name = m.replace(/CREATE FUNCTION\s+(?:public\.)?/i, '');
    funcs.add(name);
  }

  const trigMatches = content.match(/CREATE TRIGGER\s+([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of trigMatches) {
    const name = m.replace(/CREATE TRIGGER\s+/i, '');
    triggers.add(name);
  }

  const polMatches = content.match(/CREATE POLICY\s+"([^"]+)"/g) || [];
  for (const m of polMatches) {
    const name = m.match(/"([^"]+)"/)[1];
    policies.add(name);
  }

  const idxMatches = content.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of idxMatches) {
    const name = m.replace(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?/i, '');
    indexes.add(name);
  }

  const uniqMatches = content.match(/CREATE UNIQUE INDEX\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)/gi) || [];
  for (const m of uniqMatches) {
    const name = m.replace(/CREATE UNIQUE INDEX\s+(?:IF NOT EXISTS\s+)?/i, '');
    indexes.add(name);
  }

  const rlsMatches = content.match(/ALTER TABLE\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+ENABLE ROW LEVEL SECURITY/gi) || [];
  for (const m of rlsMatches) {
    const name = m.replace(/ALTER TABLE\s+(?:public\.)?/i, '').replace(/\s+ENABLE ROW LEVEL SECURITY/i, '');
    rlsTables.add(name);
  }
}

console.log('Enums from migrations:', Array.from(enums).sort().join(', '));
console.log('Functions from migrations:', funcs.size);
console.log('Triggers from migrations:', Array.from(triggers).sort().join(', '));
console.log('Policies from migrations:', policies.size);
console.log('Indexes from migrations:', indexes.size);
console.log('RLS-enabled tables from migrations:', rlsTables.size);

// Also save for later comparison
const result = {
  enums: Array.from(enums).sort(),
  functions: Array.from(funcs).sort(),
  triggers: Array.from(triggers).sort(),
  policies: Array.from(policies).sort(),
  indexes: Array.from(indexes).sort(),
  rlsTables: Array.from(rlsTables).sort()
};
fs.writeFileSync('tmp/migration_objects.json', JSON.stringify(result, null, 2));
