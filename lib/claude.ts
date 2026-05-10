import { Patient, Diagnosis } from './types';

const SYSTEM_PROMPT = `Sen deneyimli bir klinik psikolog asistanısın. Türkçe konuşuyorsun.

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

export async function sendMessage(
  apiKey: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  patientContext?: { patient: Patient; diagnoses: Diagnosis[] }
): Promise<string> {
  let systemPrompt = SYSTEM_PROMPT;

  if (patientContext) {
    const { patient, diagnoses } = patientContext;
    const age = patient.birth_date
      ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
      : 'bilinmiyor';

    const diagList = diagnoses.length > 0
      ? diagnoses.map(d => `${d.dsm_name || d.dsm_code} (${d.severity || 'şiddet belirtilmemiş'})`).join(', ')
      : 'henüz tanı yok';

    systemPrompt += `\n\n--- HASTA BAĞLAMI ---\nAd: ${patient.name}\nYaş: ${age}\nMevcut Tanılar: ${diagList}\nBaşvuru Nedeni: ${patient.background || 'belirtilmemiş'}`;
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
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API hatası: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const block = data.content?.[0];
  if (block?.type === 'text') return block.text;
  return '';
}
