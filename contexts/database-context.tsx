import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDb } from '@/lib/database';
import { generateId, now } from '@/lib/id';
import type { Patient, Session, SessionNote, Diagnosis, Assessment, Book, BookAnnotation, ChatMessage, AppSettings } from '@/lib/types';

interface DatabaseContextType {
  // Patients
  patients: Patient[];
  loadPatients: () => Promise<void>;
  addPatient: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Promise<Patient | null>;

  // Sessions
  getSessionsByPatient: (patientId: string) => Promise<Session[]>;
  getTodaySessions: () => Promise<(Session & { patient_name: string })[]>;
  addSession: (data: Omit<Session, 'id' | 'created_at' | 'updated_at'>) => Promise<Session>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSession: (id: string) => Promise<Session | null>;

  // Session Notes
  getNotesBySession: (sessionId: string) => Promise<SessionNote[]>;
  addNote: (data: Omit<SessionNote, 'id' | 'created_at'>) => Promise<SessionNote>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Diagnoses
  getDiagnosesByPatient: (patientId: string) => Promise<Diagnosis[]>;
  addDiagnosis: (data: Omit<Diagnosis, 'id' | 'created_at'>) => Promise<Diagnosis>;
  deleteDiagnosis: (id: string) => Promise<void>;

  // Assessments
  getAssessmentsByPatient: (patientId: string) => Promise<Assessment[]>;
  addAssessment: (data: Omit<Assessment, 'id'>) => Promise<Assessment>;
  deleteAssessment: (id: string) => Promise<void>;

  // Books
  books: Book[];
  loadBooks: () => Promise<void>;
  addBook: (data: Omit<Book, 'id' | 'added_at'>) => Promise<Book>;
  updateBookPage: (id: string, page: number) => Promise<void>;
  deleteBook: (id: string) => Promise<Book | null>;

  // Book Annotations
  getAnnotationsByBook: (bookId: string) => Promise<BookAnnotation[]>;
  addAnnotation: (data: Omit<BookAnnotation, 'id' | 'created_at'>) => Promise<BookAnnotation>;
  deleteAnnotation: (id: string) => Promise<void>;

  // Chat Messages
  getMessages: (conversationId: string) => Promise<ChatMessage[]>;
  addMessage: (data: Omit<ChatMessage, 'id' | 'created_at'>) => Promise<ChatMessage>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;

