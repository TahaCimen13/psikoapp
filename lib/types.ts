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

export interface Session {
  id: string;
  patient_id: string;
  date: string;
  duration?: number;
  session_number?: number;
  status: 'planned' | 'completed' | 'cancelled';
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionNote {
  id: string;
  session_id: string;
  category: 'genel' | 'davranis' | 'duygu' | 'bilis' | 'hedef' | 'mudahale';
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

export interface AppSettings {
  claude_api_key?: string;
  psychologist_name?: string;
  psychologist_title?: string;
}

export const NOTE_CATEGORIES: { value: SessionNote['category']; label: string }[] = [
  { value: 'genel', label: 'Genel Gozlem' },
  { value: 'davranis', label: 'Davranis' },
  { value: 'duygu', label: 'Duygu Durum' },
  { value: 'bilis', label: 'Bilissel Icerik' },
  { value: 'mudahale', label: 'Mudahale' },
  { value: 'hedef', label: 'Hedefler / Odevler' },
];

export const ASSESSMENT_TESTS = [
  'BDI-II (Beck Depresyon Envanteri)',
  'BAI (Beck Anksiyete Envanteri)',
  'SCL-90-R',
  'MMPI-2',
  'Hamilton Depresyon Olcegi',
  'Hamilton Anksiyete Olcegi',
  'PHQ-9',
  'GAD-7',
  'PCL-5 (PTSD)',
  'YSQ (Young Sema Olcegi)',
  'Diger',
];
