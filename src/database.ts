import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/todoer.db');

export interface Database {
  run: (sql: string, params?: any[]) => Promise<any>;
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  close: () => Promise<void>;
}

let db: sqlite3.Database;

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database at', DB_PATH);
        resolve();
      }
    });
  });
};

export const getDatabase = (): Database => {
  return {
    run: (sql: string, params: any[] = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    get: <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row as T | undefined);
        });
      });
    },
    all: <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve((rows || []) as T[]);
        });
      });
    },
    close: () => {
      return new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
};

export const initializeSchema = async (): Promise<void> => {
  const database = getDatabase();

  // Enable foreign keys
  await database.run('PRAGMA foreign_keys = ON');

  // Create tags table
  await database.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create todos table
  await database.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      date DATE NOT NULL,
      time TEXT,
      repeat_type TEXT DEFAULT 'NONE',
      repeat_days TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create todo_tags junction table
  await database.run(`
    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, tag_id),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // Create todo completions table
  await database.run(`
    CREATE TABLE IF NOT EXISTS todo_completions (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL,
      date DATE NOT NULL,
      completed BOOLEAN DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      UNIQUE(todo_id, date)
    )
  `);

  // Create checklist items table
  await database.run(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    )
  `);

  console.log('Database schema initialized successfully');
};
