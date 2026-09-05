/**
 * Yerel AI motoru — sandbox/offline ortamda Groq erişilemediğinde devreye girer.
 * Gerçek Groq anahtarı + ağ olduğunda API route'lar Groq'u tercih eder.
 */

export function localTeacherReply(message: string, mode: string): string {
  const t = message.toLowerCase().trim();
  const original = message.trim();

  // Corrections first
  const correction = detectCorrection(original);

  if (mode === "ceviri" || mode === "çeviri") {
    return localTranslateTeacher(original, correction);
  }
  if (mode === "gramer") {
    return localGrammar(t, original, correction);
  }
  if (mode === "kelime") {
    return localVocab(t, original);
  }

  // Free chat
  if (/(hi|hello|hey|merhaba|selam|günaydın|iyi akşam)/.test(t)) {
    return "Hello hello! 😊 Enerjin harika. Bugün ne yapmak istersin — gramer, kelime, çeviri, yoksa serbest sohbet? İngilizce bir cümle yaz, birlikte cilalayalım!";
  }
  if (/(teşekkür|thanks|thank you|sağol)/.test(t)) {
    return "You're very welcome! 🌟 'Thanks' günlük, 'thank you' nazik, 'I appreciate it' kalpleri eritir. Üçünü de bugün bir yerde kullan, söz mü?";
  }
  if (/(how are you|nasılsın|naber)/.test(t)) {
    return "I'm great, thanks for asking! 💚 Sen nasılsın? İngilizce cevapla dene: “I'm fine, a bit tired but motivated.” Senin cümlen?";
  }
  if (/(perfect|present perfect|geçmiş|past simple|tense|zaman)/.test(t)) {
    return "Present Perfect: geçmişte olmuş ama etkisi hâlâ süren olaylar. 'I have lost my keys' → anahtarlar hâlâ kayıp. Zamanı belliyse Past Simple: 'I lost my keys yesterday.' Bir örnek cümle kur, kontrol edeyim! 📐";
  }
  if (/(for|since)/.test(t)) {
    return "Altın kural: 'for' + süre (for 3 years), 'since' + başlangıç (since 2021). Cümleye 'dır/dir' ekleyebiliyorsan genelde Present Perfect + for/since! Örnek kur bakalım 🎯";
  }
  if (/(make|do)/.test(t) && /(fark|difference|nedir|ne)/.test(t)) {
    return "Kısa reçete: 'make' = üret/yarat (make a cake, make a decision). 'do' = iş/görev (do homework, do exercise). Hangisiyle bir cümle kurarsın?";
  }
  if (/(weekend|hafta sonu|tatil|holiday)/.test(t)) {
    return correction
      ? `${correction}\n\nHafta sonu kulağa güzel geldi! ☕ En sevdiğin kısmını tek İngilizce cümlede anlat: “On Saturday I …”`
      : "Hafta sonu kulağa harika geliyor! ☕ Detayı sevdim. En sevdiğin kısmını tek İngilizce cümlede anlat — 'On Saturday I …' ile başla!";
  }
  if (/(yorgun|tired|bored|sıkıld|üzgün|sad|mutlu|happy)/.test(t)) {
    return "Duygularını İngilizce zenginleştir: tired → worn out / drained; happy → thrilled / glad; sad → down / upset. Bugünkü ruh hâlin hangisi? Bir cümle kur!";
  }
  if (correction) {
    return `${correction}\n\nDevam edelim 🚀 Aynı fikri bir sıfat + bir duygu ile yeniden yaz. Örnek: “It was exciting and I felt proud.” Sıra sende!`;
  }

  const followUps = [
    `“${clip(original)}” — güzel başlangıç! 🚀 Bunu bir sıfat ve duygu ile zenginleştir: “It was exciting and I felt proud.” Senin versiyonun?`,
    `Interesting! 🤔 Şimdi 'because' ile sebep ekle: “… because it makes me feel free.” Sebep cümleleri konuşmanı olgunlaştırır!`,
    `Nice! 👏 Küçük meydan okuma: aynı fikri 'used to' ile anlat — geçmiş alışkanlıklar için altın kalıp. Örnek: “I used to …”`,
    `Beğendim! 🌟 Şimdi soru formuna çevir: “Did you…?” / “Have you ever…?” Senin sorun ne olsun?`,
  ];
  return followUps[hash(original) % followUps.length];
}

