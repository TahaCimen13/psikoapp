import type { AnamnesisQuestion, AnamnesisAnswers } from './anamnesis';

export interface Patient {
  id: string;
  name: string;
  birth_date?: string;
  gender?: 'erkek' | 'kadin' | 'diger';
  contact?: string;
  background?: string;
  session_fee?: number;   // TL cinsinden seans ücreti
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

// SOAP: klinik not standardı — Subjektif / Objektif / Assessment (Değerlendirme) / Plan
export type SoapSectionValue = 'subjektif' | 'objektif' | 'degerlendirme' | 'plan';

// Eski serbest kategoriler (SOAP öncesi kayıtlarda hâlâ mevcut; silinmez, SOAP'a eşlenir)
export type LegacyNoteCategory = 'genel' | 'davranis' | 'duygu' | 'bilis' | 'hedef' | 'mudahale' | 'risk';

export interface SessionNote {
  id: string;
  session_id: string;
  category: SoapSectionValue | LegacyNoteCategory;
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

export const SOAP_SECTIONS: { value: SoapSectionValue; letter: string; label: string; hint: string }[] = [
  { value: 'subjektif', letter: 'S', label: 'Subjektif', hint: 'Danışanın kendi ifadeleri: şikayetler, duygular, aktardığı yaşantılar' },
  { value: 'objektif', letter: 'O', label: 'Objektif', hint: 'Sizin gözlemleriniz: görünüm, duygulanım, davranış, test sonuçları' },
  { value: 'degerlendirme', letter: 'A', label: 'Değerlendirme', hint: 'Klinik yorumunuz: ilerleme, formülasyon, risk değerlendirmesi' },
  { value: 'plan', letter: 'P', label: 'Plan', hint: 'Sonraki adımlar: müdahaleler, ödevler, bir sonraki seansın hedefi' },
];

// Eski kategorilerle kaydedilmiş notların SOAP bölümlerine eşlenmesi
export const LEGACY_CATEGORY_TO_SOAP: Record<LegacyNoteCategory, SoapSectionValue> = {
  genel: 'objektif',
  davranis: 'objektif',
  duygu: 'subjektif',
  bilis: 'subjektif',
  mudahale: 'plan',
  hedef: 'plan',
  risk: 'degerlendirme',
};

// Eski kategorilerin etiketleri (SOAP öncesi notların üzerinde rozet olarak gösterilir)
export const LEGACY_NOTE_LABELS: Record<LegacyNoteCategory, string> = {
  genel: 'Genel Gözlem',
  davranis: 'Davranış',
  duygu: 'Duygu Durum',
  bilis: 'Bilişsel İçerik',
  mudahale: 'Müdahale',
  hedef: 'Hedefler / Ödevler',
  risk: 'Risk Değerlendirmesi',
};

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
