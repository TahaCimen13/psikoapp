import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('psikoapp.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date TEXT,
      gender TEXT,
      contact TEXT,
      background TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      duration INTEGER,
      session_number INTEGER,
      status TEXT NOT NULL DEFAULT 'completed',
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_notes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'genel',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      dsm_code TEXT,
      dsm_name TEXT,
      severity TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      test_name TEXT NOT NULL,
      score REAL,
      interpretation TEXT,
      date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      category TEXT DEFAULT 'Diger',
      added_at TEXT NOT NULL,
      last_read_at TEXT,
      current_page INTEGER NOT NULL DEFAULT 0,
      total_pages INTEGER
    );

    CREATE TABLE IF NOT EXISTS book_annotations (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      page INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      patient_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
