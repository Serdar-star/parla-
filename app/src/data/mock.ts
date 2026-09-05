import type {
  BadgeDef,
  LanguageDef,
  LeaderRow,
  LessonNode,
  Question,
  Unit,
  VocabWord,
} from "@/types";
import { shuffle } from "@/lib/utils";

export const user = {
  name: "Ahmet Yılmaz",
  handle: "ahmetyilmaz",
  initials: "AY",
  level: 23,
  totalXp: 12450,
  weeklyXp: 3200,
  streak: 23,
  bestStreak: 45,
  language: "İngilizce",
  cefr: "A2",
  wordsLearned: 342,
  lessonsDone: 67,
  totalMinutes: 24 * 60 + 35,
  league: "Altın Lig",
  leagueRank: 3,
  dailyGoal: 10,
  todayMinutes: 7,
  badgesEarned: 12,
  friends: 8,
  joined: "Mart 2025",
  bio: "Her gün bir kelime, bir gün bir dünya. 🌍",
  xpToNext: 550,
  levelXp: 450,
};

export const weeklyXp = [
  { day: "Pzt", xp: 120 },
  { day: "Sal", xp: 85 },
  { day: "Çar", xp: 200 },
  { day: "Per", xp: 150 },
  { day: "Cum", xp: 300 },
  { day: "Cmt", xp: 180 },
  { day: "Paz", xp: 250 },
];

export const skills = [
  { name: "Dinleme", value: 72 },
  { name: "Konuşma", value: 58 },
  { name: "Okuma", value: 85 },
  { name: "Yazma", value: 63 },
  { name: "Gramer", value: 70 },
  { name: "Kelime", value: 78 },
];

export const badges: BadgeDef[] = [
  { id: "b1", name: "7 Günlük Seri", desc: "7 gün üst üste ders çalış", icon: "🔥", color: "#ff7d52", earned: true, date: "2 hafta önce" },
  { id: "b2", name: "50 Ders", desc: "50 ders tamamla", icon: "🎓", color: "#23c281", earned: true, date: "1 hafta önce" },
  { id: "b3", name: "Tam Puan", desc: "Bir derste hiç hata yapma", icon: "💯", color: "#f7b32b", earned: true, date: "5 gün önce" },
  { id: "b4", name: "İlk Arkadaş", desc: "İlk arkadaşını ekle", icon: "🤝", color: "#8b5cf6", earned: true, date: "4 gün önce" },
  { id: "b5", name: "Hız Ustası", desc: "30 sn'de 10 doğru cevap", icon: "⚡", color: "#38bdf8", earned: true, date: "2 gün önce" },
  { id: "b6", name: "Gece Kuşu", desc: "Gece yarısından sonra ders yap", icon: "🦉", color: "#6366f1", earned: true },
  { id: "b7", name: "Erken Kalkan", desc: "06:00'dan önce ders yap", icon: "🌅", color: "#fb923c", earned: true },
  { id: "b8", name: "Kelime Avcısı", desc: "100 kelime öğren", icon: "🎯", color: "#23c281", earned: true },
  { id: "b9", name: "Süper Seri", desc: "30 günlük seriye ulaş", icon: "🚀", color: "#ff6a3d", earned: true },
  { id: "b10", name: "Mükemmeliyetçi", desc: "5 derste tam puan", icon: "💎", color: "#38bdf8", earned: true },
  { id: "b11", name: "Sosyal Kelebek", desc: "10 arkadaş edin", icon: "🦋", color: "#ec4899", earned: true },
  { id: "b12", name: "Boss Avcısı", desc: "İlk boss'u yen", icon: "🐉", color: "#e5484d", earned: true },
  { id: "b13", name: "30 Günlük Seri", desc: "30 gün üst üste ders çalış", icon: "🌋", color: "#ff6a3d", earned: false },
  { id: "b14", name: "Poliglot", desc: "2 dili birden A2'ye getir", icon: "🧠", color: "#8b5cf6", earned: false },
  { id: "b15", name: "Maraton", desc: "Bir günde 60 dk çalış", icon: "🏃", color: "#f7b32b", earned: false },
  { id: "b16", name: "Efsane", desc: "Şampiyon Lig'e yüksel", icon: "👑", color: "#f0a90f", earned: false },
];

export const quests = [
  { id: "q1", title: "1 ders tamamla", icon: "📚", xp: 20, done: true },
  { id: "q2", title: "5 kelime tekrar et", icon: "🔁", xp: 15, done: false },
  { id: "q3", title: "2 dakika konuşma yap", icon: "🎙️", xp: 25, done: false },
  { id: "q4", title: "Arkadaşına meydan oku", icon: "⚔️", xp: 30, done: false },
];

