const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('../supabase/migrations').filter(f => f.endsWith('.sql')).sort();

const policies = new Map(); // name -> { created: bool, dropped: bool }
const indexes = new Map();
const triggers = new Map();
const functions = new Map();
const tables = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join('../supabase/migrations', file), 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const upper = line.toUpperCase();
    
    // CREATE POLICY
    const createPol = line.match(/CREATE\s+POLICY\s+"([^"]+)"/i);
    if (createPol) {
      const name = createPol[1];
      policies.set(name, { ...(policies.get(name) || {}), created: true });
    }
    
    // DROP POLICY
    const dropPol = line.match(/DROP\s+POLICY\s+"([^"]+)"/i);
    if (dropPol) {
      const name = dropPol[1];
      policies.set(name, { ...(policies.get(name) || {}), dropped: true });
    }
    
    // DROP POLICY IF EXISTS
    const dropPolIf = line.match(/DROP\s+POLICY\s+IF\s+EXISTS\s+"([^"]+)"/i);
    if (dropPolIf) {
      const name = dropPolIf[1];
      policies.set(name, { ...(policies.get(name) || {}), dropped: true });
    }
    
    // CREATE INDEX
    const createIdx = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/i);
    if (createIdx) {
      const name = createIdx[1];
      indexes.set(name, { ...(indexes.get(name) || {}), created: true });
    }
    
    // DROP INDEX
    const dropIdx = line.match(/DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/i);
    if (dropIdx) {
      const name = dropIdx[1];
      indexes.set(name, { ...(indexes.get(name) || {}), dropped: true });
    }
    
    // CREATE TRIGGER
    const createTrig = line.match(/CREATE\s+TRIGGER\s+([a-z_][a-z0-9_]*)\s+(?:BEFORE|AFTER|INSTEAD\s+OF)/i);
    if (createTrig) {
      const name = createTrig[1];
      triggers.set(name, { ...(triggers.get(name) || {}), created: true, line: line.trim() });
    }
    
    // DROP TRIGGER
    const dropTrig = line.match(/DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/i);
    if (dropTrig) {
      const name = dropTrig[1];
      triggers.set(name, { ...(triggers.get(name) || {}), dropped: true });
    }
    
    // CREATE FUNCTION / CREATE OR REPLACE FUNCTION
    const createFunc = line.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z_][a-z0-9_]*)/i);
    if (createFunc) {
      const name = createFunc[1];
      functions.set(name, { ...(functions.get(name) || {}), created: true });
    }
    
    // DROP FUNCTION
    const dropFunc = line.match(/DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/i);
    if (dropFunc) {
      const name = dropFunc[1];
      functions.set(name, { ...(functions.get(name) || {}), dropped: true });
    }
    
    // CREATE TABLE
    const createTable = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/i);
    if (createTable) {
      tables.add(createTable[1]);
    }
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

if (activeTriggers.length < 20) {
  console.log('Trigger details:');
  for (const [k, v] of triggers.entries()) {
    console.log(' ', k, v);
  }
}

const result = {
  policies: activePolicies,
  indexes: activeIndexes,
  triggers: activeTriggers,
  functions: activeFunctions,
  tables: [...tables].sort(),
  raw: { policies: Object.fromEntries(policies), indexes: Object.fromEntries(indexes), triggers: Object.fromEntries(triggers), functions: Object.fromEntries(functions) }
};

fs.writeFileSync('./migration_objects_v2.json', JSON.stringify(result, null, 2));
