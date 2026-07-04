export interface DSMDiagnosis {
  code: string;
  name: string;
  chapter: string;
  criteria: string[];
  severity_specifiers?: string[];
  notes?: string;
}

export interface DSMChapter {
  title: string;
  diagnoses: DSMDiagnosis[];
}

export const DSM5_DATA: DSMChapter[] = [
  {
    title: 'Norogelisimsel Bozukluklar',
    diagnoses: [
      {
        code: 'F90.0',
        name: 'DEHB - Dikkat Eksikligi Agirlikli',
        chapter: 'Norogelisimsel Bozukluklar',
        criteria: [
          'A. Dikkat eksikligi belirtileri: Asagidaki 9 semptomdan 6 veya daha fazlasinin en az 6 ay suresi ile gosterilmesi',
          'A1. Dikkat gerektiren gorevlerde dikkati surmekte zorluk',
          'A2. Dogrudan konusulurken dinlemiyormus gibi gorulme',
          'A3. Yonergeleri takip etmekte ve gorevleri tamamlamakta zorluk',
          'A4. Gorev ve etkinlikleri duzenlemekte zorluk',
          'A5. Surekli zihinsel caba gerektiren gorevlerden kacma',
          'A6. Gorev icin gerekli esyalari kaybetme',
          'A7. Dis uyaranlarla kolayca dikkatinin dagilmasi',
          'A8. Gunluk etkinliklerde unutkanlik',
          'B. Birkac dikkat eksikligi veya hiperaktivite-durtuselligi semptomu 12 yasindan once mevcut',
          'C. Birkac semptom iki veya daha fazla ortamda mevcut',
          'D. Sosyal, akademik veya is islevselligini olumsuz etkiledigine dair acik kanit',
          'E. Sizofreni veya baska psikotik bozukluk ile daha iyi aciklanamaz',
        ],
        severity_specifiers: ['Hafif', 'Orta', 'Agir'],
      },
      {
        code: 'F90.1',
        name: 'DEHB - Hiperaktivite/Durtuselluk Agirlikli',
        chapter: 'Norogelisimsel Bozukluklar',
        criteria: [
          'A. Hiperaktivite-durtuselluk belirtileri: 9 semptomdan 6 veya daha fazlasi',
          'A1. Elleri veya ayaklari kipipirdatma, sandalyede kivalanma',
          'A2. Oturmasi beklenen durumlarda kalkma',
          'A3. Uygunsuz durumlarda kosma veya tirmanma',
          'A4. Sessizce oyun oynayamama veya bos zaman etkinligine katilnamama',
          'A5. Surekli hareket halinde olma',
          'A6. Asiri konusma',
          'A7. Soru tamamlanmadan yanit verme',
          'A8. Sirayi bekleme gucluğu',
          'A9. Baskalarina mudahale etme veya sozunu kesme',
          'B-E: DEHB Dikkat Eksikligi kriteri B-E ile ayni',
        ],
        severity_specifiers: ['Hafif', 'Orta', 'Agir'],
      },
      {
        code: 'F84.0',
        name: 'Otizm Spektrum Bozuklugu',
        chapter: 'Norogelisimsel Bozukluklar',
        criteria: [
          'A. Sosyal iletisim ve sosyal etkilesimde suregen eksiklikler (3 alan)',
          'A1. Sosyal-duygusal karsiliklilik eksikligi',
          'A2. Sosyal etkilesimde kullanilan sozel olmayan iletisim davranislarinda eksiklik',
          'A3. Iliskileri gelistirme, surdurme ve anlamada eksiklik',
          'B. Kisitli, tekrarlayici davranis, ilgi veya etkinlik kaliplarindan en az 2 tanesinin mevcut olmasi',
          'B1. Stereotipik veya tekrarlayici motor hareketler, nesne kullanimı veya konusma',
          'B2. Aynilik israri, rutinlere katı baglilik',
          'B3. Son derece kisitli, takintili ilgiler',
          'B4. Duyusal uyaranlara asiri veya dusuk tepki',
          'C. Erken gelisim doneminde mevcut olmali',
          'D. Klinik olarak anlamli bozulmaya yol acmali',
          'E. Zihinsel gelisim geriligiyle daha iyi aciklanamaz',
        ],
        severity_specifiers: ['Duzey 1 - Destek Gerektiriyor', 'Duzey 2 - Onemli Destek Gerektiriyor', 'Duzey 3 - Cok Kapsamli Destek Gerektiriyor'],
      },
    ],
  },
  {
    title: 'Depresif Bozukluklar',
    diagnoses: [
      {
        code: 'F32',
        name: 'Major Depresif Bozukluk',
        chapter: 'Depresif Bozukluklar',
        criteria: [
          'A. Asagidaki semptomlardan 5 veya daha fazlasi, 2 haftalik donem icerisinde mevcut; en az 1 tanesinin (1) depresif duygudurum veya (2) ilgi veya zevk kaybi olmasi gerekir',
          '1. Gunun buyuk bolumunde, neredeyse her gun depresif duygudurum',
          '2. Gunun buyuk bolumunde, neredeyse her gun tum veya neredeyse tum etkinliklere ilgi veya zevkin belirgin bicimde azalmasi',
          '3. Yeme rejimi uygulamiyor iken onemli olcude kilo kaybi veya kilo alma',
          '4. Neredeyse her gun uykusuzluk veya asiri uyuma',
          '5. Neredeyse her gun psikomotor ajitasyon veya retardasyon',
          '6. Neredeyse her gun yorgunluk veya enerji kaybi',
          '7. Neredeyse her gun degerssizlik veya asiri ya da uygunsuz suc duygusu',
          '8. Neredeyse her gun dusunme veya yogunlasma gucluğu ya da kararsizlik',
          '9. Yinelenen olum dusunceleri, intihar dusunceleri, intihar girisimi',
          'B. Semptomlar klinik olarak anlamli sikintiyi veya bozulmayı yol aciyor',
          'C. Bozukluk bir maddenin veya baska bir tibbi durumun fizyolojik etkilerine bagli degil',
          'D. Major depresif episode, sizoaffektif bozukluk veya baska psikotik bozuklukla daha iyi aciklanamaz',
          'E. Hic manik veya hipomanik atak olmamis',
        ],
        severity_specifiers: ['Hafif (F32.0)', 'Orta (F32.1)', 'Agir, psikotik ozellikli olmayan (F32.2)', 'Agir, psikotik ozellikli (F32.3)'],
        notes: 'Psikotik ozellikler, mevsimsellik, peripartum baslangi, melankoli, atipik ozellikler icin specifier\'lar mevcuttur.',
      },
      {
        code: 'F34.1',
        name: 'Persistant Depresif Bozukluk (Distimi)',
        chapter: 'Depresif Bozukluklar',
        criteria: [
          'A. En az 2 yil boyunca cogu gun, gunun buyuk bolumunde depresif duygudurum',
          'B. Depresif iken asagidakilerden 2 veya daha fazlasinin mevcut olmasi: istahsizlik/asiri yeme, uykusuzluk/asiri uyuma, enerji dusukluğu, dusuk oz-saygi, yogunlasma/karar verme gucluğu, umutsuzluk',
          'C. 2 yillik donem boyunca semptomlar 2 aydan fazla sureli hic olmamis',
          'D. Major depresif bozuklugun kriterleri surdurulebilir bicimde gosteriliyor olabilir',
          'E. Manik veya hipomanik atak hic olmamis',
          'F. Sizofreni spektrumu veya baska psikotik bozuklukla aciklanamaz',
          'G. Bir maddenin veya baska tibbi durumun etkisine bagli degil',
          'H. Belirtiler klinik olarak anlamli sikintiyi veya bozulmayı yol aciyor',
        ],
      },
    ],
  },
  {
    title: 'Anksiyete Bozukluklari',
    diagnoses: [
      {
        code: 'F41.1',
        name: 'Yaygin Anksiyete Bozuklugu',
        chapter: 'Anksiyete Bozukluklari',
        criteria: [
          'A. En az 6 aydir bir dizi olay veya etkinlik hakkinda asiri anksiyete ve endisenin olmasi',
          'B. Kisi endiseleri kontrol etmekte gucluk ceker',
          'C. Asagidakilerden 3 veya daha fazlasinin (cocuklarda 1) mevcut olmasi',
          '1. Huzursuzluk veya gergin hissetme',
          '2. Cok cabuk yorulma',
          '3. Dikkati yogunlastirmada gucluk ya da zihnin bosalmasi',
          '4. Sinirlilik',
          '5. Kas gerginligi',
          '6. Uyku bozuklugu',
          'D. Anksiyete veya fiziksel semptomlar klinik olarak anlamli sikintiyi yol aciyor',
          'E. Bir maddenin veya tibbi durumun etkisine bagli degil',
          'F. Baska bir psikiyatrik bozuklukla daha iyi aciklanamaz',
        ],
      },
      {
        code: 'F40.10',
        name: 'Sosyal Anksiyete Bozuklugu (Sosyal Fobi)',
        chapter: 'Anksiyete Bozukluklari',
        criteria: [
          'A. Bireyin baskalarinca incelenebilecegi bir veya birden fazla sosyal durumda belirgin korku veya anksiyete',
          'B. Kisi olumsuz degerlendirileceginden korkar (utanacagindan, asilacagindan vb.)',
          'C. Sosyal durumlar neredeyse daima korku veya anksiyeteyi tetikler',
          'D. Sosyal durumlardan kacinir veya yoğun korku ve anksiyete ile katlanir',
          'E. Korku/anksiyete sosyal durumla orantisiz',
          'F. Korku/anksiyete/kacinis en az 6 aydir surer',
          'G. Klinik olarak anlamli sikintiyi veya bozulmayı yol aciyor',
          'H. Bir maddeye veya tibbi duruma bagli degil',
        ],
      },
      {
        code: 'F41.0',
        name: 'Panik Bozuklugu',
        chapter: 'Anksiyete Bozukluklari',
        criteria: [
          'A. Yineleyici beklenmedik panik ataklari',
          'B. En az 1 atagi asagidakiler izler: Yeni atak beklentisiyle ya da sonuclarıyla ilgili suregen endisenin olmasi veya atakla ilgili davranislarda belirgin olumsuz degisim',
          'C. Bir madde veya tibbi durumun etkisine bagli degil',
          'D. Baska bir psikiyatrik bozuklukla daha iyi aciklanamaz',
          '--- Panik Atagi Kriterleri ---',
          'Asagidaki semptomlardan 4 veya daha fazlasini iceren yoğun korku veya yoğun rahatsizlik donemi:',
          '1. Carpinti, kalbin kuvvetli atisi veya hizlanmasi',
          '2. Terleme',
          '3. Titreme veya sarsinti',
          '4. Nefes darliginin olmasi veya bogluluk hissi',
          '5. Boguluyormus hissi',
          '6. Gogus agrisi veya sikisma hissi',
          '7. Bulanti veya karin rahatsizligi',
          '8. Basdonmesi, sersemlik, baygilacakmis hissi',
          '9. Uger/esitsi hisler (kendini tanimama, gercekdisi hisler)',
          '10. Kontrol kaybetme veya deli olacakmisin korkusu',
          '11. Olum korkusu',
          '12. Uyusma veya karincalanma',
          '13. Ustunkurmez/ucvurma',
        ],
      },
      {
        code: 'F40.00',
        name: 'Agorafobi',
        chapter: 'Anksiyete Bozukluklari',
        criteria: [
          'A. Asagidaki 5 durumun 2 veya daha fazlasinda belirgin korku veya anksiyete',
          '1. Toplu tasima araci kullanma',
          '2. Acik alanlarda bulunma',
          '3. Kapali alanlarda bulunma',
          '4. Kuyrukta veya kalabalikta bulunma',
          '5. Evden yalniz disari cikma',
          'B. Panik benzeri semptom veya incapacitating/utanc verici semptomlar gelistirebileceginden korkuyor',
          'C. Durumlardan kacinir, eslik edilmesini gerektirir veya yogun korku ile katlanir',
          'D. Korku/anksiyete sosyal durumla orantisiz',
          'E. En az 6 aydur devam ediyor',
          'F-H: standart kriterler',
        ],
      },
    ],
  },
  {
    title: 'OKB ve Iliskili Bozukluklar',
    diagnoses: [
      {
        code: 'F42',
        name: 'Obsesif-Kompulsif Bozukluk',
        chapter: 'OKB ve Iliskili Bozukluklar',
        criteria: [
          'A. Obsesyonlarin veya kompulsiyonlarin ya da her ikisinin mevcut olmasi',
          'Obsesyonlar: (1) Yineleyici, sureklilik gosteren, istenmeden gelen, rahatsizlik yaratan dusunce, durtmece veya imgeler. (2) Bunlari yok saymaya veya bastirmaya ya da baska bir dusunce veya eylemle notralize etmeye calisma.',
          'Kompulsiyonlar: (1) Tekrarlayan davranislar (el yikama, siralama, kontrol etme) veya zihinsel eylemler. (2) Obsesyonlara yanit olarak veya kati kurallara gore uygulanir.',
          'B. Obsesyonlar veya kompulsiyonlar zaman alici veya klinik olarak anlamli sikintiyi yol aciyor',
          'C. Bir madde veya tibbi durumun etkisine bagli degil',
          'D. Baska bir psikiyatrik bozuklukla daha iyi aciklanamaz',
        ],
        severity_specifiers: ['Iyi veya makul icgorulu', 'Az icgorulu', 'Icgorusu yok/sanrisal inanc'],
      },
      {
        code: 'F45.22',
        name: 'Beden Dismorfik Bozuklugu',
        chapter: 'OKB ve Iliskili Bozukluklar',
        criteria: [
          'A. Baskalarinca fark edilmeyen veya hafif goruen bir veya birden fazla algilanan bedensel kusura odaklanma',
          'B. Dismorfik endiselerle yanit olarak tekrarlayan davranislar (ayna kontrolu, asiri ziynet yapma, cilt siyiristirma) veya zihinsel eylemler',
          'C. Klinik olarak anlamli sikintiyi veya bozulmayı yol aciyor',
          'D. Yeme bozukluguyla daha iyi aciklanamaz',
        ],
      },
    ],
  },
  {
    title: 'Travma ve Stresorle Iliskili Bozukluklar',
    diagnoses: [
      {
        code: 'F43.10',
        name: 'Travma Sonrasi Stres Bozuklugu (TSSB)',
        chapter: 'Travma ve Stresorle Iliskili Bozukluklar',
        criteria: [
          'A. Olum, ciddi yaralanma veya cinsel siddetle ilgili olarak bir veya daha fazla sekilde maruz kalma: Dogrudan yasama, sahit olma, yakin aile veya arkadasa oldugunu ogrenme, travmatik olaylara tekrar eden veya asiri sekilde maruz kalma',
          'B. Travmatik olaydan sonra asagidaki yanik belirtilerinden 1 veya fazlasinin olmasi: Istenmeden gelen rahatsiz edici anislar, kabuslar, disosiyatif tepkiler (flashback), maruz kalmayı temsil eden ipuclarina yogun piskolojik sikintiyi, ipuclarina yogun fizyolojik tepkiler',
          'C. Travmatik olaydan sonra asagidaki kacinis belirtilerinden 1 veya fazlasinin olmasi',
          'D. Travmatik olaydan sonra asagidaki bilis ve duygu duzumundeki olumsuz degisikliklerden 2 veya daha fazlasinin olmasi',
          'E. Travmatik olaydan sonra asagidaki uyarilmislik ve tepkisellik degisikliklerinden 2 veya daha fazlasinin olmasi',
          'F. Belirtilerin suresi 1 aydan uzundur',
          'G. Klinik olarak anlamli sikintiyi veya bozulmayı yol aciyor',
          'H. Madde veya tibbi durumun fizyolojik etkilerine bagli degil',
        ],
        severity_specifiers: ['Disosiyatif belirti (depersonalizasyon/derealizasyon) ile', 'Gec baslangi ile (6 aydan fazla gecikme)'],
      },
      {
        code: 'F43.20',
        name: 'Uyum Bozuklugu',
        chapter: 'Travma ve Stresorle Iliskili Bozukluklar',
        criteria: [
          'A. Tanimlanabilen stresore yanit olarak duygusal veya davranissal belirtiler, stresore maruziyetten itibaren 3 ay icinde gelisir',
          'B. Asagidakilerden biri veya ikisi: (1) Stresorun siddetiyle veya kulturel bagilamiyla orantisiz asiri stres, (2) Sosyal, mesleki veya diger islevsellik alanlarında anlamli bozulma',
          'C. Stresle iliskili belirti, baska psikiyatrik bozuklugun kriteri karsilamaz',
          'D. Yas belirtisi degil',
          'E. Stresor sona erdiginde belirtiler 6 aydan fazla surmez',
        ],
      },
    ],
  },
  {
    title: 'Bipolar ve Iliskili Bozukluklar',
    diagnoses: [
      {
        code: 'F31',
        name: 'Bipolar I Bozuklugu',
        chapter: 'Bipolar ve Iliskili Bozukluklar',
        criteria: [
          'A. Manik atak icin kriterler karsilanmistir',
          '--- Manik Atak ---',
          'A. En az 1 hafta boyunca (herhangi bir sure, hastaneye yatirilma gerekiyorsa), gununun buyuk bolumunde, neredeyse her gun, anormal bicimde ve surdurulebilir sekilde yukselmis, guclendirilmis veya sinirli duygudurum ve hedefli etkinlik veya enerji artisi',
          'B. Duygudurum bozuklugu sirasinda asagidakilerden 3 veya daha fazlasi (4 sinirlilik varsa): (1)Sismis oz-saygi veya grandiosite, (2)Uyku ihtiyacinin azalmasi, (3)Her zamankinden daha cok konuskan veya konusmak icin baski altinda hissediyor, (4)Dusunce ucusu, (5)Dikkat daginimligi, (6)Hedefe yonelik etkinlik artisi veya psikomotor ajitasyon, (7)Istemcesine olumsuz sonuclar dogurabilecek etkinliklere asiri katilim',
          'C. Duygudurum bozuklugu mesleki islevsellik veya sosyal etkinliklerde belirgin bozulmaya yol acmaya veya pisikozun onlenmesi icin hastaneye yatirilmayi gerektirmeye yetecek kadar agirdir',
          'D. Madde veya tibbi durumun fizyolojik etkilerine bagli degil',
        ],
        notes: 'Hipomanik ve major depresif ataklar da olabilir ancak manik atak teshis icin yeterlidir.',
      },
      {
        code: 'F31.8',
        name: 'Bipolar II Bozuklugu',
        chapter: 'Bipolar ve Iliskili Bozukluklar',
        criteria: [
          'A. En az bir hipomanik atak ve en az bir major depresif atak icin kriterler karsilanmistir',
          'B. Hicbir zaman manik atak olmamistir',
          'C. Hipomanik veya major depresif atagin ortaya cikisi sizoaffektif bozukluk ile daha iyi aciklanamaz',
          'D. Depresyon belirtileri veya hipomani ile depresyon arasindaki tahmin edilemeyen degisim klinik olarak anlamli sikintiyi yol aciyor',
          '--- Hipomanik Atak ---',
          'Manik atagin tum kriterleri karsilanir ancak: (C) Atak mesleki bozulmaya yol acmayacak kadar agir degil ve hastaneye yatirma gerektirmiyor, psikotik ozellik yok',
          'Atak en az 4 ard arda gun surer',
        ],
      },
    ],
  },
  {
    title: 'Sizofreni Spektrumu ve Diger Psikotik Bozukluklar',
    diagnoses: [
      {
        code: 'F20.9',
        name: 'Sizofreni',
        chapter: 'Sizofreni Spektrumu ve Diger Psikotik Bozukluklar',
        criteria: [
          'A. Asagidakilerden 2 veya daha fazlasi, 1 aylik donemde onemli bir bolumunde mevcut; en az birinin (1), (2) veya (3) olmasi gerekir',
          '1. Sanrilar',
          '2. Halusinasyonlar',
          '3. Dagilmis konusma',
          '4. Ileri derecede dagilmis veya katatonik davranis',
          '5. Negatif belirtiler (azalmis duygusal ifade veya avolition)',
          'B. En az 6 aylik bozulma suresince mesleki veya kisisel islevsellikte belirgin duzeyde azalma',
          'C. Sizoaffektif bozukluk ve depresif veya bipolar bozukluk dislanmistir',
          'D. Madde veya tibbi durumun fizyolojik etkilerine bagli degil',
          'E. Otizm spektrum bozuklugu veya cocukluk cagi iletisim bozuklugu ile iliskisi degerlendirilmeli',
        ],
      },
    ],
  },
  {
    title: 'Kisilik Bozukluklari',
    diagnoses: [
      {
        code: 'F60.3',
        name: 'Borderline Kisilik Bozuklugu',
        chapter: 'Kisilik Bozukluklari',
        criteria: [
          'Erken eriskinlikte baslayan ve cesitli baglamlarda mevcut olan, asagidakilerden 5 veya daha fazlasiyla gosterilen, kisilik islevi ve kisilik arasi iliskilerinde yaygın istikrarsizlik kalibi:',
          '1. Gercek veya hayali terk edilmeden kacınmak icin calali cabalar',
          '2. Idealizasyon ve degerden dusurmeyi donusumlu olarak kullanan tutarsiz ve yoğun kisilik arası iliskiler kalibi',
          '3. Kimlik bozuklugu: Belirgin ve surdurulebilir bicimde istikrarsiz ozsaygi veya benlik algisi',
          '4. En az 2 alanda kendine zarar verme potansiyeli tasiyan durtuselluk (harcama, seks, madde kullanimi, dikkatsiz arac kullanma, tikınırcasına yeme)',
          '5. Yineleyici intihar davranisi, girisimleri ya da tehditleri veya kendine zarar verme davranisi',
          '6. Duygudurum tepkiselligine baglı belirgin duygulanım istikrarsizligi',
          '7. Kronik bosluk hissi',
          '8. Uygunsuz, yoğun ofke veya ofkeyi kontrol etmede gucluk',
          '9. Stresle iliskili gecici paranoid dusunce veya ciddi disosiyatif belirtiler',
        ],
      },
      {
        code: 'F60.0',
        name: 'Paranoid Kisilik Bozuklugu',
        chapter: 'Kisilik Bozukluklari',
        criteria: [
          'A. Erken eriskinlikte baslayan, asagidakilerden 4 veya daha fazlasiyla gosterilen yaygın guvensizlik ve suphecilik kalibi:',
          '1. Yeterli temeli olmaksizin baskalarinin kendisini somurdugunu, zararini istedigini veya kandirdigini kusuyor',
          '2. Arkadas ve is arkadaslarinin sadakat veya guvenilirligi konusunda onlayan, yersiz suphe',
          '3. Bilginin kendi aleyhine kullanilacagi korkusuyla sirlarini paylasma veya baskalarına guvenme isteksizligi',
          '4. Zararsiz soylenti veya olaylarda kendine yonelik asagılatici veya tehdit edici anlamlar okuma',
          '5. Kalici kin gütme (hakaretleri, zararlari veya kucuk goren davranislari bagislamama)',
          '6. Karakterine ya da itibarına saldirildigini algilama ve hizla karsi saldirıya gecme veya oflekeyle tepki verme',
          '7. Eslerin veya cinsel partnerlerinin sadakatsizligi konusunda yineleyici kuskular',
          'B. Yalnizca schizofreni, psikotik ozellikli bipolar veya depresif bozukluk ya da baska psikotik bozukluk sirasinda ortaya cikmiyor',
        ],
      },
      {
        code: 'F60.5',
        name: 'Obsesif-Kompulsif Kisilik Bozuklugu',
        chapter: 'Kisilik Bozukluklari',
        criteria: [
          'A. Erken eriskinlikte baslayan, asagidakilerden 4 veya daha fazlasiyla gosterilen, duzene, mukemmeliyetcilige, zihinsel ve kisilik arasi kontrole gosterdigi yaygın ugras kalibi:',
          '1. Faaliyetin temel noktasının kaybolmasina yol acen ayrinti, kurallar, listeler, duzende, organizasyon veya progremlerle ugras',
          '2. Gorevi tamamlamayı engelleyen mukemmeliyetcilik (kendi katı standartlarını karsilamadigi gerekce siyle bir projeyi tamamlayamiyor)',
          '3. Bos vakti ve arkadasliklari dislamaya gecen bicimde, isci etkinliklere asiri adanmislik',
          '4. Ahlak, etik veya degerler konusunda vicdan muhasebesi ve katilık',
          '5. Artik duygusal degeri kalmamis eslerce eskimis ya da degerssiz nesne veya hurdayi atma konusundaki isteksizlik',
          '6. Baskalarının kendi isini yapma yontemlerine boyun egmemesi durumunda isleri devretmekte ya da birlikte calismakta isteksizlik',
          '7. Kendisi ve baskalari icin para harcama konusundaki cimrilik (para birikimi gelecekteki felaketlere karsi temkin olarak biriktiriliyor)',
          '8. Katilık ve inatcilik',
        ],
      },
    ],
  },
  {
    title: 'Beslenme ve Yeme Bozukluklari',
    diagnoses: [
      {
        code: 'F50.0',
        name: 'Anoreksiya Nervoza',
        chapter: 'Beslenme ve Yeme Bozukluklari',
        criteria: [
          'A. Enerji aliniminin kisitlanmasi, yas, cinsiyet, gelisim egrisi ve fiziksel saglik temel alindiginda anlamli olcude dusuk vucut agirligina yol aciyor',
          'B. Dusuk vucut agirligina karsin kilo alma veya sismanlama konusundaki yoğun korku veya kilo almaya karsi suren davranis',
          'C. Vucut agirliginin veya sekilinin algisının bozulmasi, vucut agirliginin veya seklinin oz-degerlendirmede asiri etkisi veya mevcut dusuk vucut agirliginin ciddiyetinin tanimlanamamasi',
        ],
        severity_specifiers: ['Hafif: BMI >= 17', 'Orta: BMI 16-16.99', 'Agir: BMI 15-15.99', 'Cok Agir: BMI < 15'],
      },
      {
        code: 'F50.2',
        name: 'Bulimiya Nervoza',
        chapter: 'Beslenme ve Yeme Bozukluklari',
        criteria: [
          'A. Yineleyici tikınırcasına yeme ataklari. Atak: (1) Benzer kosullar altinda cogu kisi tarafindan yenen miktardan belirgin bicimde daha buyuk miktarda yeme, (2) Atak sirasında yeme uzerindeki kontrolunu yitirme duygusu',
          'B. Kilo almayı onlemek amaciyla yineleyici, uygunsuz telafi davranisları: kendiliğinden kusturma, laksatif/diuretik/diger ilac kullanimi, aclik, asiri egzersiz',
          'C. Hem tikınırcasına yeme hem de uygunsuz telafi davranislari en az 3 ay boyunca hafta da ortalama en az 1 kez olur',
          'D. Oz-degerlendirme asiri olcude vucut sekli ve agirligi tarafindan etkileniyor',
          'E. Bozukluk yalnizca anoreksiya nervoza episodlari sirasında ortaya cikmiyor',
        ],
      },
    ],
  },
  {
    title: 'Madde Kullanimi ve Bagimliligi',
    diagnoses: [
      {
        code: 'F10.10',
        name: 'Alkol Kullanim Bozuklugu',
        chapter: 'Madde Kullanimi ve Bagimliligi',
        criteria: [
          'Asagidakilerden en az 2 tanesinin son 12 ay icinde gorulmesi:',
          '1. Alkolün cogu kez buyük miktarlarda veya uzun sure icilmesi',
          '2. Alkolü azaltma veya kontrolaltına alma konusunda suren arzu veya basarisiz calismalar',
          '3. Alkol bulma, kullanma ve etkilerinden kurtulma icin cok fazla zaman harcanmasi',
          '4. Alkol icme istegi veya drtmecesi',
          '5. Yineleyici alkol kullanimi sonucunda isten, okululdan veya evden kaynaklanan yükümlülükleri yerine getirememe',
          '6. Alkol tarafindan yol acilan veya kötülestirilen sosyal ya da kisilik arasi sorunlara karsin alkol kullanimi sürdürülmesi',
          '7. Alkol kullanimi nedeniyle onemli sosyal, mesleki veya etkinlik turlerinden vazgecme ya da azaltma',
          '8. Bedensel olarak tehlike yaratan durumlarda yineleyici alkol kullanimi',
          '9. Alkol kullanimi tarafindan olusturuldugu veya kötülestirildigi bilindigi halde, suren bedensel veya psikolojik bir sorun',
          '10. Tolerans: Istenen etkiyi elde etmek icin belirgin bicimde arttirilmis miktarlarda alkol ihtiyaci ya da ayni miktarda alkol ile belirgin bicimde azalmis etki',
          '11. Yoksunluk: alkol yoksunluk sendromu belirtileri',
        ],
        severity_specifiers: ['Hafif: 2-3 belirti', 'Orta: 4-5 belirti', 'Agir: 6+ belirti'],
      },
    ],
  },
];