export const languages: LanguageDef[] = [
  { code: "en", name: "İngilizce", flag: "🇬🇧", speakers: "1.5 milyar", learners: "4.2M" },
  { code: "es", name: "İspanyolca", flag: "🇪🇸", speakers: "595 milyon", learners: "2.8M" },
  { code: "fr", name: "Fransızca", flag: "🇫🇷", speakers: "321 milyon", learners: "1.9M" },
  { code: "de", name: "Almanca", flag: "🇩🇪", speakers: "135 milyon", learners: "1.4M" },
  { code: "it", name: "İtalyanca", flag: "🇮🇹", speakers: "68 milyon", learners: "980K" },
  { code: "ja", name: "Japonca", flag: "🇯🇵", speakers: "125 milyon", learners: "1.1M" },
  { code: "ko", name: "Korece", flag: "🇰🇷", speakers: "81 milyon", learners: "890K" },
  { code: "pt", name: "Portekizce", flag: "🇵🇹", speakers: "264 milyon", learners: "760K" },
  { code: "zh", name: "Çince", flag: "🇨🇳", speakers: "1.1 milyar", learners: "640K" },
  { code: "ar", name: "Arapça", flag: "🇸🇦", speakers: "422 milyon", learners: "510K" },
];

export const vocabEn: VocabWord[] = [
  { en: "apple", tr: "elma", emoji: "🍎", category: "Yiyecek", phonetic: "/ˈæp.əl/", pos: "isim", example: "I eat an apple every morning.", exampleTr: "Her sabah bir elma yerim.", synonyms: ["fruit"], antonyms: [] },
  { en: "water", tr: "su", emoji: "💧", category: "İçecek", phonetic: "/ˈwɔː.tər/", pos: "isim", example: "She drinks water after running.", exampleTr: "Koşudan sonra su içer.", synonyms: ["liquid", "aqua"], antonyms: [] },
  { en: "bread", tr: "ekmek", emoji: "🍞", category: "Yiyecek", phonetic: "/bred/", pos: "isim", example: "We buy fresh bread from the bakery.", exampleTr: "Fırından taze ekmek alırız.", synonyms: ["loaf"], antonyms: [] },
  { en: "coffee", tr: "kahve", emoji: "☕", category: "İçecek", phonetic: "/ˈkɒf.i/", pos: "isim", example: "My father loves black coffee.", exampleTr: "Babam sade kahveyi sever.", synonyms: ["brew"], antonyms: ["tea"] },
  { en: "house", tr: "ev", emoji: "🏠", category: "Şehir", phonetic: "/haʊs/", pos: "isim", example: "Their house has a red door.", exampleTr: "Evlerinin kırmızı bir kapısı var.", synonyms: ["home", "residence"], antonyms: [] },
  { en: "street", tr: "sokak", emoji: "🛣️", category: "Şehir", phonetic: "/striːt/", pos: "isim", example: "The street is full of flowers.", exampleTr: "Sokak çiçeklerle dolu.", synonyms: ["road", "avenue"], antonyms: [] },
  { en: "school", tr: "okul", emoji: "🏫", category: "Şehir", phonetic: "/skuːl/", pos: "isim", example: "Children walk to school together.", exampleTr: "Çocuklar okula birlikte yürür.", synonyms: ["academy"], antonyms: [] },
  { en: "morning", tr: "sabah", emoji: "🌅", category: "Zaman", phonetic: "/ˈmɔː.nɪŋ/", pos: "isim", example: "I run in the morning.", exampleTr: "Sabahları koşarım.", synonyms: ["dawn"], antonyms: ["evening", "night"] },
  { en: "night", tr: "gece", emoji: "🌙", category: "Zaman", phonetic: "/naɪt/", pos: "isim", example: "The city is quiet at night.", exampleTr: "Gece şehir sessizdir.", synonyms: ["evening"], antonyms: ["day", "morning"] },
  { en: "happy", tr: "mutlu", emoji: "😊", category: "Duygular", phonetic: "/ˈhæp.i/", pos: "sıfat", example: "She feels happy with her friends.", exampleTr: "Arkadaşlarıyla mutlu hisseder.", synonyms: ["glad", "joyful"], antonyms: ["sad"] },
  { en: "tired", tr: "yorgun", emoji: "😴", category: "Duygular", phonetic: "/taɪəd/", pos: "sıfat", example: "He is tired after long work.", exampleTr: "Uzun işten sonra yorgun.", synonyms: ["weary", "sleepy"], antonyms: ["energetic"] },
  { en: "friend", tr: "arkadaş", emoji: "🤝", category: "İnsanlar", phonetic: "/frend/", pos: "isim", example: "My best friend lives in İzmir.", exampleTr: "En iyi arkadaşım İzmir'de yaşıyor.", synonyms: ["buddy", "pal"], antonyms: ["enemy"] },
  { en: "family", tr: "aile", emoji: "👨‍👩‍👧", category: "İnsanlar", phonetic: "/ˈfæm.əl.i/", pos: "isim", example: "My family has five people.", exampleTr: "Ailem beş kişilik.", synonyms: ["relatives"], antonyms: [] },
  { en: "book", tr: "kitap", emoji: "📖", category: "Günlük", phonetic: "/bʊk/", pos: "isim", example: "I read a book before sleep.", exampleTr: "Uyumadan önce kitap okurum.", synonyms: ["novel", "volume"], antonyms: [] },
  { en: "phone", tr: "telefon", emoji: "📱", category: "Günlük", phonetic: "/fəʊn/", pos: "isim", example: "Her phone is on the table.", exampleTr: "Telefonu masanın üstünde.", synonyms: ["mobile"], antonyms: [] },
  { en: "dog", tr: "köpek", emoji: "🐶", category: "Doğa", phonetic: "/dɒɡ/", pos: "isim", example: "The dog runs in the park.", exampleTr: "Köpek parkta koşar.", synonyms: ["puppy", "hound"], antonyms: ["cat"] },
  { en: "tree", tr: "ağaç", emoji: "🌳", category: "Doğa", phonetic: "/triː/", pos: "isim", example: "There is a big tree in our garden.", exampleTr: "Bahçemizde büyük bir ağaç var.", synonyms: ["plant"], antonyms: [] },
  { en: "sun", tr: "güneş", emoji: "☀️", category: "Doğa", phonetic: "/sʌn/", pos: "isim", example: "The sun rises in the east.", exampleTr: "Güneş doğudan doğar.", synonyms: ["star"], antonyms: ["moon"] },
  { en: "rain", tr: "yağmur", emoji: "🌧️", category: "Doğa", phonetic: "/reɪn/", pos: "isim", example: "The rain started suddenly.", exampleTr: "Yağmur aniden başladı.", synonyms: ["shower"], antonyms: ["drought"] },
  { en: "run", tr: "koşmak", emoji: "🏃", category: "Fiiller", phonetic: "/rʌn/", pos: "fiil", example: "They run along the beach.", exampleTr: "Sahil boyunca koşarlar.", synonyms: ["jog", "sprint"], antonyms: ["walk"] },
  { en: "eat", tr: "yemek", emoji: "🍽️", category: "Fiiller", phonetic: "/iːt/", pos: "fiil", example: "We eat dinner at seven.", exampleTr: "Akşam yemeğini yedide yeriz.", synonyms: ["consume"], antonyms: [] },
  { en: "read", tr: "okumak", emoji: "🤓", category: "Fiiller", phonetic: "/riːd/", pos: "fiil", example: "She reads two books a month.", exampleTr: "Ayda iki kitap okur.", synonyms: ["study"], antonyms: [] },
  { en: "blue", tr: "mavi", emoji: "🔵", category: "Renkler", phonetic: "/bluː/", pos: "sıfat", example: "The sea is deep blue today.", exampleTr: "Deniz bugün koyu mavi.", synonyms: ["azure"], antonyms: [] },
  { en: "warm", tr: "sıcak", emoji: "🌡️", category: "Duygular", phonetic: "/wɔːm/", pos: "sıfat", example: "Spring days are warm and bright.", exampleTr: "Bahar günleri sıcak ve parlak olur.", synonyms: ["hot"], antonyms: ["cold"] },
];

