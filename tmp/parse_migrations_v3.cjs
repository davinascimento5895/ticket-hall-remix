const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('../supabase/migrations').filter(f => f.endsWith('.sql')).sort();

const policies = new Map();
const indexes = new Map();
const triggers = new Map();
const functions = new Map();
const tables = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join('../supabase/migrations', file), 'utf8');
  
  // Parse policies with CREATE and DROP
  const polCreations = [...content.matchAll(/CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of polCreations) {
    policies.set(m[1], { ...(policies.get(m[1]) || {}), created: true, table: m[2] });
  }
  const polDrops = [...content.matchAll(/DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?"([^"]+)"/gi)];
  for (const m of polDrops) {
    policies.set(m[1], { ...(policies.get(m[1]) || {}), dropped: true });
  }
  
  // Parse indexes
  const idxCreations = [...content.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\s+ON\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of idxCreations) {
    indexes.set(m[1], { ...(indexes.get(m[1]) || {}), created: true, table: m[2] });
  }
  const idxDrops = [...content.matchAll(/DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of idxDrops) {
    indexes.set(m[1], { ...(indexes.get(m[1]) || {}), dropped: true });
  }
  
  // Parse triggers - multiline
  const trigMatches = [...content.matchAll(/CREATE\s+TRIGGER\s+([a-z_][a-z0-9_]*)[\s\S]*?EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of trigMatches) {
    triggers.set(m[1], { ...(triggers.get(m[1]) || {}), created: true, function: m[2] });
  }
  const trigDrops = [...content.matchAll(/DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\s+ON/gi)];
  for (const m of trigDrops) {
    triggers.set(m[1], { ...(triggers.get(m[1]) || {}), dropped: true });
  }
  
  // Parse functions
  const funcCreations = [...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)];
  for (const m of funcCreations) {
    functions.set(m[1], { ...(functions.get(m[1]) || {}), created: true });
  }
  const funcDrops = [...content.matchAll(/DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of funcDrops) {
    functions.set(m[1], { ...(functions.get(m[1]) || {}), dropped: true });
  }
  
  // Parse tables
  const tableCreations = [...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi)];
  for (const m of tableCreations) {
    tables.add(m[1]);
  }
}

const activePolicies = [...policies.entries()].filter(([k, v]) => v.created && !v.dropped).map(([k]) => k).sort();
const activeIndexes = [...indexes.entries()].filter(([k, v]) => v.created && !v.dropped).map(([k]) => k).sort();
const activeTriggers = [...triggers.entries()].filter(([k, v]) => v.created && !v.dropped).map(([k]) => k).sort();
const activeFunctions = [...functions.entries()].filter(([k, v]) => v.created && !v.dropped).map(([k]) => k).sort();

console.log('Active policies:', activePolicies.length);
console.log('Active indexes:', activeIndexes.length);
console.log('Active triggers:', activeTriggers.length);
console.log('Active functions:', activeFunctions.length);
console.log('Tables:', tables.size);
console.log('\nActive triggers:', activeTriggers.join(', '));
console.log('\nActive functions:', activeFunctions.join(', '));

const result = {
  policies: activePolicies,
  indexes: activeIndexes,
  triggers: activeTriggers,
  functions: activeFunctions,
  tables: [...tables].sort(),
  raw: { policies: Object.fromEntries(policies), indexes: Object.fromEntries(indexes), triggers: Object.fromEntries(triggers), functions: Object.fromEntries(functions) }
};

fs.writeFileSync('./migration_objects_v3.json', JSON.stringify(result, null, 2));
