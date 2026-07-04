import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDb } from '@/lib/database';
import { generateId, now } from '@/lib/id';
import type {
  Patient, Appointment, Session, SessionNote, SessionNoteVersion, Diagnosis, Assessment,
  Homework, TreatmentPlan, RiskFlag, Book, BookAnnotation, ChatMessage, AppSettings, KvkkConsent,
  AnamnesisForm, AnamnesisResponse,
} from '@/lib/types';
import type { AnamnesisQuestion, AnamnesisAnswers } from '@/lib/anamnesis';

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
  getAppointmentsByRange: (startIso: string, endIso: string) => Promise<(Appointment & { patient_name: string })[]>;
  addAppointment: (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  deleteAppointmentSeries: (recurrenceId: string, fromDateIso: string) => Promise<string[]>;

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
  getNoteVersionsBySession: (sessionId: string) => Promise<SessionNoteVersion[]>;

  // Diagnoses
  getDiagnosesByPatient: (patientId: string) => Promise<Diagnosis[]>;
  addDiagnosis: (data: Omit<Diagnosis, 'id' | 'created_at'>) => Promise<Diagnosis>;
  updateDiagnosis: (id: string, data: Partial<Diagnosis>) => Promise<void>;
  deleteDiagnosis: (id: string) => Promise<void>;

  // Assessments
  getAssessmentsByPatient: (patientId: string) => Promise<Assessment[]>;
  addAssessment: (data: Omit<Assessment, 'id'>) => Promise<Assessment>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;

  // Homework
  getHomeworkByPatient: (patientId: string) => Promise<Homework[]>;
  addHomework: (data: Omit<Homework, 'id' | 'created_at'>) => Promise<Homework>;
  updateHomework: (id: string, data: Partial<Homework>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;

  // Treatment Plans
  getTreatmentPlan: (patientId: string) => Promise<TreatmentPlan | null>;
  saveTreatmentPlan: (data: Omit<TreatmentPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<TreatmentPlan>;

  // KVKK Consent
  getActiveConsent: (patientId: string) => Promise<KvkkConsent | null>;
  recordConsent: (patientId: string, version: string, disclosureVersion: string, deviceInfo: string) => Promise<KvkkConsent>;
  revokeConsent: (patientId: string) => Promise<void>;

  // Anamnesis
  getAnamnesisForms: () => Promise<AnamnesisForm[]>;
  getAnamnesisForm: (id: string) => Promise<AnamnesisForm | null>;
  addAnamnesisForm: (name: string, questions: AnamnesisQuestion[]) => Promise<AnamnesisForm>;
  updateAnamnesisForm: (id: string, name: string, questions: AnamnesisQuestion[]) => Promise<void>;
  deleteAnamnesisForm: (id: string) => Promise<void>;
  getAnamnesisResponsesByPatient: (patientId: string) => Promise<AnamnesisResponse[]>;
  getAnamnesisResponse: (id: string) => Promise<AnamnesisResponse | null>;
  addAnamnesisResponse: (patientId: string, form: AnamnesisForm, answers: AnamnesisAnswers) => Promise<AnamnesisResponse>;
  deleteAnamnesisResponse: (id: string) => Promise<void>;

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
      'INSERT INTO patients (id, name, birth_date, gender, contact, background, session_fee, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [p.id, p.name, p.birth_date ?? null, p.gender ?? null, p.contact ?? null, p.background ?? null, p.session_fee ?? null, p.created_at, p.updated_at]
    );
    await loadPatients();
    return p;
  }, [loadPatients]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    const db = getDb();
    await db.runAsync(
      'UPDATE patients SET name=COALESCE(?,name), birth_date=COALESCE(?,birth_date), gender=COALESCE(?,gender), contact=COALESCE(?,contact), background=COALESCE(?,background), session_fee=COALESCE(?,session_fee), updated_at=? WHERE id=?',
      [data.name ?? null, data.birth_date ?? null, data.gender ?? null, data.contact ?? null, data.background ?? null, data.session_fee ?? null, now(), id]
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

  // Randevu tarihleri her zaman UTC ISO (toISOString) olarak saklanır; böylece
  // string karşılaştırmaları kronolojik sıra ile birebir örtüşür ve lokal saat
  // dilimi (Türkiye) kaynaklı gün kaymaları oluşmaz.
  const getUpcomingAppointments = useCallback(async (): Promise<(Appointment & { patient_name: string })[]> => {
    const db = getDb();
    // "Yaklaşan" = lokal güne göre bugünün başlangıcından itibaren (UTC ISO'ya çevrilerek karşılaştırılır)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return db.getAllAsync<Appointment & { patient_name: string }>(
      `SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.date >= ? AND a.status='scheduled' ORDER BY a.date ASC LIMIT 50`,
      [startOfToday.toISOString()]
    );
  }, []);

  const getAppointmentsByRange = useCallback(async (startIso: string, endIso: string): Promise<(Appointment & { patient_name: string })[]> => {
    return getDb().getAllAsync<Appointment & { patient_name: string }>(
      `SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.date >= ? AND a.date < ? ORDER BY a.date ASC`,
      [startIso, endIso]
    );
  }, []);

  const addAppointment = useCallback(async (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> => {
    const db = getDb();
    const a: Appointment = {
      id: generateId(), created_at: now(), updated_at: now(), ...data,
      // Tarihi tutarlı UTC ISO formatına normalize et
      date: new Date(data.date).toISOString(),
    };
    await db.runAsync(
      'INSERT INTO appointments (id, patient_id, date, duration, notes, status, recurrence_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [a.id, a.patient_id, a.date, a.duration, a.notes ?? null, a.status, a.recurrence_id ?? null, a.created_at, a.updated_at]
    );
    return a;
  }, []);

  // Tekrarlayan seride "bu ve sonrakiler"i sil; silinen id'ler döner
  // (çağıran taraf bildirimleri iptal edebilsin diye)
  const deleteAppointmentSeries = useCallback(async (recurrenceId: string, fromDateIso: string): Promise<string[]> => {
    const db = getDb();
    const rows = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM appointments WHERE recurrence_id=? AND date>=?',
      [recurrenceId, fromDateIso]
    );
    await db.runAsync('DELETE FROM appointments WHERE recurrence_id=? AND date>=?', [recurrenceId, fromDateIso]);
    return rows.map(r => r.id);
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    const db = getDb();
    const normalizedDate = data.date ? new Date(data.date).toISOString() : null;
    await db.runAsync(
      'UPDATE appointments SET status=COALESCE(?,status), notes=COALESCE(?,notes), date=COALESCE(?,date), updated_at=? WHERE id=?',
      [data.status ?? null, data.notes ?? null, normalizedDate, now(), id]
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
    // "Bugün" lokal saate göre hesaplanır (UTC split hatası gece 00:00-03:00 arası yanlış gün veriyordu).
    // Lokal günün başlangıcı/bitişi UTC ISO'ya çevrilerek saklanan ISO tarihlerle tutarlı karşılaştırılır.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return getDb().getAllAsync<Session & { patient_name: string }>(
      `SELECT s.*, p.name as patient_name FROM sessions s JOIN patients p ON s.patient_id=p.id WHERE s.date >= ? AND s.date < ? ORDER BY s.date ASC`,
      [start.toISOString(), end.toISOString()]
    );
  }, []);

  const addSession = useCallback(async (data: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> => {
    const db = getDb();
    const s: Session = {
      id: generateId(), created_at: now(), updated_at: now(), ...data,
      // Seans tarihi de randevular gibi UTC ISO'ya normalize edilir
      date: new Date(data.date).toISOString(),
    };
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

  // Denetim izi: değişiklik/silme öncesi eski içerik arşivlenir, arşiv silinemez
  const archiveNoteVersion = useCallback(async (noteId: string, action: 'guncellendi' | 'silindi') => {
    const db = getDb();
    const old = await db.getFirstAsync<SessionNote>('SELECT * FROM session_notes WHERE id=?', [noteId]);
    if (!old) return;
    await db.runAsync(
      'INSERT INTO session_note_versions (id, note_id, session_id, category, content, action, archived_at) VALUES (?,?,?,?,?,?,?)',
      [generateId(), old.id, old.session_id, old.category, old.content, action, now()]
    );
  }, []);

  const updateNote = useCallback(async (id: string, content: string) => {
    await archiveNoteVersion(id, 'guncellendi');
    await getDb().runAsync('UPDATE session_notes SET content=? WHERE id=?', [content, id]);
  }, [archiveNoteVersion]);

  const deleteNote = useCallback(async (id: string) => {
    await archiveNoteVersion(id, 'silindi');
    await getDb().runAsync('DELETE FROM session_notes WHERE id=?', [id]);
  }, [archiveNoteVersion]);

  const getNoteVersionsBySession = useCallback(async (sessionId: string): Promise<SessionNoteVersion[]> => {
    return getDb().getAllAsync<SessionNoteVersion>(
      'SELECT * FROM session_note_versions WHERE session_id=? ORDER BY archived_at DESC',
      [sessionId]
    );
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

  const updateDiagnosis = useCallback(async (id: string, data: Partial<Diagnosis>) => {
    const db = getDb();
    // Birincil tanı tektir: bu kayıt birincil yapılıyorsa diğerlerini düşür
    if (data.is_primary) {
      const row = await db.getFirstAsync<{ patient_id: string }>('SELECT patient_id FROM diagnoses WHERE id=?', [id]);
      if (row) await db.runAsync('UPDATE diagnoses SET is_primary=0 WHERE patient_id=?', [row.patient_id]);
    }
    await db.runAsync(
      'UPDATE diagnoses SET severity=COALESCE(?,severity), is_primary=COALESCE(?,is_primary), notes=COALESCE(?,notes), date=COALESCE(?,date) WHERE id=?',
      [data.severity ?? null, data.is_primary === undefined ? null : (data.is_primary ? 1 : 0), data.notes ?? null, data.date ?? null, id]
    );
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
      'INSERT INTO assessments (id, patient_id, test_name, score, interpretation, date, notes, answers) VALUES (?,?,?,?,?,?,?,?)',
      [a.id, a.patient_id, a.test_name, a.score ?? null, a.interpretation ?? null, a.date ?? null, a.notes ?? null, a.answers ?? null]
    );
    return a;
  }, []);

  const updateAssessment = useCallback(async (id: string, data: Partial<Assessment>) => {
    await getDb().runAsync(
      'UPDATE assessments SET score=COALESCE(?,score), interpretation=COALESCE(?,interpretation), date=COALESCE(?,date), notes=COALESCE(?,notes) WHERE id=?',
      [data.score ?? null, data.interpretation ?? null, data.date ?? null, data.notes ?? null, id]
    );
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

  // --- KVKK Consent ---
  // Aktif rıza = geri çekilmemiş en güncel onay kaydı. Kayıtlar hiç silinmez
  // (denetim izi); geri çekme revoked_at doldurularak yapılır.
  const getActiveConsent = useCallback(async (patientId: string): Promise<KvkkConsent | null> => {
    return getDb().getFirstAsync<KvkkConsent>(
      'SELECT * FROM kvkk_consents WHERE patient_id=? AND revoked_at IS NULL ORDER BY consented_at DESC LIMIT 1',
      [patientId]
    );
  }, []);

  const recordConsent = useCallback(async (patientId: string, version: string, disclosureVersion: string, deviceInfo: string): Promise<KvkkConsent> => {
    const c: KvkkConsent = {
      id: generateId(), patient_id: patientId, version,
      disclosure_version: disclosureVersion, device_info: deviceInfo, consented_at: now(),
    };
    await getDb().runAsync(
      'INSERT INTO kvkk_consents (id, patient_id, version, disclosure_version, device_info, consented_at) VALUES (?,?,?,?,?,?)',
      [c.id, c.patient_id, c.version, c.disclosure_version!, c.device_info!, c.consented_at]
    );
    return c;
  }, []);

  const revokeConsent = useCallback(async (patientId: string) => {
    await getDb().runAsync(
      'UPDATE kvkk_consents SET revoked_at=? WHERE patient_id=? AND revoked_at IS NULL',
      [now(), patientId]
    );
  }, []);

  // --- Anamnesis ---
  // Sorular DB'de JSON saklanır; yanıtlar doldurma anındaki soru snapshot'ını
  // taşır, böylece form değişse/silinse de eski yanıtlar okunabilir kalır.
  type AnamnesisFormRow = Omit<AnamnesisForm, 'questions'> & { questions: string };
  type AnamnesisResponseRow = Omit<AnamnesisResponse, 'questions' | 'answers'> & { questions: string; answers: string };
  const parseForm = (r: AnamnesisFormRow): AnamnesisForm => ({ ...r, questions: JSON.parse(r.questions) });
  const parseResponse = (r: AnamnesisResponseRow): AnamnesisResponse => ({ ...r, questions: JSON.parse(r.questions), answers: JSON.parse(r.answers) });

  const getAnamnesisForms = useCallback(async (): Promise<AnamnesisForm[]> => {
    const rows = await getDb().getAllAsync<AnamnesisFormRow>('SELECT * FROM anamnesis_forms ORDER BY created_at ASC');
    return rows.map(parseForm);
  }, []);

  const getAnamnesisForm = useCallback(async (id: string): Promise<AnamnesisForm | null> => {
    const row = await getDb().getFirstAsync<AnamnesisFormRow>('SELECT * FROM anamnesis_forms WHERE id=?', [id]);
    return row ? parseForm(row) : null;
  }, []);

  const addAnamnesisForm = useCallback(async (name: string, questions: AnamnesisQuestion[]): Promise<AnamnesisForm> => {
    const f: AnamnesisForm = { id: generateId(), name, version: 1, questions, created_at: now(), updated_at: now() };
    await getDb().runAsync(
      'INSERT INTO anamnesis_forms (id, name, version, questions, created_at, updated_at) VALUES (?,?,?,?,?,?)',
      [f.id, f.name, f.version, JSON.stringify(f.questions), f.created_at, f.updated_at]
    );
    return f;
  }, []);

  const updateAnamnesisForm = useCallback(async (id: string, name: string, questions: AnamnesisQuestion[]) => {
    const row = await getDb().getFirstAsync<AnamnesisFormRow>('SELECT * FROM anamnesis_forms WHERE id=?', [id]);
    if (!row) return;
    // Sorular değiştiyse versiyon artar (hangi versiyonun doldurulduğu izlenebilsin)
    const changed = JSON.stringify(questions) !== row.questions;
    await getDb().runAsync(
      'UPDATE anamnesis_forms SET name=?, version=?, questions=?, updated_at=? WHERE id=?',
      [name, changed ? row.version + 1 : row.version, JSON.stringify(questions), now(), id]
    );
  }, []);

  const deleteAnamnesisForm = useCallback(async (id: string) => {
    // Yanıtlar form_id=NULL ile korunur (ON DELETE SET NULL), sağlık kaydı silinmez
    await getDb().runAsync('DELETE FROM anamnesis_forms WHERE id=?', [id]);
  }, []);

  const getAnamnesisResponsesByPatient = useCallback(async (patientId: string): Promise<AnamnesisResponse[]> => {
    const rows = await getDb().getAllAsync<AnamnesisResponseRow>('SELECT * FROM anamnesis_responses WHERE patient_id=? ORDER BY filled_at DESC', [patientId]);
    return rows.map(parseResponse);
  }, []);

  const getAnamnesisResponse = useCallback(async (id: string): Promise<AnamnesisResponse | null> => {
    const row = await getDb().getFirstAsync<AnamnesisResponseRow>('SELECT * FROM anamnesis_responses WHERE id=?', [id]);
    return row ? parseResponse(row) : null;
  }, []);

  const addAnamnesisResponse = useCallback(async (patientId: string, form: AnamnesisForm, answers: AnamnesisAnswers): Promise<AnamnesisResponse> => {
    const r: AnamnesisResponse = {
      id: generateId(), patient_id: patientId, form_id: form.id, form_name: form.name,
      form_version: form.version, questions: form.questions, answers, filled_at: now(),
    };
    await getDb().runAsync(
      'INSERT INTO anamnesis_responses (id, patient_id, form_id, form_name, form_version, questions, answers, filled_at) VALUES (?,?,?,?,?,?,?,?)',
      [r.id, r.patient_id, r.form_id!, r.form_name, r.form_version, JSON.stringify(r.questions), JSON.stringify(r.answers), r.filled_at]
    );
    return r;
  }, []);

  const deleteAnamnesisResponse = useCallback(async (id: string) => {
    await getDb().runAsync('DELETE FROM anamnesis_responses WHERE id=?', [id]);
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
      if (value === undefined || value === '') {
        await db.runAsync('DELETE FROM app_settings WHERE key=?', [key]);
      } else {
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
      getAppointmentsByPatient, getUpcomingAppointments, getAppointmentsByRange, addAppointment, updateAppointment, deleteAppointment, deleteAppointmentSeries,
      getSessionsByPatient, getTodaySessions, addSession, updateSession, deleteSession, getSession,
      getNotesBySession, addNote, updateNote, deleteNote, getNoteVersionsBySession,
      getDiagnosesByPatient, addDiagnosis, updateDiagnosis, deleteDiagnosis,
      getAssessmentsByPatient, addAssessment, updateAssessment, deleteAssessment,
      getHomeworkByPatient, addHomework, updateHomework, deleteHomework,
      getTreatmentPlan, saveTreatmentPlan,
      getActiveConsent, recordConsent, revokeConsent,
      getAnamnesisForms, getAnamnesisForm, addAnamnesisForm, updateAnamnesisForm, deleteAnamnesisForm,
      getAnamnesisResponsesByPatient, getAnamnesisResponse, addAnamnesisResponse, deleteAnamnesisResponse,
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