export const vocabEs: VocabWord[] = [
  { en: "hola", tr: "merhaba", emoji: "👋", category: "Selamlaşma", phonetic: "/ˈo.la/", pos: "ünlem", example: "¡Hola! ¿Cómo estás?", exampleTr: "Merhaba! Nasılsın?", synonyms: ["saludos"], antonyms: [] },
  { en: "gracias", tr: "teşekkürler", emoji: "🙏", category: "Selamlaşma", phonetic: "/ˈɡɾa.θjas/", pos: "ünlem", example: "Muchas gracias por tu ayuda.", exampleTr: "Yardımın için çok teşekkürler.", synonyms: ["mil gracias"], antonyms: [] },
  { en: "agua", tr: "su", emoji: "💧", category: "İçecek", phonetic: "/ˈa.ɣwa/", pos: "isim", example: "Quiero un vaso de agua.", exampleTr: "Bir bardak su istiyorum.", synonyms: [], antonyms: [] },
  { en: "casa", tr: "ev", emoji: "🏠", category: "Şehir", phonetic: "/ˈka.sa/", pos: "isim", example: "Mi casa es tu casa.", exampleTr: "Evim evindir.", synonyms: ["hogar"], antonyms: [] },
  { en: "amigo", tr: "arkadaş", emoji: "🤝", category: "İnsanlar", phonetic: "/aˈmi.ɣo/", pos: "isim", example: "Él es mi mejor amigo.", exampleTr: "O benim en iyi arkadaşım.", synonyms: ["compañero"], antonyms: ["enemigo"] },
  { en: "sol", tr: "güneş", emoji: "☀️", category: "Doğa", phonetic: "/sol/", pos: "isim", example: "El sol brilla hoy.", exampleTr: "Güneş bugün parlıyor.", synonyms: [], antonyms: ["luna"] },
  { en: "comer", tr: "yemek", emoji: "🍽️", category: "Fiiller", phonetic: "/koˈmeɾ/", pos: "fiil", example: "Vamos a comer juntos.", exampleTr: "Birlikte yiyelim.", synonyms: [], antonyms: [] },
  { en: "playa", tr: "plaj", emoji: "🏖️", category: "Seyahat", phonetic: "/ˈpla.ʝa/", pos: "isim", example: "La playa está cerca.", exampleTr: "Plaj yakın.", synonyms: ["costa"], antonyms: [] },
];

