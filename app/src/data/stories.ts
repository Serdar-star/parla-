export interface StoryCharacter {
  name: string;
  hue: number;
  emoji: string;
}

export type StoryBeat =
  | { kind: "line"; who: number; text: string; hint?: string; scene?: string }
  | { kind: "choice"; prompt: string; options: { text: string; reaction: string; best?: boolean }[] }
  | { kind: "quiz"; question: string; options: string[]; answer: number; explain: string };

export interface Phrase {
  en: string;
  tr: string;
  note: string;
}

export interface Episode {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  tagline: string;
  hue: number;
  level: string;
  minutes: string;
  xp: number;
  locked?: boolean;
  cast: StoryCharacter[];
  beats: StoryBeat[];
  words: { en: string; tr: string; emoji: string }[];
  phrases: Phrase[];
}

export const episodes: Episode[] = [
  {
    id: "kafe",
    title: "Kafede Bir Sabah",
    emoji: "☕",
    desc: "Lina ve Mert mahalle kafesinde buluşuyor. Sipariş vermeyi ve kibar rica cümlelerini öğren.",
    tagline: "Bir latte, iki arkadaş, bol kahkaha.",
    hue: 28,
    level: "A1",
    minutes: "4 dk",
    xp: 40,
    phrases: [
      { en: "I'd like a latte, please.", tr: "Bir latte alabilir miyim, lütfen.", note: "Siparişin en kibar yolu" },
      { en: "What can I get for you?", tr: "Ne alırsınız?", note: "Garsonların klasik açılışı" },
      { en: "The coffee is on me.", tr: "Kahve benden.", note: "İkram etmenin cool hali" },
    ],
    cast: [
      { name: "Lina", hue: 340, emoji: "👩‍🦰" },
      { name: "Mert", hue: 210, emoji: "🧑‍🦱" },
      { name: "Barista", hue: 30, emoji: "🧑‍🍳" },
    ],
    beats: [
      { kind: "line", who: 0, scene: "SAHNE 1 · KÖŞE KAFE ☕ — SABAH 08:15", text: "Good morning, Mert! I'm so sleepy today...", hint: "Günaydın Mert! Bugün çok uykuluyum..." },
      { kind: "line", who: 1, text: "Morning Lina! Let's get some coffee first. ☕", hint: "Günaydın Lina! Önce biraz kahve alalım." },
      { kind: "line", who: 2, text: "Hello! Welcome to Corner Café. What can I get for you?", hint: "Merhaba! Corner Café'ye hoş geldiniz. Ne alırsınız?" },
      {
        kind: "choice",
        prompt: "Lina kahvesini nasıl istesin? En kibar seçeneği bul!",
        options: [
          { text: "I'd like a latte, please.", reaction: "Great choice! The barista smiles: 'One latte, coming right up!'", best: true },
          { text: "Give me coffee. Now.", reaction: "The barista raises an eyebrow... Kibarlık puanı kaybettin! 😬" },
          { text: "Latte.", reaction: "'Sure...' diyor barista. İş görür ama 'please' sihirli bir kelime! ✨" },
        ],
      },
      { kind: "line", who: 2, text: "And for you, sir?", hint: "Peki ya siz, beyefendi?" },
      {
        kind: "choice",
        prompt: "Mert ne sipariş etsin?",
        options: [
          { text: "Can I have a black coffee, please?", reaction: "'Of course!' — Siyah kahve, sade ve net. ☕", best: true },
          { text: "I am a coffee.", reaction: "Barista gülüyor: 'Maalesef insan satmıyoruz!' 😄 'I am' yerine 'I want' dene." },
        ],
      },
      { kind: "quiz", question: "Barista 'What can I get for you?' diye sorduğunda ne demek istiyor?", options: ["Ne alırsınız?", "Kimsiniz?", "Nereye gidiyorsunuz?", "Saat kaç?"], answer: 0, explain: "'What can I get for you?' sipariş sorarken kullanılan klasik bir kalıp: 'Size ne getirebilirim / Ne alırsınız?'" },
      { kind: "line", who: 0, scene: "SAHNE 2 · KAHVELER MASADA ☕☕", text: "Thanks! By the way, did you finish the homework?", hint: "Teşekkürler! Bu arada, ödevi bitirdin mi?" },
      { kind: "line", who: 1, text: "Almost! I only have the reading left. It's about space travel.", hint: "Neredeyse! Sadece okumam kaldı. Uzay yolculuğu hakkında." },
      { kind: "quiz", question: "Mert'in ödevinde ne kaldı?", options: ["Yazma kısmı", "Okuma kısmı", "Sunum", "Hiçbir şey, bitirdi"], answer: 1, explain: "'I only have the reading left' → 'Sadece okuma kısmı kaldı' demek." },
      {
        kind: "choice",
        prompt: "Lina vedalaşırken ne desin?",
        options: [
          { text: "See you at class!", reaction: "'See you!' — Doğal ve akıcı bir veda. Lina artık gerçek bir İngilizce konuşucusu gibi! 🌟", best: true },
          { text: "I go now.", reaction: "Anlaşılır ama 'I have to go now' ya da 'See you!' daha doğal olur. 😉" },
        ],
      },
      { kind: "line", who: 1, text: "See you! And Lina... next time the coffee is on me. 😄", hint: "Görüşürüz! Ve Lina... bir dahaki sefere kahve benden." },
    ],
    words: [
      { en: "sleepy", tr: "uykulu", emoji: "🥱" },
      { en: "order", tr: "sipariş", emoji: "🧾" },
      { en: "please", tr: "lütfen", emoji: "🙏" },
      { en: "homework", tr: "ödev", emoji: "📝" },
      { en: "on me", tr: "benden (ikram)", emoji: "🎁" },
    ],
  },
  {
    id: "havaalani",
    title: "Havaalanında Kayıp Bavul",
    emoji: "✈️",
    desc: "Lina'nın bavulu kayboldu! Kayıp eşya ofisinde İngilizce yardım istemeyi öğren.",
    tagline: "Kayıp bir bavul, beklenmedik bir macera.",
    hue: 205,
    level: "A2",
    minutes: "5 dk",
    xp: 50,
    phrases: [
      { en: "Excuse me, I can't find my suitcase.", tr: "Afedersiniz, bavulumu bulamıyorum.", note: "Sorun bildirirken nazik giriş" },
      { en: "What does it look like?", tr: "Nasıl görünüyor?", note: "Tarif istemenin anahtarı" },
      { en: "Look on the bright side!", tr: "İyi tarafından bak!", note: "Tesellinin en neşeli hali" },
    ],
    cast: [
      { name: "Lina", hue: 340, emoji: "👩‍🦰" },
      { name: "Görevli", hue: 200, emoji: "👮‍♀️" },
      { name: "Mert", hue: 210, emoji: "🧑‍🦱" },
    ],
    beats: [
      { kind: "line", who: 0, scene: "SAHNE 1 · İSTANBUL HAVALİMANI ✈️ — BAGAJ BANDI", text: "Oh no... The belt is empty. My suitcase is not here!", hint: "Hayır... Bant boş. Bavulum burada değil!" },
      { kind: "line", who: 2, text: "Don't panic. Let's go to the lost and found office.", hint: "Panik yapma. Kayıp eşya ofisine gidelim." },
      { kind: "line", who: 1, text: "Good morning. How can I help you today?", hint: "Günaydın. Bugün size nasıl yardımcı olabilirim?" },
      {
        kind: "choice",
        prompt: "Lina durumu nasıl anlatsın?",
        options: [
          { text: "Excuse me, I can't find my suitcase.", reaction: "'I'm sorry to hear that. Let me check.' — Görevli sistemi kontrol etmeye başladı.", best: true },
          { text: "WHERE IS MY BAG?!?", reaction: "Görevli derin bir nefes alıyor... Sakin ve kibar cümleler her zaman daha hızlı sonuç verir. 😅" },
        ],
      },
      { kind: "line", who: 1, text: "Can you describe it? What does it look like?", hint: "Tanımlayabilir misiniz? Nasıl görünüyor?" },
      {
        kind: "choice",
        prompt: "Bavulu en iyi hangi cümle tarif eder?",
        options: [
          { text: "It's a big red suitcase with a blue tag.", reaction: "'Red suitcase, blue tag... Got it!' — Mükemmel bir tarif! 🎯", best: true },
          { text: "It is bag.", reaction: "Görevli gülümsüyor: 'Well... technically yes!' Biraz daha detay verelim. 😄" },
        ],
      },
      { kind: "quiz", question: "'What does it look like?' sorusu ne anlama geliyor?", options: ["Nasıl görünüyor?", "Ne zaman geldi?", "Kimin bavulu?", "Nereye gidiyor?"], answer: 0, explain: "'What does it look like?' bir şeyin görünüşünü / tarifini sormak için kullanılır." },
      { kind: "line", who: 1, scene: "SAHNE 2 · KAYIP EŞYA OFİSİ 🏢", text: "Good news! Your suitcase is in Paris. It arrives tomorrow at 9 AM.", hint: "İyi haber! Bavulunuz Paris'te. Yarın sabah 9'da geliyor." },
      { kind: "quiz", question: "Bavul nerede bulundu?", options: ["Lizbon'da", "Paris'te", "Londra'da", "Hâlâ kayıp"], answer: 1, explain: "Görevli 'Your suitcase is in Paris' dedi — bavul Paris'e uçmuş! ✈️" },
      { kind: "line", who: 0, text: "Thank you so much! You saved my holiday.", hint: "Çok teşekkür ederim! Tatilimi kurtardınız." },
      {
        kind: "choice",
        prompt: "Mert, Lina'yı nasıl neşelendirsin?",
        options: [
          { text: "Look on the bright side — free shopping today!", reaction: "Lina kahkaha atıyor: 'You're right! Let's go!' 🛍️ İyimserlik her zaman kazandırır.", best: true },
          { text: "This is very bad.", reaction: "Lina'nın morali daha da düşüyor... Teselli ederken 'bright side' bakış açısı altın kuraldır! 😉" },
        ],
      },
      { kind: "line", who: 0, text: "You're right! Paris fashion, here I come! 😄", hint: "Haklısın! Paris modası, geliyorum!" },
    ],
    words: [
      { en: "suitcase", tr: "bavul", emoji: "🧳" },
      { en: "lost and found", tr: "kayıp eşya", emoji: "🔍" },
      { en: "describe", tr: "tarif etmek", emoji: "🗣️" },
      { en: "arrive", tr: "varmak", emoji: "🛬" },
      { en: "bright side", tr: "iyi taraf", emoji: "🌞" },
    ],
  },
  {
    id: "pazar",
    title: "Gece Pazarı Macerası",
    emoji: "🏮",
    desc: "Lina ve Mert gece pazarında pazarlık yapmayı öğreniyor. Yakında!",
    tagline: "Fenerler, baharat kokuları ve sıkı bir pazarlık.",
    hue: 350,
    level: "A2",
    minutes: "5 dk",
    xp: 50,
    locked: true,
    cast: [],
    beats: [],
    words: [],
    phrases: [],
  },
];
