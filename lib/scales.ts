// Hazır ölçek referans kütüphanesi: Türkiye'de klinik pratikte yaygın
// kullanılan psikometrik araçların puanlama ve yorumlama bilgileri.
//
// ⚠️ TELİF NOTU: Madde metinleri yalnızca kamu malı (public domain) ölçekler
// için gömülüdür (PHQ-9, GAD-7, WHO-5). Telifli ölçeklerin (Beck, SCL-90-R vb.)
// madde metinleri BİLEREK dahil edilmemiştir; yalnızca puanlama/yorumlama
// bilgisi referans amaçlı sunulur. Uygulayıcı, ölçeği yasal yoldan edinmelidir.

export interface ScaleCutoff {
  range: string;   // örn. "0-4"
  label: string;   // örn. "Minimal"
  color: string;   // şiddet rengi
}

export interface Scale {
  id: string;
  abbreviation: string;
  name: string;
  category: 'Depresyon' | 'Anksiyete' | 'Travma' | 'OKB' | 'Genel Tarama' | 'Benlik' | 'Uyku';
  purpose: string;          // ne ölçer (tek cümle)
  itemCount: number;
  durationMin: string;      // uygulama süresi, örn. "2-5 dk"
  timeFrame: string;        // değerlendirilen dönem, örn. "Son 2 hafta"
  scoring: string;          // puanlama açıklaması
  cutoffs: ScaleCutoff[];
  notes?: string;           // klinik kullanım notları
  publicDomain: boolean;
  items?: string[];         // yalnızca kamu malı ölçeklerde
  responseAnchors?: string; // maddelerin yanıt seçenekleri
}

const GREEN = '#059669';
const LIME = '#65A30D';
const AMBER = '#D97706';
const ORANGE = '#EA580C';
const RED = '#DC2626';

