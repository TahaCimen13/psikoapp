// Anamnez form modeli: soru tipleri ve varsayılan şablon.
//
// Versiyonlama yaklaşımı: form her düzenlendiğinde version artar; doldurulan
// her yanıt, doldurulduğu andaki soruların anlık kopyasını (snapshot) kendi
// içinde taşır. Böylece form sonradan değişse/silinse bile eski yanıtlar
// bozulmadan okunabilir (danışanın sağlık kaydı niteliğindedir).

export type AnamnesisQuestionType = 'kisa_metin' | 'uzun_metin' | 'tekli_secim' | 'coklu_secim' | 'tarih' | 'sayi';

export interface AnamnesisQuestion {
  id: string;
  section: string;            // görsel gruplama başlığı (örn. "Kişisel Bilgiler")
  label: string;
  type: AnamnesisQuestionType;
  required?: boolean;
  options?: string[];         // tekli_secim / coklu_secim için
}

export const QUESTION_TYPES: Record<AnamnesisQuestionType, string> = {
  kisa_metin: 'Kısa metin',
  uzun_metin: 'Uzun metin',
  tekli_secim: 'Tekli seçim',
  coklu_secim: 'Çoklu seçim',
  tarih: 'Tarih',
  sayi: 'Sayı',
};

// Cevaplar: { [questionId]: string | string[] }
// (coklu_secim → string[], diğerleri → string; sayı/tarih de string saklanır)
export type AnamnesisAnswers = Record<string, string | string[]>;

export const DEFAULT_FORM_NAME = 'Standart Anamnez Formu';

export const DEFAULT_TEMPLATE: AnamnesisQuestion[] = [
  // Kişisel Bilgiler
  { id: 'ad_soyad', section: 'Kişisel Bilgiler', label: 'Adınız Soyadınız', type: 'kisa_metin', required: true },
  { id: 'dogum_tarihi', section: 'Kişisel Bilgiler', label: 'Doğum tarihiniz', type: 'tarih' },
  { id: 'meslek', section: 'Kişisel Bilgiler', label: 'Mesleğiniz', type: 'kisa_metin' },
  { id: 'medeni_durum', section: 'Kişisel Bilgiler', label: 'Medeni durumunuz', type: 'tekli_secim', options: ['Bekar', 'Evli', 'Boşanmış', 'Dul', 'Birlikte yaşıyor'] },
  { id: 'birlikte_yasadigi', section: 'Kişisel Bilgiler', label: 'Kimlerle birlikte yaşıyorsunuz?', type: 'kisa_metin' },

  // Başvuru Nedeni
  { id: 'basvuru_nedeni', section: 'Başvuru Nedeni', label: 'Başvuru nedeniniz nedir? Sizi buraya getiren sorunu kendi cümlelerinizle anlatır mısınız?', type: 'uzun_metin', required: true },
  { id: 'sikayet_suresi', section: 'Başvuru Nedeni', label: 'Bu şikayetler ne zamandır sürüyor?', type: 'kisa_metin' },
  { id: 'beklenti', section: 'Başvuru Nedeni', label: 'Bu süreçten beklentiniz nedir?', type: 'uzun_metin' },

  // Geçmiş Psikolojik/Psikiyatrik Tedavi
  { id: 'gecmis_tedavi', section: 'Geçmiş Tedavi', label: 'Daha önce psikolojik veya psikiyatrik destek aldınız mı?', type: 'tekli_secim', options: ['Evet', 'Hayır'] },
  { id: 'gecmis_tedavi_detay', section: 'Geçmiş Tedavi', label: 'Aldıysanız: ne zaman, ne kadar süre, hangi tanı/tedavi?', type: 'uzun_metin' },
  { id: 'psikiyatrik_yatis', section: 'Geçmiş Tedavi', label: 'Psikiyatrik yatış öykünüz var mı?', type: 'tekli_secim', options: ['Evet', 'Hayır'] },

  // Aile Öyküsü
  { id: 'aile_psikiyatrik', section: 'Aile Öyküsü', label: 'Ailenizde psikolojik/psikiyatrik tanı almış biri var mı? Varsa kim, hangi tanı?', type: 'uzun_metin' },
  { id: 'aile_yapisi', section: 'Aile Öyküsü', label: 'Aile yapınızı kısaca anlatır mısınız? (anne-baba, kardeşler, ilişkiler)', type: 'uzun_metin' },

  // Sağlık ve İlaçlar
  { id: 'mevcut_ilaclar', section: 'Sağlık', label: 'Düzenli kullandığınız ilaçlar var mı? (psikiyatrik olsun olmasın)', type: 'uzun_metin' },
  { id: 'kronik_hastalik', section: 'Sağlık', label: 'Kronik bir hastalığınız var mı?', type: 'uzun_metin' },

  // Yaşam Alışkanlıkları
  { id: 'uyku', section: 'Yaşam Alışkanlıkları', label: 'Uyku düzeninizi nasıl tanımlarsınız?', type: 'tekli_secim', options: ['İyi', 'Orta', 'Kötü'] },
  { id: 'beslenme', section: 'Yaşam Alışkanlıkları', label: 'İştah ve beslenme düzeniniz nasıl?', type: 'tekli_secim', options: ['İyi', 'Orta', 'Kötü'] },
  { id: 'madde_kullanim', section: 'Yaşam Alışkanlıkları', label: 'Sigara, alkol veya başka madde kullanımınız var mı? Sıklığıyla belirtir misiniz?', type: 'uzun_metin' },

  // Acil Durum
  { id: 'acil_kisi_ad', section: 'Acil İletişim', label: 'Acil durumda ulaşılacak kişinin adı soyadı', type: 'kisa_metin', required: true },
  { id: 'acil_kisi_yakinlik', section: 'Acil İletişim', label: 'Yakınlık dereceniz', type: 'kisa_metin' },
  { id: 'acil_kisi_tel', section: 'Acil İletişim', label: 'Telefon numarası', type: 'kisa_metin', required: true },
];
