// Ölçek PDF/HTML üretimi — tek şablon, iki kullanım:
//  - Boş form (kâğıt uygulama için çıktı)
//  - Tamamlanmış test (danışanın seçimleri form üzerinde işaretli + sonuç kutusu)
// Maddesi gömülü olmayan (telifli) ölçekler için referans kartı üretilir.
import type { Scale } from './scales';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BASE_CSS = `
  body { font-family: -apple-system, sans-serif; color: #0F172A; padding: 24px; font-size: 12px; }
  h1 { font-size: 17px; margin-bottom: 2px; }
  .meta { color: #64748B; font-size: 11px; margin-bottom: 14px; }
  .who { margin-bottom: 14px; font-size: 12px; }
  .who span { display: inline-block; min-width: 200px; border-bottom: 1px solid #94A3B8; margin-left: 4px; padding-bottom: 1px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #CBD5E1; padding: 6px; text-align: center; font-size: 11px; }
  th { background: #F1F5F9; }
  td.q { text-align: left; font-size: 12px; }
  td.c { font-size: 14px; width: 52px; }
  td.sel { background: #EEF2FF; font-weight: 700; }
  .result { margin-top: 16px; border: 2px solid #CBD5E1; border-radius: 8px; padding: 12px; display: flex; gap: 16px; align-items: baseline; }
  .result .score { font-size: 20px; font-weight: 800; }
  .result .band { font-size: 14px; font-weight: 700; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #4F46E5; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 18px; }
  .cutrow { margin: 3px 0; font-size: 12px; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 5px; margin-right: 6px; }
  p.body { font-size: 12px; line-height: 1.5; margin: 6px 0; }
  .footer { margin-top: 16px; color: #94A3B8; font-size: 10px; }
`;

export interface FilledInfo {
  patientName: string;
  dateStr: string;         // görüntülenecek tarih
  answers: number[];       // madde sırasına göre seçilen değerler
  score: number;
  bandLabel?: string;
  bandColor?: string;
}

/**
 * Madde tablolu ölçek formu. `filled` verilirse danışanın seçimleri hücrede
 * ✗ ile işaretlenir ve altta sonuç kutusu yer alır; verilmezse boş form.
 */
export function scaleFormHtml(scale: Scale, filled?: FilledInfo): string {
  const items = scale.items!;
  const options = scale.responseOptions!;
  const optHeads = options.map(o => `<th>${esc(o.label)}<br/>(${o.value})</th>`).join('');
  const rows = items.map((item, i) => {
    const cells = options.map(o => {
      const selected = filled ? filled.answers[i] === o.value : false;
      return `<td class="c${selected ? ' sel' : ''}">${selected ? '✗' : '☐'}</td>`;
    }).join('');
    return `<tr><td class="q">${i + 1}. ${esc(item)}</td>${cells}</tr>`;
  }).join('');

  const who = filled
    ? `<p class="who">Ad Soyad: <b>${esc(filled.patientName)}</b> &nbsp;·&nbsp; Tarih: <b>${esc(filled.dateStr)}</b></p>`
    : `<p class="who">Ad Soyad: <span></span> &nbsp; Tarih: <span style="min-width:100px"></span></p>`;

  const result = filled
    ? `<div class="result" style="border-color:${filled.bandColor ?? '#CBD5E1'}">
        <span class="score">${esc(scale.abbreviation)}: ${filled.score}</span>
        ${filled.bandLabel ? `<span class="band" style="color:${filled.bandColor ?? '#0F172A'}">${esc(filled.bandLabel)}</span>` : ''}
       </div>`
    : '';

  return `<html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>
    <h1>${esc(scale.name)} (${esc(scale.abbreviation)})</h1>
    <p class="meta">${esc(scale.timeFrame)} düşünülerek yanıtlanır · ${items.length} madde</p>
    ${who}
    <table><tr><th style="text-align:left">Madde</th>${optHeads}</tr>${rows}</table>
    ${result}
    <p class="footer">PsikoApp ile hazırlanmıştır. Puanlama: ${esc(scale.scoring)}</p>
  </body></html>`;
}

/** Maddesi gömülü olmayan ölçekler için: puanlama + kesme noktaları referans kartı. */
export function scaleReferenceHtml(scale: Scale): string {
  const cutoffs = scale.cutoffs.map(c =>
    `<p class="cutrow"><span class="dot" style="background:${c.color}"></span><b>${esc(c.range)}</b> — ${esc(c.label)}</p>`
  ).join('');
  return `<html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>
    <h1>${esc(scale.name)} (${esc(scale.abbreviation)})</h1>
    <p class="meta">${esc(scale.category)} · ${scale.itemCount} madde · ${esc(scale.durationMin)} · ${esc(scale.timeFrame)}</p>
    <p class="body">${esc(scale.purpose)}</p>
    <h2>Puanlama</h2><p class="body">${esc(scale.scoring)}</p>
    <h2>Kesme Noktaları</h2>${cutoffs}
    ${scale.notes ? `<h2>Klinik Notlar</h2><p class="body">${esc(scale.notes)}</p>` : ''}
    ${scale.publicDomain ? '' : '<p class="body"><b>Telif notu:</b> Bu ölçek teliflidir; madde metinleri bu karta dahil edilmemiştir. Ölçeği yasal yoldan edinerek uygulayın.</p>'}
    <p class="footer">PsikoApp ile hazırlanmıştır. Referans amaçlıdır; tanı tek başına ölçek puanıyla konmaz.</p>
  </body></html>`;
}
