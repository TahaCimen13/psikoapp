import { fetch } from 'expo/fetch';
import type { Patient, Session, SessionNote, Diagnosis, Assessment } from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 2048;

const BASE_SYSTEM = `Sen deneyimli bir klinik psikolog asistanısın. Türkçe konuşuyorsun.

Amacın psikologların:
- Danışan vakalarını değerlendirmesine
- DSM-5-TR tanı kriterlerini anlamasına
- Terapi planlaması yapmasına
- Psikoeğitim materyalleri hazırlamasına
- Vaka formülasyonu oluşturmasına
yardımcı olmak.

ETİK KURALLAR:
- Kesin tanı koyma; tanı kriterlerini açıkla ve değerlendirmeye yardım et
- İlaç önerme; farmakoterapiyi psikiyatristle görüşmelerini öner
- Danışanın gizliliğine saygı göster
- Acil durumlarda (intihar riski vb.) ilgili protokolleri hatırlat

Yanıtların kısa, net ve klinisyene pratik fayda sağlayacak şekilde olsun.`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

// ---- Hata yönetimi (Türkçe, kullanıcıya gösterilebilir mesajlar) ----

function apiError(status: number): Error {
  let msg: string;
  if (status === 401) {
    msg = 'API anahtarı geçersiz veya süresi dolmuş. Ayarlar ekranından anahtarınızı kontrol edin.';
  } else if (status === 403) {
    msg = 'API anahtarınızın bu işlem için yetkisi yok. Ayarlardan anahtarınızı kontrol edin.';
  } else if (status === 404) {
    msg = 'AI modeli bulunamadı. Uygulamayı güncellemeniz gerekebilir.';
  } else if (status === 413) {
    msg = 'Gönderilen içerik çok uzun. Lütfen mesajınızı kısaltıp tekrar deneyin.';
  } else if (status === 429) {
    msg = 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.';
  } else if (status >= 500) {
    msg = 'AI servisi şu anda yoğun veya geçici bir sorun yaşıyor. Lütfen kısa bir süre sonra tekrar deneyin.';
  } else if (status === 400) {
    msg = 'İstek işlenemedi. Lütfen mesajınızı düzenleyip tekrar deneyin.';
  } else {
    msg = `Beklenmeyen bir hata oluştu (kod: ${status}). Lütfen tekrar deneyin.`;
  }
  return new Error(msg);
}

function networkError(): Error {
  return new Error('AI servisine ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
}

// ---- Gizlilik (KVKK): hasta adı API'ye asla gönderilmez ----

/**
 * Hastanın gerçek adı yerine yalnızca baş harflerini içeren
 * anonim bir etiket döndürür (örn. "Ayşe Yılmaz" -> "Danışan A.Y.").
 */
function anonymizePatientName(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'Danışan';
  const initials = trimmed
    .split(/\s+/)
    .map(part => part.charAt(0).toLocaleUpperCase('tr-TR') + '.')
    .join('');
  return `Danışan ${initials}`;
}

function buildPatientContext(patient: Patient, diagnoses: Diagnosis[]): string {
  const age = patient.birth_date
    ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
    : 'bilinmiyor';
  const diagList = diagnoses.length > 0
    ? diagnoses.map(d => `${d.dsm_name || d.dsm_code} (${d.severity || 'şiddet belirtilmemiş'})`).join(', ')
    : 'henüz tanı yok';
  // KVKK: gerçek ad yerine anonim etiket kullanılır
  return `Hasta: ${anonymizePatientName(patient.name)} | Yaş: ${age} | Tanılar: ${diagList} | Başvuru: ${patient.background || 'belirtilmemiş'}`;
}

// ---- Temel API çağrıları ----

function requestBody(system: string, messages: ChatTurn[], stream: boolean) {
  return JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages,
    ...(stream ? { stream: true } : {}),
  });
}

function requestHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
}

async function createMessage(apiKey: string, system: string, messages: ChatTurn[]): Promise<string> {
  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: requestHeaders(apiKey),
      body: requestBody(system, messages, false),
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    throw apiError(response.status);
  }

  const data = await response.json();
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text : '';
}