export function localRoleplayReply(character: string, message: string, isStart: boolean): string {
  const openers: Record<string, string> = {
    barista: "Hello! Welcome to Corner Café ☕ What can I get for you today — latte, cappuccino, or something sweet?",
    garson: "Good evening! Here's the menu 🍽️ Can I start you off with a drink, or would you like to hear tonight's specials?",
    resepsiyonist: "Good afternoon and welcome to Grand Hotel 🏨 Do you have a reservation with us?",
    taksi: "Hey there! Hop in 🚕 Where are we headed today?",
    doktor: "Hello, please take a seat 👨‍⚕️ What brings you in today? Tell me your symptoms.",
    kasiyer: "Hi! Did you find everything okay? 🛒 Cash or card?",
    mulakatci: "Good afternoon, thanks for coming in 💼 Tell me a little about yourself and why you applied.",
    biletci: "Hello! Looking for tickets tonight? 🎭 We have stalls, balcony, and last-minute seats.",
    musteri_hizmetleri: "Thank you for calling support 📞 How can I help you today?",
    arkadas: "Heyyy! 😊 Long time no chat — what's new with you?",
  };
  if (isStart) return openers[character] || openers.arkadas;

  const t = message.toLowerCase();
  const replies: Record<string, string[]> = {
    barista: [
      "Great choice! Hot or iced? And any milk preference — oat, almond, regular?",
      "Perfect. Anything to eat? Our croissants just came out of the oven 🥐",
      "That'll be $6.50. By the way, your English is really good! Where did you learn?",
    ],
    garson: [
      "Excellent. How would you like that cooked — rare, medium, or well-done?",
      "Would you like to see the dessert menu? Our tiramisu is famous 😄",
      "Of course. I'll bring water right away. Sparkling or still?",
    ],
    resepsiyonist: [
      "Wonderful. May I see your ID and a card for incidentals?",
      "You're on the 5th floor, room 512. Breakfast is 7–10 AM. Need a wake-up call?",
      "Wi-Fi password is on the key card. Enjoy your stay!",
    ],
    taksi: [
      "Got it — about 20 minutes with this traffic. First time in the city?",
      "I know a shortcut. Want music, or quiet ride?",
      "We're here! Card machine works, or cash is fine.",
    ],
    doktor: [
      "I see. How long have you had these symptoms?",
      "Any allergies or medications I should know about?",
      "Rest, drink fluids, and if it gets worse call us. Any other questions?",
    ],
    kasiyer: [
      "That comes to $24.90. Would you like a bag?",
      "Card declined once — want to try again or another card?",
      "Here's your receipt. Have a nice day!",
    ],
    mulakatci: [
      "Interesting background. What's your greatest strength? Give a short example.",
      "Tell me about a challenge you faced and how you solved it.",
      "Where do you see yourself in five years?",
    ],
    biletci: [
      "Front row is sold out, but row C has two great seats. Interested?",
      "Student discount is 20% with ID. Show starts at 8 PM.",
      "Here are your tickets. Enjoy the show!",
    ],
    musteri_hizmetleri: [
      "I'm sorry about that. Can I have your account number or phone number?",
      "I've reset the line. Please restart your router and test again.",
      "Done — you should be back online in 5 minutes. Anything else?",
    ],
    arkadas: [
      "No way! Tell me everything 😂 When did that happen?",
      "We should hang out this weekend. Coffee or a movie?",
      "Haha classic you. Text me later, okay?",
    ],
  };
  const pool = replies[character] || replies.arkadas;
  if (/(thank|teşekkür|bye|görüş)/.test(t)) return pool[pool.length - 1];
  return pool[hash(message) % pool.length];
}

