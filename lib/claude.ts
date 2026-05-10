import type { Patient, Session, SessionNote, Diagnosis, Assessment } from './types';

const BASE_SYSTEM = `Sen deneyimli bir klinik psikolog asistanısın. Türkçe konuşuyorsun.

Amacın psikologların:
- Hasta vakalarını değerlendirmesine
- DSM-5-TR tanı kriterlerini anlamasına
- Terapi planlaması yapmasına
- Psikoeğitim materyalleri hazırlamasına
- Vaka formülasyonu oluşturmasına
yardımcı olmak.

ETİK KURALLAR:
- Kesin tanı koyma; tanı kriterlerini açıkla ve değerlendirmeye yardım et
- İlaç önerme; farmakoterapiyi psikiyatristle görüşmelerini öner
- Hastanın gizliliğine saygı göster
- Acil durumlarda (intihar riski vb.) ilgili protokolleri hatırlat

Yanıtların kısa, net ve klinisyene pratik fayda sağlayacak şekilde olsun.`;

async function callClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API hatası: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text : '';
}

function buildPatientContext(patient: Patient, diagnoses: Diagnosis[]): string {
  const age = patient.birth_date
    ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
    : 'bilinmiyor';
  const diagList = diagnoses.length > 0
    ? diagnoses.map(d => `${d.dsm_name || d.dsm_code} (${d.severity || 'şiddet belirtilmemiş'})`).join(', ')
    : 'henüz tanı yok';
  return `Hasta: ${patient.name} | Yaş: ${age} | Tanılar: ${diagList} | Başvuru: ${patient.background || 'belirtilmemiş'}`;
}

// Genel AI sohbeti
export async function sendMessage(
  apiKey: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  patientContext?: { patient: Patient; diagnoses: Diagnosis[] }
): Promise<string> {
  let system = BASE_SYSTEM;
  if (patientContext) {
    system += `\n\n--- HASTA BAĞLAMI ---\n${buildPatientContext(patientContext.patient, patientContext.diagnoses)}`;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API hatası: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text : '';
}

// Seans özeti oluştur
export async function generateSessionSummary(
  apiKey: string,
  patient: Patient,
  session: Session,
  notes: SessionNote[]
): Promise<string> {
  const noteText = notes.map(n => `[${n.category.toUpperCase()}] ${n.content}`).join('\n');
  const system = `${BASE_SYSTEM}\n\nGörevin: Seans notlarından kısa, yapılandırılmış bir klinik özet çıkarmak. Format: (1) Ana Bulgular (2) Ruh Hali & Davranış (3) Müdahaleler (4) Sonraki Adımlar`;
  const prompt = `Hasta: ${patient.name}, Yaklaşım: ${session.approach || 'belirtilmemiş'}, Süre: ${session.duration || '?'} dk\n\nSeans Notları:\n${noteText || 'Not girilmemiş.'}`;

  return callClaude(apiKey, system, prompt);
}

// Vaka formülasyonu oluştur
export async function generateCaseFormulation(
  apiKey: string,
  patient: Patient,
  diagnoses: Diagnosis[],
  sessions: Session[],
  assessments: Assessment[]
): Promise<string> {
  const system = `${BASE_SYSTEM}\n\nGörevin: Biyopsikososyal vaka formülasyonu hazırlamak. Format: (1) Mevcut Şikayetler (2) Predispozan Faktörler (3) Tetikleyiciler (4) Sürdüren Faktörler (5) Koruyucu Faktörler (6) Tedavi Önerileri`;
  const assessText = assessments.map(a => `${a.test_name}: ${a.score ?? 'puan yok'} (${a.interpretation || '-'})`).join('\n');
  const prompt = `${buildPatientContext(patient, diagnoses)}\n\nToplam Seans: ${sessions.length}\nDeğerlendirmeler:\n${assessText || 'Değerlendirme yapılmamış.'}`;

  return callClaude(apiKey, system, prompt);
}

// Müdahale önerileri
export async function suggestInterventions(
  apiKey: string,
  patient: Patient,
  diagnoses: Diagnosis[],
  approach?: string
): Promise<string> {
  const system = `${BASE_SYSTEM}\n\nGörevin: Tanı ve terapi yaklaşımına göre kanıt temelli müdahale teknikleri önermek. Her teknik için kısa uygulama notu ekle.`;
  const prompt = `${buildPatientContext(patient, diagnoses)}\nTerapi Yaklaşımı: ${approach || 'belirtilmemiş'}\n\nBu hasta için uygulanabilir 4-6 müdahale tekniği öner.`;

  return callClaude(apiKey, system, prompt);
}

// Risk göstergesi tespiti
export async function detectRiskIndicators(
  apiKey: string,
  notes: SessionNote[]
): Promise<{ hasRisk: boolean; level: string; summary: string }> {
  const noteText = notes.map(n => n.content).join('\n');
  if (!noteText.trim()) return { hasRisk: false, level: 'yok', summary: 'Değerlendirilecek not yok.' };

  const system = `Sen bir klinik risk değerlendirme asistanısın. Seans notlarını analiz ederek intihar riski, kendine zarar verme, başkasına zarar verme veya kriz belirtileri olup olmadığını değerlendiriyorsun. Yanıtını JSON formatında ver: {"hasRisk": boolean, "level": "yok|dusuk|orta|yuksek|kritik", "summary": "kısa açıklama"}`;
  const prompt = `Aşağıdaki seans notlarında risk göstergesi var mı?\n\n${noteText}`;

  const raw = await callClaude(apiKey, system, prompt);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return { hasRisk: false, level: 'belirsiz', summary: raw };
}

// Psikoeğitim metni oluştur
export async function generatePsychoeducation(
  apiKey: string,
  topic: string,
  patient: Patient,
  diagnoses: Diagnosis[]
): Promise<string> {
  const system = `${BASE_SYSTEM}\n\nGörevin: Psikolog tarafından hastaya verilecek, anlaşılır ve empatik bir psikoeğitim metni yazmak. Teknik jargondan kaçın, somut örnekler kullan.`;
  const prompt = `${buildPatientContext(patient, diagnoses)}\n\nKonu: "${topic}" hakkında bu hastaya uygun bir psikoeğitim metni yaz. Yaklaşık 200-300 kelime.`;

  return callClaude(apiKey, system, prompt);
}

// Seans hazırlığı
export async function prepareSession(
  apiKey: string,
  patient: Patient,
  diagnoses: Diagnosis[],
  lastSessions: Session[],
  pendingHomework: string[]
): Promise<string> {
  const system = `${BASE_SYSTEM}\n\nGörevin: Psikologu bugünkü seans için hazırlamak. Önceki seans özetleri ve bekleyen ödevler dikkate alınarak odak noktaları, sorulacak sorular ve olası müdahaleler öner.`;
  const lastSummaries = lastSessions
    .filter(s => s.summary)
    .slice(0, 3)
    .map((s, i) => `Seans -${i + 1}: ${s.summary}`)
    .join('\n');
  const hwText = pendingHomework.length > 0 ? pendingHomework.join(', ') : 'Bekleyen ödev yok';
  const prompt = `${buildPatientContext(patient, diagnoses)}\n\nSon Seanslar:\n${lastSummaries || 'Geçmiş seans yok.'}\n\nBekleyen Ödevler: ${hwText}\n\nBugünkü seans için hazırlık notları yaz.`;

  return callClaude(apiKey, system, prompt);
}