export const vocabFr: VocabWord[] = [
  { en: "bonjour", tr: "günaydın", emoji: "👋", category: "Selamlaşma", phonetic: "/bɔ̃.ʒuʁ/", pos: "ünlem", example: "Bonjour, comment allez-vous ?", exampleTr: "Günaydın, nasılsınız?", synonyms: ["salut"], antonyms: [] },
  { en: "merci", tr: "teşekkürler", emoji: "🙏", category: "Selamlaşma", phonetic: "/mɛʁ.si/", pos: "ünlem", example: "Merci beaucoup !", exampleTr: "Çok teşekkürler!", synonyms: [], antonyms: [] },
  { en: "pain", tr: "ekmek", emoji: "🥖", category: "Yiyecek", phonetic: "/pɛ̃/", pos: "isim", example: "J'achète du pain frais.", exampleTr: "Taze ekmek alıyorum.", synonyms: ["baguette"], antonyms: [] },
  { en: "maison", tr: "ev", emoji: "🏠", category: "Şehir", phonetic: "/mɛ.zɔ̃/", pos: "isim", example: "La maison est grande.", exampleTr: "Ev büyük.", synonyms: ["foyer"], antonyms: [] },
  { en: "ami", tr: "arkadaş", emoji: "🤝", category: "İnsanlar", phonetic: "/a.mi/", pos: "isim", example: "C'est mon meilleur ami.", exampleTr: "O benim en iyi arkadaşım.", synonyms: ["copain"], antonyms: [] },
  { en: "soleil", tr: "güneş", emoji: "☀️", category: "Doğa", phonetic: "/sɔ.lɛj/", pos: "isim", example: "Le soleil se lève.", exampleTr: "Güneş doğuyor.", synonyms: [], antonyms: ["lune"] },
];

export function vocabFor(course: string): VocabWord[] {
  if (course === "es") return vocabEs;
  if (course === "fr") return vocabFr;
  return vocabEn;
}

export const leaderboard: LeaderRow[] = [
  { rank: 1, name: "Zeynep K.", handle: "zeynepk", xp: 4500, delta: 0, hue: 340 },
  { rank: 2, name: "Can A.", handle: "canan", xp: 3800, delta: 1, hue: 210 },
  { rank: 3, name: "Ahmet Y.", handle: "ahmetyilmaz", xp: 3200, delta: -1, you: true, hue: 150 },
  { rank: 4, name: "Elif S.", handle: "elifs", xp: 2900, delta: 2, hue: 40 },
  { rank: 5, name: "Mert O.", handle: "merto", xp: 2600, delta: 0, hue: 280 },
  { rank: 6, name: "Selin D.", handle: "selind", xp: 2350, delta: 3, hue: 190 },
  { rank: 7, name: "Baran T.", handle: "barant", xp: 2100, delta: -2, hue: 20 },
  { rank: 8, name: "Deniz Ç.", handle: "denizc", xp: 1900, delta: 1, hue: 90 },
  { rank: 9, name: "Kaan B.", handle: "kaanb", xp: 1700, delta: -1, hue: 250 },
  { rank: 10, name: "İpek N.", handle: "ipekn", xp: 1500, delta: 0, hue: 310 },
];