export function localTranslate(text: string, style: "resmi" | "gunluk" | "argo" = "gunluk") {
  const map: Record<string, { resmi: string; gunluk: string; argo: string }> = {
    "merhaba": { resmi: "Good day", gunluk: "Hello", argo: "Hey" },
    "merhaba dünya": { resmi: "Greetings, world", gunluk: "Hello world", argo: "Yo world" },
    "teşekkürler": { resmi: "Thank you very much", gunluk: "Thanks", argo: "Cheers / ta" },
    "nasılsın": { resmi: "How do you do?", gunluk: "How are you?", argo: "What's up?" },
    "günaydın": { resmi: "Good morning", gunluk: "Morning!", argo: "Mornin'" },
    "iyi geceler": { resmi: "Good night", gunluk: "Night!", argo: "Sleep tight" },
    "lütfen": { resmi: "Please", gunluk: "Please", argo: "Pleeease" },
    "özür dilerim": { resmi: "I apologize", gunluk: "Sorry", argo: "My bad" },
    "ne haber": { resmi: "How have you been?", gunluk: "What's up?", argo: "Sup?" },
    "görüşürüz": { resmi: "I look forward to seeing you", gunluk: "See you", argo: "Catch you later" },
  };
  const key = text.toLowerCase().trim();
  if (map[key]) {
    const m = map[key];
    return {
      main: m[style],
      alternatives: [m.resmi, m.gunluk, m.argo].filter((x, i, a) => a.indexOf(x) === i && x !== m[style]),
      idiom: null as string | null,
      note: `Stil: ${style}`,
    };
  }

  // Heuristic TR → EN patterns
  let main = text;
  const patterns: [RegExp, string][] = [
    [/^ben (.+) istiyorum$/i, "I want $1"],
    [/^ben (.+) seviyorum$/i, "I love $1"],
    [/^bu bir (.+)$/i, "This is a $1"],
    [/^nerede\?$/i, "Where is it?"],
    [/^ne kadar\?$/i, "How much is it?"],
    [/^yardım eder misin\?$/i, "Could you help me?"],
    [/^anlamadım$/i, "I don't understand"],
    [/^tekrar eder misin\?$/i, "Could you repeat that?"],
  ];
  for (const [re, repl] of patterns) {
    if (re.test(key)) {
      main = key.replace(re, repl);
      break;
    }
  }
  if (main === text && /[çğıöşüÇĞİÖŞÜ]/.test(text)) {
    main = `[EN] ${text}`;
  }
  return {
    main: style === "resmi" ? formalize(main) : style === "argo" ? casualize(main) : main,
    alternatives: [formalize(main), casualize(main)].filter((x) => x !== main),
    idiom: null as string | null,
    note: "Yerel çeviri motoru (Groq ağı yokken). Dışarıda gerçek Groq devreye girer.",
  };
}

export function localCorrect(text: string) {
  const errors: { error: string; correction: string; explanation: string }[] = [];
  let corrected = text;

  const rules: [RegExp, string, string, string][] = [
    [/\bi am agree\b/gi, "I agree", "I am agree", "agree zaten fiil; 'am' almaz"],
    [/\bi have went\b/gi, "I have gone", "I have went", "Present Perfect'te go → gone"],
    [/\bmore better\b/gi, "better", "more better", "better zaten karşılaştırma"],
    [/\bi go (.+) yesterday\b/gi, "I went $1 yesterday", "I go … yesterday", "yesterday → Past Simple (went)"],
    [/\bshe go\b/gi, "she goes", "she go", "3. tekil şahıs -s alır"],
    [/\bhe go\b/gi, "he goes", "he go", "3. tekil şahıs -s alır"],
    [/\bi didn't went\b/gi, "I didn't go", "I didn't went", "didn't sonrası fiil yalın hali"],
    [/\bcan to\b/gi, "can", "can to", "modal + yalın fiil, 'to' yok"],
    [/\bmust to\b/gi, "must", "must to", "must + yalın fiil"],
    [/\bin the monday\b/gi, "on Monday", "in the monday", "günlerle on kullanılır"],
    [/\bi am study\b/gi, "I am studying", "I am study", "şimdiki zaman: be + -ing"],
    [/\bthere is many\b/gi, "there are many", "there is many", "çoğul → there are"],
  ];

  for (const [re, repl, err, exp] of rules) {
    if (re.test(corrected)) {
      errors.push({ error: err, correction: repl.includes("$") ? corrected.replace(re, repl) : repl, explanation: exp });
      corrected = corrected.replace(re, repl);
    }
  }

  if (errors.length === 0) {
    return {
      original: text,
      corrected: text,
      errors: [],
      alternative: text,
      note: "Belirgin gramer hatası bulamadım — cümle temiz görünüyor! ✨",
    };
  }

  return {
    original: text,
    corrected,
    errors,
    alternative: corrected,
  };
}

export function localVisionFallback() {
  return {
    object: "Bardak",
    objectEn: "Cup",
    pronunciation: "/kʌp/",
    description: "Görüntü analizi (yerel yedek). Groq vision ağa bağlanınca gerçek nesne tanıma devreye girer.",
    examples: ["This is a cup.", "I drink coffee from this cup.", "The cup is on the table."],
  };
}

export function localRoleplayReport() {
  return {
    score: 78,
    grammar: 72,
    vocabulary: 80,
    communication: 82,
    mistakes: [
      "I am agree → I agree (agree fiil, am almaz)",
      "I go yesterday → I went yesterday (geçmiş zaman)",
      "more better → better (çift karşılaştırma olmaz)",
    ],
    suggestions: [
      "Could you…? / I'd like… kalıplarını ezberle",
      "Düzensiz fiilleri (go-went-gone) her gün 5 tane tekrarla",
      "Roleplay'i günde 5 dakika yap, akıcılık artar",
    ],
  };
}

function detectCorrection(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("i am agree")) return "Mini düzeltme: “I am agree” → “I agree” (agree zaten fiil 😉)";
  if (t.includes("i have went")) return "Mini düzeltme: “I have went” → “I have gone”";
  if (t.includes("more better")) return "Mini düzeltme: “more better” → “better”";
  if (/\bi go .+ yesterday/.test(t)) return "Mini düzeltme: yesterday varsa Past Simple → “I went …”";
  if (/\bshe go\b/.test(t)) return "Mini düzeltme: “she go” → “she goes”";
  return null;
}

