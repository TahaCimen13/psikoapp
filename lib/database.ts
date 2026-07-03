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

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 50,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      duration INTEGER,
      session_number INTEGER,
      approach TEXT,
      mood_rating INTEGER,
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

    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS treatment_plans (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      approach TEXT,
      goals TEXT,
      interventions TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS risk_flags (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
      level TEXT NOT NULL DEFAULT 'dusuk',
      category TEXT NOT NULL DEFAULT 'diger',
      notes TEXT,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS kvkk_consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      disclosure_version TEXT,
      device_info TEXT,
      consented_at TEXT NOT NULL,
      revoked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await runMigrations();
}

// PIN unutulduğunda kullanılır: kilidin amacı veri koruması olduğundan
// PIN doğrulanmadan sıfırlama ancak tüm verilerin silinmesiyle mümkündür.
export async function wipeAllData(): Promise<void> {
  if (!db) return;
  await db.execAsync(`
    DELETE FROM chat_messages;
    DELETE FROM book_annotations;
    DELETE FROM books;
    DELETE FROM risk_flags;
    DELETE FROM treatment_plans;
    DELETE FROM homework;
    DELETE FROM assessments;
    DELETE FROM diagnoses;
    DELETE FROM session_notes;
    DELETE FROM sessions;
    DELETE FROM appointments;
    DELETE FROM patients;
    DELETE FROM app_settings;
  `);
}

async function runMigrations(): Promise<void> {
  if (!db) return;

  // Add new columns to sessions if they don't exist (migration for existing DBs)
  try {
    await db.execAsync('ALTER TABLE sessions ADD COLUMN approach TEXT');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE sessions ADD COLUMN mood_rating INTEGER');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE sessions ADD COLUMN appointment_id TEXT');
  } catch {}

  // KVKK 2026/347: aydınlatma metni versiyonu rızadan ayrı loglanır
  try {
    await db.execAsync('ALTER TABLE kvkk_consents ADD COLUMN disclosure_version TEXT');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE kvkk_consents ADD COLUMN device_info TEXT');
  } catch {}
}
