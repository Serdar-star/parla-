import Groq from "groq-sdk";

/** Her okumada taze — process.env runtime'da set edilmiş olabilir */
export function getGroqApiKey(): string {
  return (process.env.GROQ_API_KEY || "").trim();
}

/** Geriye uyumluluk */
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export const ANA_MODEL = "llama-3.3-70b-versatile";
export const HIZLI_MODEL = "llama-3.1-8b-instant";
export const GORSEL_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
/** Sunucu + tarayıcı model deneme sırası */
export const GROQ_MODEL_FALLBACKS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "gemma2-9b-it",
] as const;

let _client: Groq | null = null;
let _clientKey = "";

export function getGroqClient(): Groq {
  const key = getGroqApiKey();
  if (!key) {
    throw new Error("GROQ_API_KEY eksik — .env.local dosyasına ekle");
  }
  if (_client && _clientKey === key) return _client;
  _client = new Groq({ apiKey: key });
  _clientKey = key;
  return _client;
}

export function hasGroqKey(): boolean {
  return getGroqApiKey().length > 10;
}

export async function groqWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429") || msg.toLowerCase().includes("rate limit");
      if (is429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** Model listesini dener; ilki tutmazsa sıradakine geçer */
export async function groqChatCompletion(opts: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  models?: readonly string[];
  stream?: false;
}): Promise<{ content: string; model: string }> {
  const client = getGroqClient();
  const models = opts.models?.length ? opts.models : GROQ_MODEL_FALLBACKS;
  let lastErr: unknown;
  for (const model of models) {
    try {
      const completion = await groqWithRetry(() =>
        client.chat.completions.create({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.max_tokens ?? 800,
          stream: false,
        })
      );
      const content = completion.choices?.[0]?.message?.content?.trim() || "";
      if (content) return { content, model };
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("403") || msg.includes("Invalid API")) throw err;
      // 404 model / 400 → sıradaki model
      continue;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Groq tüm modellerde başarısız");
}

export const ROLEPLAY_CHARACTERS = {
  barista: {
    id: "barista",
    name: "Barista",
    emoji: "☕",
    scenario: "Kahve dükkanında sipariş",
    difficulty: 2,
    systemPrompt: "Sen bir kahvecide çalışan baristasın. Samimi ve enerjik konuş. Müşteriye kahve öneri yap. Kullanıcının öğrendiği dilde konuş, hataları nazikçe düzelt. Kısa ve doğal ol.",
  },
  garson: {
    id: "garson",
    name: "Garson",
    emoji: "🍽️",
    scenario: "Lüks restoranda menü ve sipariş",
    difficulty: 3,
    systemPrompt: "Sen lüks bir restoranda garsonluk yapıyorsun. Kibarca konuş. Menüyü anlat ve sipariş al. Kullanıcının öğrendiği dilde konuş.",
  },
  resepsiyonist: {
    id: "resepsiyonist",
    name: "Resepsiyonist",
    emoji: "🏨",
    scenario: "5 yıldızlı otelde check-in",
    difficulty: 2,
    systemPrompt: "Sen 5 yıldızlı bir otelin resepsiyonistsin. Profesyonel ve yardımsever ol. Kullanıcının öğrendiği dilde konuş.",
  },
  taksi: {
    id: "taksi",
    name: "Taksi Şoförü",
    emoji: "🚕",
    scenario: "Şehirde taksi yolculuğu",
    difficulty: 1,
    systemPrompt: "Sen tecrübeli bir taksi şoförüsün. Arkadaşça konuş. Şehri iyi biliyorsun. Kullanıcının öğrendiği dilde konuş.",
  },
  doktor: {
    id: "doktor",
    name: "Doktor",
    emoji: "👨‍⚕️",
    scenario: "Aile doktorunda muayene",
    difficulty: 3,
    systemPrompt: "Sen bir aile doktorusun. Sabırlı ve anlayışlı ol. Belirtileri sor ve tavsiye ver. Kullanıcının öğrendiği dilde konuş.",
  },
  kasiyer: {
    id: "kasiyer",
    name: "Kasiyer",
    emoji: "🛒",
    scenario: "Süpermarkette ödeme",
    difficulty: 1,
    systemPrompt: "Sen süpermarkette kasiyersin. Hızlı ve kibar konuş. Kullanıcının öğrendiği dilde konuş.",
  },
  mulakatci: {
    id: "mulakatci",
    name: "Mülakatçı",
    emoji: "💼",
    scenario: "İş görüşmesi",
    difficulty: 4,
    systemPrompt: "Sen bir şirketin İK müdürüsün. Profesyonel sor ve değerlendir. Kullanıcının öğrendiği dilde konuş, kariyer odaklı.",
  },
  biletci: {
    id: "biletci",
    name: "Biletçi",
    emoji: "🎭",
    scenario: "Tiyatro gişesinde bilet alma",
    difficulty: 2,
    systemPrompt: "Sen tiyatro gişesinde çalışıyorsun. Seçenekleri açıkla. Kullanıcının öğrendiği dilde konuş.",
  },
  musteri_hizmetleri: {
    id: "musteri_hizmetleri",
    name: "Müşteri Hizmetleri",
    emoji: "📞",
    scenario: "Telefon şirketinde şikayet çözme",
    difficulty: 3,
    systemPrompt: "Sen bir telefon şirketinde çalışıyorsun. Şikayetleri çöz. Sabırlı ve çözüm odaklı ol. Kullanıcının öğrendiği dilde konuş.",
  },
  arkadas: {
    id: "arkadas",
    name: "Arkadaş",
    emoji: "😊",
    scenario: "Yakın arkadaşla samimi sohbet",
    difficulty: 1,
    systemPrompt: "Sen kullanıcının yakın arkadaşısın. Samimi ve eğlenceli konuş. Günlük dil kullan. Kullanıcının öğrendiği dilde konuş.",
  },
} as const;

export type RoleplayCharacterId = keyof typeof ROLEPLAY_CHARACTERS;

export function getRoleplayPrompt(charId: string): string {
  const c = ROLEPLAY_CHARACTERS[charId as RoleplayCharacterId];
  return c ? c.systemPrompt : ROLEPLAY_CHARACTERS.arkadas.systemPrompt;
}

// In-memory rate limit counter (simple)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT = 20;

export function checkDailyLimit(userId: number, isPremium: boolean): { allowed: boolean; remaining: number } {
  if (isPremium) return { allowed: true, remaining: 999 };
  const key = `ai:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}


export function buildTeacherSystemPrompt(targetLang: string, level: string): string {
  return `Sen bir dil öğretmenisin. Kullanıcının öğrendiği dil: ${targetLang}. Kullanıcının anadili: Türkçe. Kullanıcının seviyesi: ${level}. Hataları nazikçe düzelt ve nedenini açıkla. Her mesajın sonunda soru sor. Motive edici ol. Kısa ve samimi ol (2-4 cümle). Türkçe ve ${targetLang} dillerini harmanlayabilirsin.`;
}
