/**
 * Tarayıcı → Groq.
 * 1) Direkt api.groq.com (PC tarayıcısı / CORS açıksa)
 * 2) Birkaç CORS proxy (Authorization header ile POST)
 * Arena iframe bazen dış API'yi keser → o zaman PC/Vercel şart.
 */

export type BridgeConfig = {
  enabled: boolean;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  fastModel?: string;
  systemPrompt?: string;
  provider?: string;
  reason?: string;
  models?: string[];
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

let cachedBridge: BridgeConfig | null = null;
let cacheAt = 0;
const CACHE_MS = 120_000;

let workingUrlBuilder: ((path: string) => string) | null = null;
let lastError = "";
let authDeadUntil = 0;

export function getLastGroqBrowserError() {
  return lastError;
}

export function clearGroqCooldown() {
  authDeadUntil = 0;
  lastError = "";
}

export async function loadGroqBridge(force = false): Promise<BridgeConfig> {
  if (!force && cachedBridge && Date.now() - cacheAt < CACHE_MS) return cachedBridge;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch("/api/ai/bridge", { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      cachedBridge = { enabled: false, reason: `http_${res.status}` };
      cacheAt = Date.now();
      return cachedBridge;
    }
    const data = (await res.json()) as BridgeConfig;
    cachedBridge = data;
    cacheAt = Date.now();
    return data;
  } catch (e) {
    lastError = e instanceof Error ? e.message : "bridge_failed";
    cachedBridge = { enabled: false, reason: "fetch_failed" };
    cacheAt = Date.now();
    return cachedBridge;
  }
}

type UrlBuilder = (apiPath: string) => string;

function builders(baseURL?: string): UrlBuilder[] {
  const root = (baseURL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const full = (path: string) => `${root}${path.startsWith("/") ? path : `/${path}`}`;

  const list: UrlBuilder[] = [];

  // Önce bilinen çalışan yol
  if (workingUrlBuilder) list.push(workingUrlBuilder);

  // 1) Direkt Groq
  list.push((path) => full(path));

  // 2) corsproxy.io — header'ları iletir
  list.push((path) => `https://corsproxy.io/?${encodeURIComponent(full(path))}`);

  // 3) codetabs proxy
  list.push((path) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(full(path))}`);

  // 4) thingproxy
  list.push((path) => `https://thingproxy.freeboard.io/fetch/${full(path)}`);

  // unique by toString of first call
  const seen = new Set<string>();
  return list.filter((b) => {
    const sample = b("/chat/completions");
    if (seen.has(sample)) return false;
    seen.add(sample);
    return true;
  });
}

async function postJson(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 180)}`);
    }

    let data: { choices?: { message?: { content?: string } }[] };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`JSON değil: ${text.slice(0, 80)}`);
    }
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) throw new Error("boş cevap");
    return reply;
  } finally {
    clearTimeout(t);
  }
}

export async function groqBrowserChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bridge?: BridgeConfig;
  budgetMs?: number;
}): Promise<{ reply: string; provider: string; model?: string }> {
  if (Date.now() < authDeadUntil) {
    throw new Error(lastError || "Groq key reddedildi — yeni key al");
  }

  const bridge = opts.bridge ?? (await loadGroqBridge());
  if (!bridge.enabled || !bridge.apiKey) {
    throw new Error("Bridge kapalı veya key yok");
  }

  const budget = opts.budgetMs ?? 16000;
  const started = Date.now();
  const left = () => Math.max(2000, budget - (Date.now() - started));

  const models = [
    opts.model,
    bridge.fastModel || "llama-3.1-8b-instant",
    "llama-3.1-8b-instant",
    bridge.model || "llama-3.3-70b-versatile",
  ].filter(Boolean) as string[];
  const uniqueModels = [...new Set(models)].slice(0, 2);

  const urlBuilders = builders(bridge.baseURL);
  let lastErr: unknown;

  for (const build of urlBuilders) {
    for (const model of uniqueModels) {
      if (Date.now() - started > budget) break;
      const url = build("/chat/completions");
      try {
        const reply = await postJson(
          url,
          bridge.apiKey,
          {
            model,
            messages: opts.messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 700,
            stream: false,
          },
          left()
        );
        workingUrlBuilder = build;
        lastError = "";
        return { reply, provider: "groq-browser", model };
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        lastError = msg;
        if (msg.includes("401") || msg.includes("403") || msg.includes("Invalid API")) {
          authDeadUntil = Date.now() + 120_000;
          throw new Error(`Groq key geçersiz/yetkisiz: ${msg}`);
        }
        // CORS / network / proxy → sıradaki
        continue;
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(lastError || "Groq tarayıcı başarısız");
}

export async function pingGroqBrowser(bridge: BridgeConfig): Promise<boolean> {
  if (!bridge.enabled || !bridge.apiKey) return false;
  try {
    await groqBrowserChat({
      bridge,
      messages: [
        { role: "system", content: "Reply with exactly: OK" },
        { role: "user", content: "ping" },
      ],
      model: bridge.fastModel || "llama-3.1-8b-instant",
      maxTokens: 6,
      temperature: 0,
      budgetMs: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

const MODE_HINTS: Record<string, string> = {
  serbest:
    "Serbest sohbet: günlük konularda konuş, hataları nazikçe düzelt. Kısa ve samimi ol (2-4 cümle). Türkçe + İngilizce karışık yazabilirsin.",
  gramer: "Gramer modu: gramer sorularını basit ve net açıkla, örnek ver. Türkçe açıkla, örnek İngilizce olsun.",
  kelime: "Kelime modu: yeni kelimeler öğret, telaffuz ve örnek cümlelerle pekiştir.",
  ceviri: "Çeviri: Türkçe cümleleri doğal İngilizceye çevir, alternatifler sun ve açıkla.",
};

export function buildChatMessages(
  systemBase: string,
  mode: string,
  history: { role: "user" | "ai" | "assistant"; content: string }[],
  userMessage: string
): ChatMessage[] {
  const modeHint = MODE_HINTS[mode] || MODE_HINTS.serbest;
  const msgs: ChatMessage[] = [{ role: "system", content: `${systemBase}\n${modeHint}` }];
  for (const h of history.slice(-8)) {
    msgs.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    });
  }
  msgs.push({ role: "user", content: userMessage });
  return msgs;
}
