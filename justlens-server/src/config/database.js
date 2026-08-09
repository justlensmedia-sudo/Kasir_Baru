const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

const fs = require('fs');

dotenv.config();

// Determine database file path (pkg executable compatible)
const isPkg = typeof process.pkg !== 'undefined';
const defaultDbName = 'database.sqlite';
const defaultDbPath = isPkg 
  ? path.join(path.dirname(process.execPath), defaultDbName) 
  : path.resolve('./src/database', defaultDbName);

const dbPath = path.resolve(process.env.DB_PATH || defaultDbPath);

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Fallback: If target database.sqlite does not exist, copy from justlens.sqlite if available
if (!fs.existsSync(dbPath)) {
  const legacyDb = isPkg
    ? path.join(path.dirname(process.execPath), 'justlens.sqlite')
    : path.resolve('./src/database/justlens.sqlite');
  if (fs.existsSync(legacyDb)) {
    try {
      fs.copyFileSync(legacyDb, dbPath);
      console.log(`✓ Copied existing database from ${legacyDb} to ${dbPath}`);
    } catch (e) {
      console.warn('⚠️ Gagal menyalin legacy database:', e.message);
    }
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal terhubung ke database SQLite:', err.message);
  } else {
    console.log(`Terhubung ke database SQLite at: ${dbPath}`);
  }
});

// Enable Foreign Keys in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Helper functions for Promise-based database queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  db,
  query,
  get,
  run,
  exec
};
