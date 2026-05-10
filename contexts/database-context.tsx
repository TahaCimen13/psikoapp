import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDb } from '@/lib/database';
import { generateId, now } from '@/lib/id';
import type {
  Patient, Appointment, Session, SessionNote, Diagnosis, Assessment,
  Homework, TreatmentPlan, RiskFlag, Book, BookAnnotation, ChatMessage, AppSettings,
} from '@/lib/types';

interface DatabaseContextType {
  // Patients
  patients: Patient[];
  loadPatients: () => Promise<void>;
  addPatient: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Promise<Patient | null>;

  // Appointments
  getAppointmentsByPatient: (patientId: string) => Promise<Appointment[]>;
  getUpcomingAppointments: () => Promise<(Appointment & { patient_name: string })[]>;
  addAppointment: (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

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

  // Homework
  getHomeworkByPatient: (patientId: string) => Promise<Homework[]>;
  addHomework: (data: Omit<Homework, 'id' | 'created_at'>) => Promise<Homework>;
  updateHomework: (id: string, data: Partial<Homework>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;

  // Treatment Plans
  getTreatmentPlan: (patientId: string) => Promise<TreatmentPlan | null>;
  saveTreatmentPlan: (data: Omit<TreatmentPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<TreatmentPlan>;

  // Risk Flags
  getRiskFlagsByPatient: (patientId: string) => Promise<RiskFlag[]>;
  addRiskFlag: (data: Omit<RiskFlag, 'id' | 'created_at'>) => Promise<RiskFlag>;
  resolveRiskFlag: (id: string) => Promise<void>;
  getActiveRiskFlags: () => Promise<(RiskFlag & { patient_name: string })[]>;

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
  getStats: () => Promise<{ totalPatients: number; monthSessions: number; activeDiagnoses: number; activeRisks: number }>;
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
    for (const r of rows) (s as Record<string, string>)[r.key] = r.value;
    setSettings(s);
  }, []);

  useEffect(() => {
    loadPatients();
    loadBooks();
    loadSettings();
  }, [loadPatients, loadBooks, loadSettings]);

  // --- Patients ---
  const addPatient = useCallback(async (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> => {
    const db = getDb();
    const p: Patient = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO patients (id, name, birth_date, gender, contact, background, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
      [p.id, p.name, p.birth_date ?? null, p.gender ?? null, p.contact ?? null, p.background ?? null, p.created_at, p.updated_at]
    );
    await loadPatients();
    return p;
  }, [loadPatients]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    const db = getDb();
    await db.runAsync(
      'UPDATE patients SET name=COALESCE(?,name), birth_date=COALESCE(?,birth_date), gender=COALESCE(?,gender), contact=COALESCE(?,contact), background=COALESCE(?,background), updated_at=? WHERE id=?',
      [data.name ?? null, data.birth_date ?? null, data.gender ?? null, data.contact ?? null, data.background ?? null, now(), id]
    );
    await loadPatients();
  }, [loadPatients]);

  const deletePatient = useCallback(async (id: string) => {
    const db = getDb();
    await db.runAsync('DELETE FROM patients WHERE id=?', [id]);
    await loadPatients();
  }, [loadPatients]);

  const getPatient = useCallback(async (id: string): Promise<Patient | null> => {
    return getDb().getFirstAsync<Patient>('SELECT * FROM patients WHERE id=?', [id]);
  }, []);

  // --- Appointments ---
  const getAppointmentsByPatient = useCallback(async (patientId: string): Promise<Appointment[]> => {
    return getDb().getAllAsync<Appointment>('SELECT * FROM appointments WHERE patient_id=? ORDER BY date ASC', [patientId]);
  }, []);

  const getUpcomingAppointments = useCallback(async (): Promise<(Appointment & { patient_name: string })[]> => {
    const db = getDb();
    const now_ = new Date().toISOString();
    return db.getAllAsync<Appointment & { patient_name: string }>(
      `SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.date >= ? AND a.status='scheduled' ORDER BY a.date ASC LIMIT 50`,
      [now_]
    );
  }, []);

  const addAppointment = useCallback(async (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> => {
    const db = getDb();
    const a: Appointment = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO appointments (id, patient_id, date, duration, notes, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
      [a.id, a.patient_id, a.date, a.duration, a.notes ?? null, a.status, a.created_at, a.updated_at]
    );
    return a;
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    const db = getDb();
    await db.runAsync(
      'UPDATE appointments SET status=COALESCE(?,status), notes=COALESCE(?,notes), date=COALESCE(?,date), updated_at=? WHERE id=?',
      [data.status ?? null, data.notes ?? null, data.date ?? null, now(), id]
    );
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM appointments WHERE id=?', [id]);
  }, []);

  // --- Sessions ---
  const getSessionsByPatient = useCallback(async (patientId: string): Promise<Session[]> => {
    return getDb().getAllAsync<Session>('SELECT * FROM sessions WHERE patient_id=? ORDER BY date DESC', [patientId]);
  }, []);

  const getTodaySessions = useCallback(async (): Promise<(Session & { patient_name: string })[]> => {
    const today = new Date().toISOString().split('T')[0];
    return getDb().getAllAsync<Session & { patient_name: string }>(
      `SELECT s.*, p.name as patient_name FROM sessions s JOIN patients p ON s.patient_id=p.id WHERE date(s.date)=? ORDER BY s.date ASC`,
      [today]
    );
  }, []);

  const addSession = useCallback(async (data: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> => {
    const db = getDb();
    const s: Session = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO sessions (id, patient_id, appointment_id, date, duration, session_number, approach, mood_rating, status, summary, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [s.id, s.patient_id, s.appointment_id ?? null, s.date, s.duration ?? null, s.session_number ?? null, s.approach ?? null, s.mood_rating ?? null, s.status, s.summary ?? null, s.created_at, s.updated_at]
    );
    return s;
  }, []);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    await getDb().runAsync(
      'UPDATE sessions SET summary=COALESCE(?,summary), status=COALESCE(?,status), duration=COALESCE(?,duration), approach=COALESCE(?,approach), mood_rating=COALESCE(?,mood_rating), updated_at=? WHERE id=?',
      [data.summary ?? null, data.status ?? null, data.duration ?? null, data.approach ?? null, data.mood_rating ?? null, now(), id]
    );
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM sessions WHERE id=?', [id]);
  }, []);

  const getSession = useCallback(async (id: string): Promise<Session | null> => {
    return getDb().getFirstAsync<Session>('SELECT * FROM sessions WHERE id=?', [id]);
  }, []);

  // --- Session Notes ---
  const getNotesBySession = useCallback(async (sessionId: string): Promise<SessionNote[]> => {
    return getDb().getAllAsync<SessionNote>('SELECT * FROM session_notes WHERE session_id=? ORDER BY created_at ASC', [sessionId]);
  }, []);

  const addNote = useCallback(async (data: Omit<SessionNote, 'id' | 'created_at'>): Promise<SessionNote> => {
    const db = getDb();
    const n: SessionNote = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO session_notes (id, session_id, category, content, created_at) VALUES (?,?,?,?,?)',
      [n.id, n.session_id, n.category, n.content, n.created_at]
    );
    return n;
  }, []);