export const unitTemplates: { title: string; subtitle: string; emoji: string; color: string; lessons: { title: string; kind: LessonNode["kind"] }[] }[] = [
  {
    title: "Selamlaşma ve Tanışma",
    subtitle: "Merhaba demeyi ve kendini tanıtmayı öğren",
    emoji: "👋",
    color: "#23c281",
    lessons: [
      { title: "İlk Kelimeler", kind: "ders" },
      { title: "Selam Ver", kind: "konuşma" },
      { title: "Tanışma Diyalogları", kind: "ders" },
      { title: "Dinleme Pratiği", kind: "dinleme" },
      { title: "Ünite Canavarı", kind: "boss" },
    ],
  },
  {
    title: "Yiyecek ve İçecek",
    subtitle: "Sipariş ver, menüleri anla",
    emoji: "🍽️",
    color: "#f7b32b",
    lessons: [
      { title: "Kahvaltı Kelimeleri", kind: "ders" },
      { title: "Kafede Sipariş", kind: "hikaye" },
      { title: "Tatlar ve Menü", kind: "ders" },
      { title: "Sesli Menü", kind: "dinleme" },
      { title: "Telaffuz Turu", kind: "konuşma" },
      { title: "Ünite Canavarı", kind: "boss" },
    ],
  },
  {
    title: "Şehirde Hayat",
    subtitle: "Yol tarifi al, şehirde gez",
    emoji: "🏙️",
    color: "#ff7d52",
    lessons: [
      { title: "Şehir Kelimeleri", kind: "ders" },
      { title: "Yol Sorma", kind: "konuşma" },
      { title: "Toplu Taşıma", kind: "ders" },
      { title: "Anons Dinleme", kind: "dinleme" },
      { title: "Ünite Canavarı", kind: "boss" },
    ],
  },
];

export function unitsFor(level: string): Unit[] {
  if (level !== "A1") {
    const colors = ["#23c281", "#8b5cf6"];
    const titles: Record<string, [string, string]> = {
      A2: ["Geçmiş Zaman Hikâyeleri", "Planlar ve Hayaller"],
      B1: ["İş ve Kariyer", "Duygular ve İlişkiler"],
      B2: ["Soyut Fikirler", "Medya ve Haberler"],
      C1: ["Akademik Dil", "İkna ve Müzakere"],
      C2: ["Ustalık Metinleri", "Kültürel Derinlik"],
    };
    const t = titles[level] ?? titles.A2;
    return t.map((title, ui) => ({
      id: `${level}-u${ui + 1}`,
      no: ui + 1,
      title,
      subtitle: "Bu seviye yakında açılacak yolculuğun bir parçası",
      emoji: ui === 0 ? "🧭" : "🔭",
      color: colors[ui % 2],
      lessons: Array.from({ length: 5 }, (_, li) => ({
        id: `${level}-u${ui + 1}-l${li + 1}`,
        title: li === 4 ? "Ünite Canavarı" : `Ders ${li + 1}`,
        kind: (li === 4 ? "boss" : li % 3 === 1 ? "konuşma" : "ders") as LessonNode["kind"],
        xp: li === 4 ? 60 : 20 + li * 5,
        duration: li === 4 ? "12 dk" : "7 dk",
        stars: 0,
        status: "locked" as const,
      })),
    }));
  }
  return unitTemplates.map((u, ui) => ({
    id: `a1-u${ui + 1}`,
    no: ui + 1,
    title: u.title,
    subtitle: u.subtitle,
    emoji: u.emoji,
    color: u.color,
    lessons: u.lessons.map((l, li) => {
      let status: LessonNode["status"] = "locked";
      if (ui === 0) status = "completed";
      if (ui === 1) status = li === 0 ? "completed" : li === 1 ? "active" : "locked";
      return {
        id: `a1-u${ui + 1}-l${li + 1}`,
        title: l.title,
        kind: l.kind,
        xp: l.kind === "boss" ? 60 : 20 + li * 5,
        duration: l.kind === "boss" ? "12 dk" : "7 dk",
        stars: status === "completed" ? 2 + ((ui + li) % 2) : 0,
        status,
      };
    }),
  }));
}

