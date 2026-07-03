import type { AnamnesisQuestion, AnamnesisAnswers } from './anamnesis';

export interface Patient {
  id: string;
  name: string;
  birth_date?: string;
  gender?: 'erkek' | 'kadin' | 'diger';
  contact?: string;
  background?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  date: string;
  duration: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  appointment_id?: string;
  date: string;
  duration?: number;
  session_number?: number;
  approach?: 'BDT' | 'DBT' | 'ACT' | 'Psikodinamik' | 'EMDR' | 'Diger';
  mood_rating?: number;
  status: 'planned' | 'completed' | 'cancelled';
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionNote {
  id: string;
  session_id: string;
  category: 'genel' | 'davranis' | 'duygu' | 'bilis' | 'hedef' | 'mudahale' | 'risk';
  content: string;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  dsm_code?: string;
  dsm_name?: string;
  severity?: 'hafif' | 'orta' | 'siddetli';
  is_primary: boolean;
  notes?: string;
  date?: string;
  created_at: string;
}

export interface Assessment {
  id: string;
  patient_id: string;
  test_name: string;
  score?: number;
  interpretation?: string;
  date?: string;
  notes?: string;
}

export interface Homework {
  id: string;
  patient_id: string;
  session_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  approach?: string;
  goals?: string;
  interventions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskFlag {
  id: string;
  patient_id: string;
  session_id?: string;
  level: 'dusuk' | 'orta' | 'yuksek' | 'kritik';
  category: 'intihar' | 'siddet' | 'ihmal' | 'madde' | 'diger';
  notes?: string;
  resolved: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  file_path: string;
  file_size?: number;
  category: 'DSM' | 'BDT' | 'Psikodinami' | 'Noropsikoloji' | 'Diger';
  added_at: string;
  last_read_at?: string;
  current_page: number;
  total_pages?: number;
}

export interface BookAnnotation {
  id: string;
  book_id: string;
  page: number;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  patient_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface KvkkConsent {
  id: string;
  patient_id: string;
  version: string;             // onaylanan açık rıza metninin versiyonu (örn. "1.0")
  disclosure_version?: string; // gösterilen aydınlatma metninin versiyonu (2026/347: ayrı metin, ayrı log)
  device_info?: string;        // rızanın alındığı cihaz (denetim izi)
  consented_at: string;
  revoked_at?: string;         // geri çekildiyse; kayıt silinmez (denetim izi)
}

export interface AnamnesisForm {
  id: string;
  name: string;
  version: number;              // sorular her değiştiğinde +1
  questions: AnamnesisQuestion[];
  created_at: string;
  updated_at: string;
}

export interface AnamnesisResponse {
  id: string;
  patient_id: string;
  form_id?: string;             // form silinirse null kalır, yanıt yaşamaya devam eder
  form_name: string;
  form_version: number;
  questions: AnamnesisQuestion[]; // doldurma anındaki soruların snapshot'ı
  answers: AnamnesisAnswers;
  filled_at: string;
}

export interface AppSettings {
  claude_api_key?: string;
  psychologist_name?: string;
  psychologist_title?: string;
  pin_enabled?: string;
  auto_lock_minutes?: string;
}

export const NOTE_CATEGORIES: { value: SessionNote['category']; label: string }[] = [
  { value: 'genel', label: 'Genel Gözlem' },
  { value: 'davranis', label: 'Davranış' },
  { value: 'duygu', label: 'Duygu Durum' },
  { value: 'bilis', label: 'Bilişsel İçerik' },
  { value: 'mudahale', label: 'Müdahale' },
  { value: 'hedef', label: 'Hedefler / Ödevler' },
  { value: 'risk', label: 'Risk Değerlendirmesi' },
];

export const SESSION_APPROACHES = [
  'BDT', 'DBT', 'ACT', 'Psikodinamik', 'EMDR', 'Diger',
] as const;

export const ASSESSMENT_TESTS = [
  'BDI-II (Beck Depresyon Envanteri)',
  'BAI (Beck Anksiyete Envanteri)',
  'SCL-90-R',
  'MMPI-2',
  'Hamilton Depresyon Ölçeği',
  'Hamilton Anksiyete Ölçeği',
  'PHQ-9',
  'GAD-7',
  'PCL-5 (PTSD)',
  'YSQ (Young Şema Ölçeği)',
  'Diger',
];