  const updateNote = useCallback(async (id: string, content: string) => {
    await getDb().runAsync('UPDATE session_notes SET content=? WHERE id=?', [content, id]);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM session_notes WHERE id=?', [id]);
  }, []);

  // --- Diagnoses ---
  const getDiagnosesByPatient = useCallback(async (patientId: string): Promise<Diagnosis[]> => {
    type DiagRow = Omit<Diagnosis, 'is_primary'> & { is_primary: number };
    const rows = await getDb().getAllAsync<DiagRow>('SELECT * FROM diagnoses WHERE patient_id=? ORDER BY created_at DESC', [patientId]);
    return rows.map(r => ({ ...r, is_primary: !!r.is_primary }));
  }, []);

  const addDiagnosis = useCallback(async (data: Omit<Diagnosis, 'id' | 'created_at'>): Promise<Diagnosis> => {
    const db = getDb();
    const d: Diagnosis = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO diagnoses (id, patient_id, dsm_code, dsm_name, severity, is_primary, notes, date, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [d.id, d.patient_id, d.dsm_code ?? null, d.dsm_name ?? null, d.severity ?? null, d.is_primary ? 1 : 0, d.notes ?? null, d.date ?? null, d.created_at]
    );
    return d;
  }, []);

  const deleteDiagnosis = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM diagnoses WHERE id=?', [id]);
  }, []);

  // --- Assessments ---
  const getAssessmentsByPatient = useCallback(async (patientId: string): Promise<Assessment[]> => {
    return getDb().getAllAsync<Assessment>('SELECT * FROM assessments WHERE patient_id=? ORDER BY date DESC', [patientId]);
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
    await getDb().runAsync('DELETE FROM assessments WHERE id=?', [id]);
  }, []);

  // --- Homework ---
  const getHomeworkByPatient = useCallback(async (patientId: string): Promise<Homework[]> => {
    return getDb().getAllAsync<Homework>('SELECT * FROM homework WHERE patient_id=? ORDER BY created_at DESC', [patientId]);
  }, []);

  const addHomework = useCallback(async (data: Omit<Homework, 'id' | 'created_at'>): Promise<Homework> => {
    const db = getDb();
    const h: Homework = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO homework (id, patient_id, session_id, title, description, due_date, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [h.id, h.patient_id, h.session_id ?? null, h.title, h.description ?? null, h.due_date ?? null, h.status, h.created_at]
    );
    return h;
  }, []);

  const updateHomework = useCallback(async (id: string, data: Partial<Homework>) => {
    const completed_at = data.status === 'completed' ? now() : null;
    await getDb().runAsync(
      'UPDATE homework SET status=COALESCE(?,status), completed_at=COALESCE(?,completed_at) WHERE id=?',
      [data.status ?? null, completed_at, id]
    );
  }, []);

  const deleteHomework = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM homework WHERE id=?', [id]);
  }, []);

  // --- Treatment Plans ---
  const getTreatmentPlan = useCallback(async (patientId: string): Promise<TreatmentPlan | null> => {
    return getDb().getFirstAsync<TreatmentPlan>('SELECT * FROM treatment_plans WHERE patient_id=? ORDER BY updated_at DESC LIMIT 1', [patientId]);
  }, []);

  const saveTreatmentPlan = useCallback(async (data: Omit<TreatmentPlan, 'id' | 'created_at' | 'updated_at'>): Promise<TreatmentPlan> => {
    const db = getDb();
    const existing = await db.getFirstAsync<TreatmentPlan>('SELECT id FROM treatment_plans WHERE patient_id=?', [data.patient_id]);
    if (existing) {
      await db.runAsync(
        'UPDATE treatment_plans SET approach=?, goals=?, interventions=?, notes=?, updated_at=? WHERE id=?',
        [data.approach ?? null, data.goals ?? null, data.interventions ?? null, data.notes ?? null, now(), existing.id]
      );
      return { ...existing, ...data, updated_at: now() };
    }
    const t: TreatmentPlan = { id: generateId(), created_at: now(), updated_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO treatment_plans (id, patient_id, approach, goals, interventions, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
      [t.id, t.patient_id, t.approach ?? null, t.goals ?? null, t.interventions ?? null, t.notes ?? null, t.created_at, t.updated_at]
    );
    return t;
  }, []);

  // --- Risk Flags ---
  const getRiskFlagsByPatient = useCallback(async (patientId: string): Promise<RiskFlag[]> => {
    type RiskRow = Omit<RiskFlag, 'resolved'> & { resolved: number };
    const rows = await getDb().getAllAsync<RiskRow>('SELECT * FROM risk_flags WHERE patient_id=? ORDER BY created_at DESC', [patientId]);
    return rows.map(r => ({ ...r, resolved: !!r.resolved }));
  }, []);

  const addRiskFlag = useCallback(async (data: Omit<RiskFlag, 'id' | 'created_at'>): Promise<RiskFlag> => {
    const db = getDb();
    const r: RiskFlag = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO risk_flags (id, patient_id, session_id, level, category, notes, resolved, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [r.id, r.patient_id, r.session_id ?? null, r.level, r.category, r.notes ?? null, r.resolved ? 1 : 0, r.created_at]
    );
    return r;
  }, []);

  const resolveRiskFlag = useCallback(async (id: string) => {
    await getDb().runAsync('UPDATE risk_flags SET resolved=1 WHERE id=?', [id]);
  }, []);

  const getActiveRiskFlags = useCallback(async (): Promise<(RiskFlag & { patient_name: string })[]> => {
    type Row = Omit<RiskFlag, 'resolved'> & { resolved: number; patient_name: string };
    const rows = await getDb().getAllAsync<Row>(
      `SELECT r.*, p.name as patient_name FROM risk_flags r JOIN patients p ON r.patient_id=p.id WHERE r.resolved=0 ORDER BY r.created_at DESC`
    );
    return rows.map(r => ({ ...r, resolved: false }));
  }, []);

  // --- Books ---
  const addBook = useCallback(async (data: Omit<Book, 'id' | 'added_at'>): Promise<Book> => {
    const db = getDb();
    const b: Book = { id: generateId(), added_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO books (id, title, author, file_path, file_size, category, added_at, current_page) VALUES (?,?,?,?,?,?,?,?)',
      [b.id, b.title, b.author ?? null, b.file_path, b.file_size ?? null, b.category, b.added_at, 0]
    );
    await loadBooks();
    return b;
  }, [loadBooks]);

  const updateBookPage = useCallback(async (id: string, page: number) => {
    await getDb().runAsync('UPDATE books SET current_page=?, last_read_at=? WHERE id=?', [page, now(), id]);
  }, []);

  const deleteBook = useCallback(async (id: string): Promise<Book | null> => {
    const db = getDb();
    const book = await db.getFirstAsync<Book>('SELECT * FROM books WHERE id=?', [id]);
    await db.runAsync('DELETE FROM books WHERE id=?', [id]);
    await loadBooks();
    return book ?? null;
  }, [loadBooks]);

  const getAnnotationsByBook = useCallback(async (bookId: string): Promise<BookAnnotation[]> => {
    return getDb().getAllAsync<BookAnnotation>('SELECT * FROM book_annotations WHERE book_id=? ORDER BY page ASC', [bookId]);
  }, []);

  const addAnnotation = useCallback(async (data: Omit<BookAnnotation, 'id' | 'created_at'>): Promise<BookAnnotation> => {
    const db = getDb();
    const a: BookAnnotation = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO book_annotations (id, book_id, page, content, created_at) VALUES (?,?,?,?,?)',
      [a.id, a.book_id, a.page, a.content, a.created_at]
    );
    return a;
  }, []);

  const deleteAnnotation = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM book_annotations WHERE id=?', [id]);
  }, []);

  // --- Chat ---
  const getMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    return getDb().getAllAsync<ChatMessage>('SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC', [conversationId]);
  }, []);

  const addMessage = useCallback(async (data: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> => {
    const db = getDb();
    const m: ChatMessage = { id: generateId(), created_at: now(), ...data };
    await db.runAsync(
      'INSERT INTO chat_messages (id, conversation_id, patient_id, role, content, created_at) VALUES (?,?,?,?,?,?)',
      [m.id, m.conversation_id, m.patient_id ?? null, m.role, m.content, m.created_at]
    );
    return m;
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    await getDb().runAsync('DELETE FROM chat_messages WHERE conversation_id=?', [conversationId]);
  }, []);

  // --- Settings ---
  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    const db = getDb();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?,?)', [key, value as string]);
      }
    }
    await loadSettings();
  }, [loadSettings]);

  // --- Stats ---
  const getStats = useCallback(async () => {
    const db = getDb();
    const totalPatients = (await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM patients'))?.count ?? 0;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const monthSessions = (await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE date >= ?', [startOfMonth.toISOString()]
    ))?.count ?? 0;
    const activeDiagnoses = (await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM diagnoses'))?.count ?? 0;
    const activeRisks = (await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM risk_flags WHERE resolved=0'))?.count ?? 0;
    return { totalPatients, monthSessions, activeDiagnoses, activeRisks };
  }, []);

  return (
    <DatabaseContext.Provider value={{
      patients, loadPatients, addPatient, updatePatient, deletePatient, getPatient,
      getAppointmentsByPatient, getUpcomingAppointments, addAppointment, updateAppointment, deleteAppointment,
      getSessionsByPatient, getTodaySessions, addSession, updateSession, deleteSession, getSession,
      getNotesBySession, addNote, updateNote, deleteNote,
      getDiagnosesByPatient, addDiagnosis, deleteDiagnosis,
      getAssessmentsByPatient, addAssessment, deleteAssessment,
      getHomeworkByPatient, addHomework, updateHomework, deleteHomework,
      getTreatmentPlan, saveTreatmentPlan,
      getRiskFlagsByPatient, addRiskFlag, resolveRiskFlag, getActiveRiskFlags,
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