export function buildLesson(id: string, course: string): Question[] {
  const vocab = vocabFor(course);
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const words = shuffle(vocab, seed).slice(0, 14);
  const w = (i: number) => words[i % words.length];
  const optsFor = (word: VocabWord, key: "tr" | "en") => {
    const others = shuffle(vocab.filter((v) => v.en !== word.en), seed + 1).slice(0, 3);
    return shuffle([word[key], ...others.map((o) => o[key])], seed + 2);
  };
  const s1 = w(0);
  const s2 = w(6);
  return [
    { type: "sec", prompt: `Bu kelimenin anlamı nedir?`, word: w(0), options: optsFor(w(0), "tr") },
    { type: "dinle", word: w(1), options: optsFor(w(1), "tr") },
    {
      type: "eslestir",
      pairs: [w(2), w(3), w(4), w(5), w(12)].map((x) => ({ left: x.en, right: x.tr })),
    },
    { type: "resim", prompt: `Hangisi “${w(7).tr}” anlamına geliyor?`, answer: w(7), options: shuffle([w(7), w(8), w(9), w(10)], seed + 3) },
    { type: "sirala", prompt: "Her gün su içerim.", answer: ["I", "drink", "water", "every", "day"], bank: shuffle(["I", "drink", "water", "every", "day"], seed + 4) },
    { type: "bosluk", sentence: ["She reads a ", " before sleep."], answer: "book", options: shuffle(["book", s2.en, w(11).en, "run"], seed + 5) },
    { type: "konuş", word: w(13) },
    { type: "sec", prompt: "Peki bu kelimenin anlamı ne?", word: w(11), options: optsFor(w(11), "tr") },
  ];
}

export const testimonials = [
  { name: "Melis Aydın", country: "Türkiye", stars: 5, text: "Üç ayda İspanyolca sipariş verecek seviyeye geldim. Boss savaşları yüzünden ders bitirmek için gece 1'de uyandığım oldu. Bağımlılık yapar, uyarayım.", hue: 340 },
  { name: "Jonas Weber", country: "Almanya", stars: 5, text: "AI öğretmeni gece 2'de gramer sorularımla bunaltıyorum ve asla sıkılmıyor. 'Konuşma pratiği' diye bir şey varmış, onu öğrendim.", hue: 210 },
  { name: "Sofia Rossi", country: "İtalya", stars: 5, text: "Tasarımı o kadar güzel ki ders çalışmak yerine uygulamayı açmaya bahane arıyorum. Seri koruma kalkanı olmasaydı 45 günlük serim yanmıştı.", hue: 30 },
  { name: "Kenji Tanaka", country: "Japonya", stars: 4, text: "Hafıza kartları oyunu sayesinde kelime ezberi işkence olmaktan çıktı. Tek eksiğim: Türkçe kursunun henüz olmaması!", hue: 0 },
  { name: "Emma Laurent", country: "Fransa", stars: 5, text: "Lig sistemi beni haftada 5 saat çalıştırıyor. Altın Lig'den düşmemek için metrodaki 20 dakikam artık ders molası.", hue: 270 },
];

export const pricing = [
  {
    name: "Ücretsiz",
    price: "0₺",
    period: "sonsuz dek",
    desc: "Öğrenmeye başlamak için ihtiyacın olan her şey.",
    popular: false,
    features: ["Tüm dersler ve seviyeler", "Günlük 5 can", "Temel tekrar sistemi", "Lig sıralamaları", "Reklamsız deneyim"],
  },
  {
    name: "Premium",
    price: "129₺",
    period: "aylık",
    desc: "Ciddi öğrenenler için sınırsız güç.",
    popular: true,
    features: ["Sınırsız can ❤️", "AI öğretmenle sınırsız sohbet", "Kişisel çalışma planı", "Çevrimdışı dersler", "Seri koruma kalkanı", "Reklamsız + rozet takibi"],
  },
  {
    name: "Pro",
    price: "249₺",
    period: "aylık",
    desc: "Poliglot olmak isteyenler için tam paket.",
    popular: false,
    features: ["Premium'daki her şey", "Aynı anda 3 dil", "Birebir konuşma kulübü", "Sertifika sınavları", "Öncelikli destek", "Aile profili (4 kişi)"],
  },
];

export const features = [
  { icon: "🤖", title: "AI Özel Öğretmen", desc: "7/24 sabırlı, esprili ve seni tanıyan yapay zekâ öğretmeninle istediğin konuda sohbet ederek öğren." },
  { icon: "🎮", title: "Oyunlaştırılmış Dersler", desc: "Boss savaşları, ligler, seriler ve XP. Beynin oyun oynadığını sanırken sen dil öğrenirsin." },
  { icon: "🧠", title: "Akıllı Tekrar Sistemi", desc: "Bilimsel aralıklı tekrar algoritması, kelimeyi tam unutacakken karşına çıkarır. Kalıcı hafıza garantili." },
  { icon: "🎙️", title: "Gerçek Konuşma Pratiği", desc: "Telaffuzunu anında analiz eden ses teknolojisi ile konuşma korkusunu evde yen, sokakta parılda." },
  { icon: "⚔️", title: "Lig ve Meydan Okumalar", desc: "Haftalık ligde yüksel, arkadaşlarına meydan oku, sezon sonunda şampiyonluk kupasını kap." },
  { icon: "📴", title: "Çevrimdışı Mod", desc: "Uçakta, metroda, dağ başında. Derslerini indir, internet olmadan da seri asla bozulmasın." },
];