// Türkçe büyük İ/ı ve aksan farklarını arama dışı bırakmak için ASCII'ye indirger
const TR_FOLD: Record<string, string> = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };

export function foldTurkish(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/̇/g, '') // İ → i̇ dönüşümündeki combining dot
    .replace(/[̀-ͯ]/g, '')
    .replace(/[çğıöşü]/g, c => TR_FOLD[c] ?? c);
}

// Halk dilindeki terimleri DSM terminolojisine genişlet
const SYNONYMS: Record<string, string[]> = {
  depresyon: ['depresif'],
  kaygi: ['anksiyete'],
  endise: ['anksiyete'],
  panik: ['panik'],
  takinti: ['obsesif'],
  travma: ['travma', 'stresor'],
};

export function searchDiagnoses(query: string): DSMDiagnosis[] {
  const q = foldTurkish(query.trim());
  if (!q) return [];
  const terms = [q, ...(SYNONYMS[q] ?? [])];
  const results: DSMDiagnosis[] = [];
  for (const chapter of DSM5_DATA) {
    for (const diag of chapter.diagnoses) {
      const haystack = foldTurkish(`${diag.name} ${diag.code} ${diag.chapter}`);
      if (terms.some(t => haystack.includes(t))) {
        results.push(diag);
      }
    }
  }
  return results;
}

export function getDiagnosisByCode(code: string): DSMDiagnosis | undefined {
  const target = code.trim().toUpperCase();
  for (const chapter of DSM5_DATA) {
    const found = chapter.diagnoses.find(d => d.code.toUpperCase() === target);
    if (found) return found;
  }
  return undefined;
}
