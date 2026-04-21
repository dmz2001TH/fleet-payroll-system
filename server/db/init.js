const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/fleet.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Run schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('✅ Database initialized at', dbPath);
db.close();