export const heroWords = [
  { text: "Merhaba", lang: "TR", x: "8%", y: "18%", delay: 0 },
  { text: "Hello", lang: "EN", x: "78%", y: "14%", delay: 0.6 },
  { text: "Bonjour", lang: "FR", x: "12%", y: "68%", delay: 1.2 },
  { text: "Hola", lang: "ES", x: "84%", y: "62%", delay: 0.3 },
  { text: "こんにちは", lang: "JA", x: "70%", y: "82%", delay: 0.9 },
  { text: "Ciao", lang: "IT", x: "22%", y: "86%", delay: 1.5 },
];

export const dictCategories = ["Tümü", "Yiyecek", "İçecek", "Şehir", "Zaman", "Duygular", "İnsanlar", "Günlük", "Doğa", "Fiiller", "Renkler", "Selamlaşma", "Seyahat"];

export const activityFeed = [
  { icon: "🏆", text: "Hız Ustası rozetini kazandın", time: "2 saat önce" },
  { icon: "⚡", text: "300 XP ile haftanın rekorunu kırdın", time: "dün" },
  { icon: "📚", text: "“Yiyecek ve İçecek” ünitesinde 3 ders bitirdin", time: "dün" },
  { icon: "🔥", text: "23 günlük seriye ulaştın", time: "2 gün önce" },
];

export interface Friend {
  name: string;
  handle: string;
  hue: number;
  streak: number;
  weeklyXp: number;
  online: boolean;
  learning: string;
}

export const friends: Friend[] = [
  { name: "Zeynep K.", handle: "zeynepk", hue: 340, streak: 67, weeklyXp: 4500, online: true, learning: "İspanyolca" },
  { name: "Can A.", handle: "canan", hue: 210, streak: 41, weeklyXp: 3800, online: true, learning: "İngilizce" },
  { name: "Elif S.", handle: "elifs", hue: 40, streak: 33, weeklyXp: 2900, online: false, learning: "Fransızca" },
  { name: "Mert O.", handle: "merto", hue: 280, streak: 19, weeklyXp: 2600, online: true, learning: "Japonca" },
  { name: "Selin D.", handle: "selind", hue: 190, streak: 52, weeklyXp: 2350, online: false, learning: "Almanca" },
  { name: "Baran T.", handle: "barant", hue: 20, streak: 8, weeklyXp: 2100, online: false, learning: "Korece" },
];

export const suggestedLearners = [
  { name: "Deren K.", handle: "derenk", hue: 120, streak: 94, desc: "94 gündür İspanyolca çalışıyor" },
  { name: "Umut B.", handle: "umutb", hue: 260, streak: 120, desc: "Efsane ligde 120 günlük seri" },
  { name: "Lina M.", handle: "linam", hue: 0, streak: 45, desc: "Seninle aynı ligde, Altın" },
];

export const friendFeed = [
  { id: "f1", name: "Zeynep K.", hue: 340, text: "“Havaalanında Kayıp Bavul” hikâyesini bitirdi", time: "12 dk önce", icon: "📖", claps: 8 },
  { id: "f2", name: "Can A.", hue: 210, text: "Kelime Avı'nda 480 puan yaptı — rekorunu geçebilirsin!", time: "1 saat önce", icon: "🎯", claps: 14 },
  { id: "f3", name: "Mert O.", hue: 280, text: "Kelime Lordu boss'unu yendi", time: "3 saat önce", icon: "🐉", claps: 6 },
  { id: "f4", name: "Selin D.", hue: 190, text: "50 günlük seriye ulaştı", time: "dün", icon: "🔥", claps: 23 },
];

export const leagueLadder = [
  { id: "bronz", name: "Bronz", icon: "🥉", color: "#cd7f32" },
  { id: "gumus", name: "Gümüş", icon: "🥈", color: "#9ca3af" },
  { id: "altin", name: "Altın", icon: "🥇", color: "#f0a90f" },
  { id: "platin", name: "Platin", icon: "💠", color: "#2dd4bf" },
  { id: "elmas", name: "Elmas", icon: "💎", color: "#a78bfa" },
  { id: "sampiyon", name: "Şampiyon", icon: "👑", color: "#f43f5e" },
];