/**
 * SSE streaming ile mesaj oluşturur. Her metin parçası geldiğinde
 * onChunk çağrılır; tamamlanan metnin tamamı döndürülür.
 */
async function streamMessage(
  apiKey: string,
  system: string,
  messages: ChatTurn[],
  onChunk: (chunk: string) => void
): Promise<string> {
  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: requestHeaders(apiKey),
      body: requestBody(system, messages, true),
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    throw apiError(response.status);
  }

  const body = response.body;
  if (!body) {
    throw new Error('Akış başlatılamadı. Lütfen tekrar deneyin.');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE satırlarını işle; son eksik satırı tamponda tut
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        let event: any;
        try {
          event = JSON.parse(payload);
        } catch {
          continue;
        }

        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const text: string = event.delta.text ?? '';
          if (text) {
            fullText += text;
            onChunk(text);
          }
        } else if (event.type === 'error') {
          throw new Error(
            event.error?.type === 'overloaded_error'
              ? 'AI servisi şu anda yoğun. Lütfen kısa bir süre sonra tekrar deneyin.'
              : 'Yanıt alınırken bir hata oluştu. Lütfen tekrar deneyin.'
          );
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  return fullText;
}

async function callClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  return createMessage(apiKey, system, [{ role: 'user', content: userMessage }]);
}

// ---- Genel AI sohbeti ----

/**
 * AI sohbet mesajı gönderir. onChunk verilirse yanıt SSE streaming ile
 * parça parça iletilir; her durumda tam yanıt metni döndürülür.
 */
export async function sendMessage(
  apiKey: string,
  messages: ChatTurn[],
  patientContext?: { patient: Patient; diagnoses: Diagnosis[] },
  onChunk?: (chunk: string) => void
): Promise<string> {
  let system = BASE_SYSTEM;
  if (patientContext) {
    system += `\n\n--- HASTA BAĞLAMI ---\n${buildPatientContext(patientContext.patient, patientContext.diagnoses)}`;
  }

  if (onChunk) {
    return streamMessage(apiKey, system, messages, onChunk);
  }
  return createMessage(apiKey, system, messages);
}

// ---- Seans özeti oluştur ----

export async function generateSessionSummary(
  apiKey: string,
  patient: Patient,
  session: Session,
  notes: SessionNote[]
): Promise<string> {
  const noteText = notes.map(n => `[${n.category.toUpperCase()}] ${n.content}`).join('\n');
  const system = `${BASE_SYSTEM}\n\nGörevin: Seans notlarından kısa, yapılandırılmış bir klinik özet çıkarmak. Format: (1) Ana Bulgular (2) Ruh Hali & Davranış (3) Müdahaleler (4) Sonraki Adımlar`;
  const prompt = `Hasta: ${anonymizePatientName(patient.name)}, Yaklaşım: ${session.approach || 'belirtilmemiş'}, Süre: ${session.duration || '?'} dk\n\nSeans Notları:\n${noteText || 'Not girilmemiş.'}`;

  return callClaude(apiKey, system, prompt);
}

// ---- Vaka formülasyonu oluştur ----

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

// ---- Müdahale önerileri ----

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

// ---- Risk göstergesi tespiti ----

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

// ---- Psikoeğitim metni oluştur ----

export async function generatePsychoeducation(
  apiKey: string,
  topic: string,
  patient: Patient,
  diagnoses: Diagnosis[]
): Promise<string> {
  const system = `${BASE_SYSTEM}\n\nGörevin: Psikolog tarafından danışana verilecek, anlaşılır ve empatik bir psikoeğitim metni yazmak. Teknik jargondan kaçın, somut örnekler kullan.`;
  const prompt = `${buildPatientContext(patient, diagnoses)}\n\nKonu: "${topic}" hakkında bu hastaya uygun bir psikoeğitim metni yaz. Yaklaşık 200-300 kelime.`;

  return callClaude(apiKey, system, prompt);
}

// ---- Seans hazırlığı ----

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