  // Stats
  getStats: () => Promise<{ totalPatients: number; monthSessions: number; activeDiagnoses: number }>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});

  const loadPatients = useCallback(async () => {
    const db = getDb();
    const rows = await db.getAllAsync<Patient>('SELECT * FROM patients ORDER BY name ASC');
    setPatients(rows);
  }, []);

  const loadBooks = useCallback(async () => {
    const db = getDb();
    const rows = await db.getAllAsync<Book>('SELECT * FROM books ORDER BY added_at DESC');
    setBooks(rows);
  }, []);

  const loadSettings = useCallback(async () => {
    const db = getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM app_settings');
    const s: AppSettings = {};
    for (const r of rows) {
      (s as Record<string, string>)[r.key] = r.value;
    }
    setSettings(s);
  }, []);

  useEffect(() => {
    loadPatients();
    loadBooks();
    loadSettings();
  }, [loadPatients, loadBooks, loadSettings]);

  const addPatient = useCallback(async (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> => {
    const db = getDb();
    const patient: Patient = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO patients (id, name, birth_date, gender, contact, background, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient.id, patient.name, patient.birth_date ?? null, patient.gender ?? null, patient.contact ?? null, patient.background ?? null, patient.created_at, patient.updated_at]
    );
    await loadPatients();
    return patient;
  }, [loadPatients]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    const db = getDb();
    const updated_at = now();
    await db.runAsync(
      'UPDATE patients SET name=COALESCE(?,name), birth_date=COALESCE(?,birth_date), gender=COALESCE(?,gender), contact=COALESCE(?,contact), background=COALESCE(?,background), updated_at=? WHERE id=?',
      [data.name ?? null, data.birth_date ?? null, data.gender ?? null, data.contact ?? null, data.background ?? null, updated_at, id]
    );
    await loadPatients();
  }, [loadPatients]);

  const deletePatient = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM patients WHERE id=?', [id]);
    await loadPatients();
  }, [loadPatients]);

  const getPatient = useCallback(async (id: string): Promise<Patient | null> => {
    const db = getDb();
    return await db.getFirstAsync<Patient>('SELECT * FROM patients WHERE id=?', [id]);
  }, []);

  const getSessionsByPatient = useCallback(async (patientId: string): Promise<Session[]> => {
    const db = getDb();
    return await db.getAllAsync<Session>('SELECT * FROM sessions WHERE patient_id=? ORDER BY date DESC', [patientId]);
  }, []);

  const getTodaySessions = useCallback(async (): Promise<(Session & { patient_name: string })[]> => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    return await db.getAllAsync<Session & { patient_name: string }>(
      `SELECT s.*, p.name as patient_name FROM sessions s JOIN patients p ON s.patient_id = p.id WHERE date(s.date) = ? ORDER BY s.date ASC`,
      [today]
    );
  }, []);

  const addSession = useCallback(async (data: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> => {
    const db = getDb();
    const session: Session = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO sessions (id, patient_id, date, duration, session_number, status, summary, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [session.id, session.patient_id, session.date, session.duration ?? null, session.session_number ?? null, session.status, session.summary ?? null, session.created_at, session.updated_at]
    );
    return session;
  }, []);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    const db = getDb();
    await db.runAsync(
      'UPDATE sessions SET summary=COALESCE(?,summary), status=COALESCE(?,status), duration=COALESCE(?,duration), updated_at=? WHERE id=?',
      [data.summary ?? null, data.status ?? null, data.duration ?? null, now(), id]
    );
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM sessions WHERE id=?', [id]);
  }, []);

  const getSession = useCallback(async (id: string): Promise<Session | null> => {
    const db = getDb();
    return await db.getFirstAsync<Session>('SELECT * FROM sessions WHERE id=?', [id]);
  }, []);

  const getNotesBySession = useCallback(async (sessionId: string): Promise<SessionNote[]> => {
    const db = getDb();
    return await db.getAllAsync<SessionNote>('SELECT * FROM session_notes WHERE session_id=? ORDER BY created_at ASC', [sessionId]);
  }, []);

  const addNote = useCallback(async (data: Omit<SessionNote, 'id' | 'created_at'>): Promise<SessionNote> => {
    const db = getDb();
    const note: SessionNote = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO session_notes (id, session_id, category, content, created_at) VALUES (?,?,?,?,?)',
      [note.id, note.session_id, note.category, note.content, note.created_at]
    );
    return note;
  }, []);

  const updateNote = useCallback(async (id: string, content: string) => {
    const db = getDb();
    await db.runAsync('UPDATE session_notes SET content=? WHERE id=?', [content, id]);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM session_notes WHERE id=?', [id]);
  }, []);

  const getDiagnosesByPatient = useCallback(async (patientId: string): Promise<Diagnosis[]> => {
    const db = getDb();
    type DiagRow = Omit<Diagnosis, 'is_primary'> & { is_primary: number };
    const rows = await db.getAllAsync<DiagRow>('SELECT * FROM diagnoses WHERE patient_id=? ORDER BY created_at DESC', [patientId]);
    return rows.map(r => ({ ...r, is_primary: !!r.is_primary }));
  }, []);

  const addDiagnosis = useCallback(async (data: Omit<Diagnosis, 'id' | 'created_at'>): Promise<Diagnosis> => {
    const db = getDb();
    const diag: Diagnosis = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO diagnoses (id, patient_id, dsm_code, dsm_name, severity, is_primary, notes, date, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [diag.id, diag.patient_id, diag.dsm_code ?? null, diag.dsm_name ?? null, diag.severity ?? null, diag.is_primary ? 1 : 0, diag.notes ?? null, diag.date ?? null, diag.created_at]
    );
    return diag;
  }, []);

  const deleteDiagnosis = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM diagnoses WHERE id=?', [id]);
  }, []);

  const getAssessmentsByPatient = useCallback(async (patientId: string): Promise<Assessment[]> => {
    const db = getDb();
    return await db.getAllAsync<Assessment>('SELECT * FROM assessments WHERE patient_id=? ORDER BY date DESC', [patientId]);
  }, []);

  const addAssessment = useCallback(async (data: Omit<Assessment, 'id'>): Promise<Assessment> => {
    const db = getDb();
    const a: Assessment = { id: generateId(), ...data };
    await db.runAsync(
      'INSERT INTO assessments (id, patient_id, test_name, score, interpretation, date, notes) VALUES (?,?,?,?,?,?,?)',
      [a.id, a.patient_id, a.test_name, a.score ?? null, a.interpretation ?? null, a.date ?? null, a.notes ?? null]
    );
    return a;
  }, []);

  const deleteAssessment = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM assessments WHERE id=?', [id]);
  }, []);

  const addBook = useCallback(async (data: Omit<Book, 'id' | 'added_at'>): Promise<Book> => {
    const db = getDb();
    const book: Book = { id: generateId(), added_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO books (id, title, author, file_path, file_size, category, added_at, current_page) VALUES (?,?,?,?,?,?,?,?)',
      [book.id, book.title, book.author ?? null, book.file_path, book.file_size ?? null, book.category, book.added_at, 0]
    );
    await loadBooks();
    return book;
  }, [loadBooks]);

  const updateBookPage = useCallback(async (id: string, page: number) => {
    const db = getDb();
    await db.runAsync('UPDATE books SET current_page=?, last_read_at=? WHERE id=?', [page, now(), id]);
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<Book | null> => {
    const db = getDb();
    const book = await db.getFirstAsync<Book>('SELECT * FROM books WHERE id=?', [id]);
    await db.runAsync('DELETE FROM books WHERE id=?', [id]);
    await loadBooks();
    return book ?? null;
  }, [loadBooks]);

  const getAnnotationsByBook = useCallback(async (bookId: string): Promise<BookAnnotation[]> => {
    const db = getDb();
    return await db.getAllAsync<BookAnnotation>('SELECT * FROM book_annotations WHERE book_id=? ORDER BY page ASC', [bookId]);
  }, []);

  const addAnnotation = useCallback(async (data: Omit<BookAnnotation, 'id' | 'created_at'>): Promise<BookAnnotation> => {
    const db = getDb();
    const ann: BookAnnotation = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO book_annotations (id, book_id, page, content, created_at) VALUES (?,?,?,?,?)',
      [ann.id, ann.book_id, ann.page, ann.content, ann.created_at]
    );
    return ann;
  }, []);

  const deleteAnnotation = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM book_annotations WHERE id=?', [id]);
  }, []);

  const getMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    const db = getDb();
    return await db.getAllAsync<ChatMessage>('SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC', [conversationId]);
  }, []);

  const addMessage = useCallback(async (data: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> => {
    const db = getDb();
    const msg: ChatMessage = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO chat_messages (id, conversation_id, patient_id, role, content, created_at) VALUES (?,?,?,?,?,?)',
      [msg.id, msg.conversation_id, msg.patient_id ?? null, msg.role, msg.content, msg.created_at]
    );
    return msg;
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM chat_messages WHERE conversation_id=?', [conversationId]);
  }, []);

  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    const db = getDb();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        await db.runAsync(
          'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
          [key, value as string]
        );
      }
    }
    await loadSettings();
  }, [loadSettings]);

  const getStats = useCallback(async () => {
    const db = getDb();
    const totalPatients = (await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM patients'))?.count ?? 0;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthSessions = (await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE date >= ?',
      [startOfMonth.toISOString()]
    ))?.count ?? 0;
    const activeDiagnoses = (await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM diagnoses'))?.count ?? 0;
    return { totalPatients, monthSessions, activeDiagnoses };
  }, []);

  return (
    <DatabaseContext.Provider value={{
      patients, loadPatients, addPatient, updatePatient, deletePatient, getPatient,
      getSessionsByPatient, getTodaySessions, addSession, updateSession, deleteSession, getSession,
      getNotesBySession, addNote, updateNote, deleteNote,
      getDiagnosesByPatient, addDiagnosis, deleteDiagnosis,
      getAssessmentsByPatient, addAssessment, deleteAssessment,
      books, loadBooks, addBook, updateBookPage, deleteBook,
      getAnnotationsByBook, addAnnotation, deleteAnnotation,
      getMessages, addMessage, deleteConversation,
      settings, updateSettings, loadSettings,
      getStats,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
