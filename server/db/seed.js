const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/fleet.db');
const seedPath = path.join(__dirname, 'seed.sql');

const db = new Database(dbPath);

// Run seed
const seed = fs.readFileSync(seedPath, 'utf8');
db.exec(seed);

console.log('✅ Seed data loaded');
db.close();