export const SCALES: Scale[] = [
  {
    id: 'phq9',
    abbreviation: 'PHQ-9',
    name: 'Hasta Sağlığı Anketi - 9',
    category: 'Depresyon',
    purpose: 'Depresyon belirtilerinin şiddetini tarar ve tedavi yanıtını izler.',
    itemCount: 9,
    durationMin: '2-5 dk',
    timeFrame: 'Son 2 hafta',
    scoring: 'Her madde 0-3 puan (0=Hiç, 1=Birkaç gün, 2=Günlerin yarısından fazlası, 3=Hemen her gün). Toplam 0-27. 10 ve üzeri klinik olarak anlamlı kabul edilir; ≥5 puan düşüş anlamlı iyileşme sayılır.',
    cutoffs: [
      { range: '0-4', label: 'Minimal', color: GREEN },
      { range: '5-9', label: 'Hafif', color: LIME },
      { range: '10-14', label: 'Orta', color: AMBER },
      { range: '15-19', label: 'Orta-şiddetli', color: ORANGE },
      { range: '20-27', label: 'Şiddetli', color: RED },
    ],
    notes: '9. madde (kendine zarar verme düşüncesi) 1 ve üzeriyse mutlaka intihar riski değerlendirmesi yapın.',
    publicDomain: true,
    responseAnchors: '0=Hiç · 1=Birkaç gün · 2=Günlerin yarısından fazlası · 3=Hemen her gün',
    items: [
      'Yaptığınız işlerden çok az zevk alma ya da ilgi duymama',
      'Kendini çökkün, depresif ya da umutsuz hissetme',
      'Uykuya dalmakta güçlük, uykuyu sürdürememe ya da çok fazla uyuma',
      'Kendini yorgun hissetme ya da enerjinin az olması',
      'İştahsızlık ya da aşırı yeme',
      'Kendinizle ilgili kötü hissetme — başarısız olduğunuzu ya da kendinizi veya ailenizi hayal kırıklığına uğrattığınızı düşünme',
      'Gazete okumak ya da televizyon izlemek gibi işlere odaklanmakta güçlük',
      'Başkalarının fark edebileceği kadar yavaş hareket etme/konuşma ya da tam tersi, her zamankinden fazla hareketlilik ve yerinde duramama',
      'Ölmüş olmanın ya da kendinize bir şekilde zarar vermenin daha iyi olacağı düşünceleri',
    ],
  },
  {
    id: 'gad7',
    abbreviation: 'GAD-7',
    name: 'Yaygın Anksiyete Bozukluğu Ölçeği - 7',
    category: 'Anksiyete',
    purpose: 'Yaygın anksiyete belirtilerini tarar; diğer anksiyete bozuklukları için de duyarlıdır.',
    itemCount: 7,
    durationMin: '1-3 dk',
    timeFrame: 'Son 2 hafta',
    scoring: 'Her madde 0-3 puan. Toplam 0-21. 10 ve üzeri klinik olarak anlamlı kabul edilir.',
    cutoffs: [
      { range: '0-4', label: 'Minimal', color: GREEN },
      { range: '5-9', label: 'Hafif', color: LIME },
      { range: '10-14', label: 'Orta', color: AMBER },
      { range: '15-21', label: 'Şiddetli', color: RED },
    ],
    notes: 'Panik bozukluğu, sosyal anksiyete ve TSSB taramasında da makul duyarlılık gösterir.',
    publicDomain: true,
    responseAnchors: '0=Hiç · 1=Birkaç gün · 2=Günlerin yarısından fazlası · 3=Hemen her gün',
    items: [
      'Sinirli, kaygılı ya da gergin hissetme',
      'Endişelenmeyi durduramama ya da kontrol edememe',
      'Farklı konularda çok fazla endişelenme',
      'Gevşeyip rahatlamakta güçlük',
      'Yerinde duramayacak kadar huzursuz olma',
      'Kolayca kızma ya da huzursuz olma',
      'Korkunç bir şey olacakmış gibi korku hissetme',
    ],
  },
  {
    id: 'who5',
    abbreviation: 'WHO-5',
    name: 'DSÖ-5 İyilik Hali İndeksi',
    category: 'Genel Tarama',
    purpose: 'Öznel psikolojik iyilik halini ölçer; pozitif çerçeveli kısa tarama aracı.',
    itemCount: 5,
    durationMin: '1-2 dk',
    timeFrame: 'Son 2 hafta',
    scoring: 'Her madde 0-5 puan. Ham toplam (0-25) 4 ile çarpılarak 0-100 arası yüzde puana çevrilir. Yüksek puan iyi durumu gösterir.',
    cutoffs: [
      { range: '0-28', label: 'Depresyon göstergesi', color: RED },
      { range: '29-49', label: 'Düşük iyilik hali', color: AMBER },
      { range: '50-100', label: 'Yeterli iyilik hali', color: GREEN },
    ],
    notes: '≤50 puanda depresyon açısından ayrıntılı değerlendirme (örn. PHQ-9) önerilir. Puan DÜŞÜKKEN kötü olan tek gömülü ölçek budur; grafiklerde yorumlarken dikkat.',
    publicDomain: true,
    responseAnchors: '5=Her zaman · 4=Çoğu zaman · 3=Yarısından fazla · 2=Yarısından az · 1=Bazen · 0=Hiçbir zaman',
    items: [
      'Kendimi neşeli ve keyifli hissettim',
      'Kendimi sakin ve rahatlamış hissettim',
      'Kendimi aktif ve dinç hissettim',
      'Uyandığımda kendimi taze ve dinlenmiş hissettim',
      'Günlük yaşamım ilgimi çeken şeylerle doluydu',
    ],
  },
  {
    id: 'bdi2',
    abbreviation: 'BDI-II',
    name: 'Beck Depresyon Envanteri - II',
    category: 'Depresyon',
    purpose: 'Depresyon belirtilerinin bilişsel, duygusal ve bedensel boyutlarını ayrıntılı ölçer.',
    itemCount: 21,
    durationMin: '5-10 dk',
    timeFrame: 'Son 2 hafta',
    scoring: 'Her madde 0-3 puan. Toplam 0-63.',
    cutoffs: [
      { range: '0-13', label: 'Minimal', color: GREEN },
      { range: '14-19', label: 'Hafif', color: LIME },
      { range: '20-28', label: 'Orta', color: AMBER },
      { range: '29-63', label: 'Şiddetli', color: RED },
    ],
    notes: 'Bilişsel içeriği zengin olduğundan BDT formülasyonuna girdi sağlar. İntihar maddesini (madde 9) her uygulamada ayrıca kontrol edin.',
    publicDomain: false,
  },
  {
    id: 'bai',
    abbreviation: 'BAI',
    name: 'Beck Anksiyete Envanteri',
    category: 'Anksiyete',
    purpose: 'Anksiyetenin özellikle bedensel/somatik belirtilerinin şiddetini ölçer.',
    itemCount: 21,
    durationMin: '5-10 dk',
    timeFrame: 'Son 1 hafta',
    scoring: 'Her madde 0-3 puan. Toplam 0-63.',
    cutoffs: [
      { range: '0-7', label: 'Minimal', color: GREEN },
      { range: '8-15', label: 'Hafif', color: LIME },
      { range: '16-25', label: 'Orta', color: AMBER },
      { range: '26-63', label: 'Şiddetli', color: RED },
    ],
    notes: 'Somatik ağırlıklıdır; yaygın anksiyetenin bilişsel boyutu (endişe) için GAD-7 veya PSWQ ile tamamlayın.',
    publicDomain: false,
  },
  {
    id: 'pcl5',
    abbreviation: 'PCL-5',
    name: 'TSSB Kontrol Listesi (DSM-5)',
    category: 'Travma',
    purpose: 'DSM-5 TSSB belirti kümelerini (yeniden yaşantılama, kaçınma, biliş/duygudurum, uyarılmışlık) tarar.',
    itemCount: 20,
    durationMin: '5-10 dk',
    timeFrame: 'Son 1 ay',
    scoring: 'Her madde 0-4 puan. Toplam 0-80. Küme bazlı DSM-5 tanı taslağı da çıkarılabilir (B kümesinden ≥1, C\'den ≥1, D\'den ≥2, E\'den ≥2 madde ≥2 puan).',
    cutoffs: [
      { range: '0-30', label: 'Eşik altı', color: GREEN },
      { range: '31-32', label: 'Sınır (önerilen kesme: 31-33)', color: AMBER },
      { range: '33-80', label: 'Olası TSSB — ayrıntılı değerlendirme', color: RED },
    ],
    notes: 'ABD Ulusal TSSB Merkezi tarafından ücretsiz dağıtılır; Türkçe maddeler için geçerlik çalışması yapılmış formu edinin. Tanı için klinik görüşme (örn. CAPS-5) gerekir.',
    publicDomain: true,
  },
  {
    id: 'ybocs',
    abbreviation: 'Y-BOCS',
    name: 'Yale-Brown Obsesyon Kompulsiyon Ölçeği',
    category: 'OKB',
    purpose: 'Obsesyon ve kompulsiyonların şiddetini içerikten bağımsız ölçer; OKB tedavi takibinin altın standardıdır.',
    itemCount: 10,
    durationMin: '15-25 dk (klinisyen uygular)',
    timeFrame: 'Son 1 hafta',
    scoring: 'Obsesyon (1-5) ve kompulsiyon (6-10) alt ölçekleri, her madde 0-4. Toplam 0-40.',
    cutoffs: [
      { range: '0-7', label: 'Subklinik', color: GREEN },
      { range: '8-15', label: 'Hafif', color: LIME },
      { range: '16-23', label: 'Orta', color: AMBER },
      { range: '24-31', label: 'Şiddetli', color: ORANGE },
      { range: '32-40', label: 'Aşırı şiddetli', color: RED },
    ],
    notes: 'Klinisyen tarafından yarı yapılandırılmış görüşmeyle uygulanır; önce belirti kontrol listesiyle obsesyon/kompulsiyon içeriği belirlenir. Tedavide ≥%35 düşüş yanıt kabul edilir.',
    publicDomain: false,
  },
  {
    id: 'scl90r',
    abbreviation: 'SCL-90-R',
    name: 'Belirti Tarama Listesi - 90-R',
    category: 'Genel Tarama',
    purpose: 'Dokuz belirti boyutunda (somatizasyon, OKB, kişilerarası duyarlılık, depresyon, anksiyete, öfke, fobik anksiyete, paranoid düşünce, psikotizm) genel psikopatoloji taraması yapar.',
    itemCount: 90,
    durationMin: '15-25 dk',
    timeFrame: 'Son 1 hafta',
    scoring: 'Her madde 0-4 puan. Genel Belirti İndeksi (GSI) = toplam puan / 90. Alt ölçek puanı = alt ölçek toplamı / madde sayısı.',
    cutoffs: [
      { range: 'GSI < 1.00', label: 'Normal düzey', color: GREEN },
      { range: 'GSI 1.00-1.50', label: 'Yüksek belirti düzeyi', color: AMBER },
      { range: 'GSI > 1.50', label: 'Çok yüksek — ayrıntılı değerlendirme', color: RED },
    ],
    notes: 'İlk görüşme sonrası genel profil çıkarmak için uygundur; tanı koydurmaz, hangi alanların derinleştirileceğini gösterir.',
    publicDomain: false,
  },
  {
    id: 'rses',
    abbreviation: 'RBSÖ',
    name: 'Rosenberg Benlik Saygısı Ölçeği',
    category: 'Benlik',
    purpose: 'Genel benlik saygısı düzeyini ölçer.',
    itemCount: 10,
    durationMin: '2-5 dk',
    timeFrame: 'Genel (şu anki)',
    scoring: 'Türkçe uyarlamada (Çuhadaroğlu) ilk 10 madde Guttman tekniğiyle 0-6 arası puanlanır; DÜŞÜK puan YÜKSEK benlik saygısını gösterir.',
    cutoffs: [
      { range: '0-1', label: 'Yüksek benlik saygısı', color: GREEN },
      { range: '2-4', label: 'Orta benlik saygısı', color: AMBER },
      { range: '5-6', label: 'Düşük benlik saygısı', color: RED },
    ],
    notes: 'Uluslararası kullanımda 4\'lü Likert (10-40 toplam) yaygındır; hangi puanlamayı kullandığınızı kayıtta belirtin.',
    publicDomain: true,
  },
  {
    id: 'epds',
    abbreviation: 'EPDS',
    name: 'Edinburgh Doğum Sonrası Depresyon Ölçeği',
    category: 'Depresyon',
    purpose: 'Gebelik ve doğum sonrası dönemde depresyon riskini tarar.',
    itemCount: 10,
    durationMin: '2-5 dk',
    timeFrame: 'Son 1 hafta',
    scoring: 'Her madde 0-3 puan. Toplam 0-30. Türkçe geçerlik çalışmasında kesme puanı 12/13 olarak önerilmiştir.',
    cutoffs: [
      { range: '0-12', label: 'Düşük risk', color: GREEN },
      { range: '13-30', label: 'Depresyon riski — klinik değerlendirme', color: RED },
    ],
    notes: '10. madde kendine zarar verme düşüncesini sorar; 1 ve üzeri puanda risk değerlendirmesi yapın. Somatik gebelik belirtilerinden etkilenmemesi için tasarlanmıştır.',
    publicDomain: true,
  },
  {
    id: 'psqi',
    abbreviation: 'PUKİ',
    name: 'Pittsburgh Uyku Kalitesi İndeksi',
    category: 'Uyku',
    purpose: 'Uyku kalitesini yedi bileşende (öznel kalite, latans, süre, verimlilik, bozukluklar, ilaç, gündüz işlevselliği) değerlendirir.',
    itemCount: 19,
    durationMin: '5-10 dk',
    timeFrame: 'Son 1 ay',
    scoring: 'Yedi bileşenin her biri 0-3 puanlanır, toplam 0-21.',
    cutoffs: [
      { range: '0-5', label: 'İyi uyku kalitesi', color: GREEN },
      { range: '6-21', label: 'Kötü uyku kalitesi', color: RED },
    ],
    notes: 'Depresyon/anksiyete vakalarında uyku bileşenini nesnelleştirmek için kullanışlıdır; skorlama tablosu gerektirir.',
    publicDomain: false,
  },
];

export function getScale(id: string): Scale | undefined {
  return SCALES.find(s => s.id === id);
}
