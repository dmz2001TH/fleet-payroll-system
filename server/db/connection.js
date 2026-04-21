const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/fleet.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Enable WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if needed
const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath = path.join(__dirname, 'seed.sql');

// Check if tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='drivers'").get();
if (!tables) {
  console.log('📦 Initializing database schema...');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  
  // Seed data
  const seed = fs.readFileSync(seedPath, 'utf8');
  db.exec(seed);
  console.log('✅ Database initialized and seeded');
}

module.exports = db;