export const seasonRewards = [
  { place: "🥇 1.", title: "Şampiyon Sandığı", desc: "500 💎 + “Lig Efsanesi” rozeti", color: "border-gold/50 bg-goldsoft" },
  { place: "🥈 2.", title: "Yükselme + Hazine", desc: "Bir üst lige çık + 250 💎", color: "border-line bg-surface" },
  { place: "📉 Son 2", title: "Küme Düşme", desc: "Bir alt lige inersin — dikkat!", color: "border-danger/30 bg-dangersoft/60" },
];

export const duoQuests = [
  { id: "d1", partner: "Zeynep K.", hue: 340, title: "Birlikte 50 kelime öğrenin", progress: 32, target: 50, reward: "40 💎", daysLeft: 3 },
  { id: "d2", partner: "Can A.", hue: 210, title: "3 düelloluk seri yapın", progress: 1, target: 3, reward: "Gizemli Sandık 🎁", daysLeft: 5 },
];

export interface Achievement {
  icon: string;
  name: string;
  desc: string;
  tier: number;
  tiers: number;
  progress: number;
  target: number;
  color: string;
}

export const achievements: Achievement[] = [
  { icon: "🔥", name: "Ateşli", desc: "30 günlük seriye ulaş", tier: 2, tiers: 5, progress: 23, target: 30, color: "#ff9600" },
  { icon: "🎓", name: "Bilgin", desc: "100 ders tamamla", tier: 3, tiers: 5, progress: 67, target: 100, color: "#58cc02" },
  { icon: "💰", name: "Hazine Avcısı", desc: "2.000 elmas topla", tier: 2, tiers: 5, progress: 1240, target: 2000, color: "#1cb0f6" },
  { icon: "🏆", name: "Şampiyon", desc: "Bir lig sezonunu ilk 2'de bitir", tier: 1, tiers: 5, progress: 1, target: 3, color: "#ffc800" },
  { icon: "📚", name: "Kitap Kurdu", desc: "10 hikâye bölümü bitir", tier: 1, tiers: 5, progress: 3, target: 10, color: "#9b5cff" },
  { icon: "🎯", name: "Keskin Nişancı", desc: "25 derste tam puan al", tier: 2, tiers: 5, progress: 14, target: 25, color: "#ff4b4b" },
  { icon: "🗣️", name: "Geveze", desc: "AI öğretmenle 60 dk sohbet et", tier: 3, tiers: 5, progress: 44, target: 60, color: "#ff9600" },
  { icon: "🐉", name: "Ejderha Katili", desc: "15 boss yen", tier: 1, tiers: 5, progress: 6, target: 15, color: "#8b5cf6" },
];

export const monthlyQuests = [
  { icon: "📚", title: "20 ders tamamla", progress: 13, target: 20, reward: "50 💎" },
  { icon: "🔁", title: "100 kelime tekrar et", progress: 64, target: 100, reward: "80 💎" },
  { icon: "🐉", title: "3 boss yen", progress: 2, target: 3, reward: "Gizemli Sandık 🎁" },
];

export const tierNames = ["Bronz", "Gümüş", "Altın", "Elmas", "Efsane"];
export const tierColors = ["#cd7f32", "#9ca3af", "#f0a90f", "#a78bfa", "#f43f5e"];

export const recentUnlocks = [
  { icon: "🏆", name: "Hız Ustası", tier: "Altın", time: "2 saat önce", color: "#f0a90f" },
  { icon: "🔥", name: "Ateşli", tier: "Gümüş", time: "dün", color: "#9ca3af" },
  { icon: "🐉", name: "Ejderha Katili", tier: "Bronz", time: "2 gün önce", color: "#cd7f32" },
  { icon: "🎓", name: "Bilgin", tier: "Altın", time: "3 gün önce", color: "#f0a90f" },
];

export function wordLevel(en: string): string {
  const levels = ["A1", "A1", "A2", "A2", "B1"];
  let h = 0;
  for (const c of en) h = (h * 31 + c.charCodeAt(0)) % 997;
  return levels[h % levels.length];
}

export function wordMastery(en: string): number {
  let h = 0;
  for (const c of en) h = (h * 33 + c.charCodeAt(0)) % 100;
  return 25 + (h % 70);
}

export const wordTips = [
  "Bu kelimeyi bir cümlede kullan, hafızana mühürle. ✍️",
  "Sesli oku — telaffuz kasların öğrensin. 🎙️",
  "Eş anlamlısıyla birlikte ezberle, 2'si 1 arada. 🧠",
  "Bu kelime günlük konuşmada çok sık geçer. 🔁",
  "Bir görselle eşleştir, unutması imkânsız olur. 🖼️",
];
