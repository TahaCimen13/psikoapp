// KVKK aydınlatma metni ve açık rıza metni.
//
// ⚠️ HUKUKİ UYARI: Bu metinler TASLAKTIR ve yayına çıkmadan önce mutlaka
// KVKK alanında uzman bir avukat tarafından gözden geçirilmelidir.
//
// KVKK Kurulu'nun 2026/347 sayılı ilke kararı gereği aydınlatma metni ve
// açık rıza metni AYRI metinlerdir ve aynı formda birleştirilemez:
//  - Aydınlatma (KVKK m.10): sadece bilgilendirme, onay kutusu YOK.
//  - Açık rıza (KVKK m.5-6): ayrı sayfada, tek ve net bir rıza cümlesi + onay.
//
// Metinlerden biri değiştiğinde ilgili versiyon yükseltilmeli; eski onay
// kayıtları eski versiyon numarasıyla loglu kalır (denetim izi).

export const AYDINLATMA_VERSION = '1.0';

export const AYDINLATMA_TEXT = `KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ (v${AYDINLATMA_VERSION})

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") m.10 uyarınca, veri sorumlusu sıfatıyla psikoloğunuz tarafından aşağıdaki hususlarda bilgilendirilmektesiniz.

1. İŞLENEN VERİLER
• Kimlik ve iletişim bilgileriniz: ad-soyad, doğum tarihi, telefon, e-posta.
• Özel nitelikli kişisel verileriniz (sağlık verileri): başvuru nedeniniz, anamnez (öykü) bilgileriniz, seans notları, psikolojik değerlendirme ve test sonuçları, tanı bilgileri, tedavi planı.

2. İŞLEME AMAÇLARI
• Psikolojik danışmanlık hizmetinin yürütülmesi,
• Seans kayıtlarının tutulması ve tedavi sürecinizin takibi,
• Randevu planlaması ve hatırlatmaları.

3. SAKLAMA SÜRESİ VE YERİ
Verileriniz psikoloğunuzun cihazında, şifre korumalı uygulama içinde saklanır; üçüncü kişilerle paylaşılmaz. Veriler, danışmanlık ilişkisi ve ilgili mevzuatta öngörülen saklama süreleri boyunca muhafaza edilir, süre sonunda silinir.

4. YURT DIŞINA AKTARIM (YAPAY ZEKÂ DESTEĞİ)
Psikoloğunuz, seans özetleme ve planlama desteği için yapay zekâ hizmeti (Anthropic PBC, ABD) kullanabilir. Bu durumda klinik bilgileriniz kimliğiniz anonimleştirilerek (adınız gönderilmeden, yalnızca baş harflerle) iletilir. Bu aktarım yalnızca açık rızanız varsa yapılır.

5. HAKLARINIZ (KVKK m.11)
Verilerinize erişme, düzeltilmesini veya silinmesini talep etme, işlemeye itiraz etme ve verdiğiniz rızayı dilediğiniz zaman geri çekme hakkına sahipsiniz. Talepleriniz için psikoloğunuza başvurabilirsiniz.

Bu metin yalnızca bilgilendirme amaçlıdır; onayınız bir sonraki adımda, ayrı bir açık rıza formu ile alınacaktır.`;

export const RIZA_VERSION = '1.0';

// 2026/347 gereği: tek ve net bir rıza cümlesi.
export const RIZA_SENTENCE =
  'Kişisel sağlık verilerimin, tarafıma sunulan aydınlatma metninde belirtilen amaçlarla işlenmesine ve yapay zekâ desteği kapsamında anonimleştirilerek yurt dışına aktarılmasına açık rızamı veriyorum.';

export const RIZA_REJECT_INFO =
  'Açık rıza vermek zorunda değilsiniz; bu sizin yasal hakkınızdır. Ancak rıza verilmediğinde sağlık verileriniz işlenemeyeceği için psikolojik danışmanlık kaydınız bu uygulama üzerinden tutulamaz ve yapay zekâ destekli özellikler kullanılamaz.';