function localTranslateTeacher(original: string, correction: string | null) {
  const tr = localTranslate(original, "gunluk");
  return `Harika cümle! 🖋️ Doğal çeviri: “${tr.main}”${tr.alternatives[0] ? ` · Alternatif: “${tr.alternatives[0]}”` : ""}${correction ? `\n${correction}` : ""}\nŞimdi aynı kalıpla kendi cümleni kur!`;
}

function localGrammar(t: string, original: string, correction: string | null) {
  if (correction) return `${correction}\n\nŞimdi düzeltilmiş haliyle yeni bir cümle yaz, birlikte pekiştirelim 📐`;
  if (/(perfect|present perfect)/.test(t)) {
    return "Present Perfect altın kuralı: geçmişte olmuş ama etkisi ŞİMDİ süren olaylar. 'I have lost my keys' → hâlâ kayıp. Zamanı belliyse Past Simple. Bir örnek kur!";
  }
  if (/(past|geçmiş|yesterday|ago)/.test(t)) {
    return "Past Simple = bitmiş, zamanı belli iş. Sihirli kelimeler: yesterday, last week, ago. Düzensizler: go→went, see→saw, take→took. Bir cümle dene!";
  }
  if (/(article|a\/the|the |a )/.test(t)) {
    return "a/an = belirsiz (bir …), the = bilinen/özel. 'I saw a cat. The cat was black.' Hangisi karışıyor — örnek yaz, bakalım.";
  }
  if (/(preposition|edat|in on at)/.test(t)) {
    return "Kısa harita: in (ay/yıl/şehir), on (gün/tarih), at (saat/nokta). 'in July · on Monday · at 7pm'. Bir cümle kur!";
  }
  return `Gramer kliniği dinlemede! 🩺 “${clip(original)}” için: tense mi, edat mı, article mı zorluyor? Seç, derine inelim.`;
}

function localVocab(t: string, original: string) {
  if (/(journey|trip)/.test(t)) {
    return "İnce fark: 'trip' kısa gid-dön (business trip), 'journey' uzun/dönüşümsel (life journey). 'The journey to fluency takes small steps.' journey ile bir cümle kur!";
  }
  if (/(yeni|öğret|kelime|word)/.test(t)) {
    return "Yeni kelime: layover /ˈleɪ.oʊ.vər/ = aktarma bekleme. 'We had a 3-hour layover in Istanbul.' Bir cümle kur da mühürleyelim ✈️";
  }
  return `Kelime fabrikası açık 🏭 “${clip(original)}” için bugünün seti: departure (kalkış), arrival (varış), customs (gümrük). Hangisini cümlede kullanmak istersin?`;
}

function formalize(s: string) {
  return s.replace(/\bhey\b/gi, "Hello").replace(/\bthanks\b/gi, "Thank you").replace(/\byo\b/gi, "Greetings");
}
function casualize(s: string) {
  return s.replace(/\bHello\b/g, "Hey").replace(/\bThank you\b/gi, "Thanks");
}
function clip(s: string, n = 48) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Groq erişimini hızlıca dener; başarısızsa false. */
export async function probeGroq(timeoutMs = 4000): Promise<boolean> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok || res.status === 401 || res.status === 403; // reachable even if auth issue
  } catch {
    return false;
  }
}
