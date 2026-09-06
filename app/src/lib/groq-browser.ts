/**
 * Tarayıcı → Groq (kullanıcının ağı).
 * Kısa timeout'lu ama ÖNCELİKLİ — sunucu sandbox'ta Groq'a çıkamaz.
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

let workingBase: string | null = null;
/** Kısa cooldown — sadece art arda fail spam'ini keser */
let groqDeadUntil = 0;

export async function loadGroqBridge(force = false): Promise<BridgeConfig> {
  if (!force && cachedBridge && Date.now() - cacheAt < CACHE_MS) return cachedBridge;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
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
  } catch {
    cachedBridge = { enabled: false, reason: "fetch_failed" };
    cacheAt = Date.now();
    return cachedBridge;
  }
}

export function clearGroqCooldown() {
  groqDeadUntil = 0;
}

async function postChatOnce(
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
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 160)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) throw new Error("empty");
    return reply;
  } finally {
    clearTimeout(t);
  }
}

function chatUrl(base: string): string {
  if (base.includes("corsproxy.io/?")) {
    const inner = decodeURIComponent(base.split("corsproxy.io/?")[1] || "");
    return `https://corsproxy.io/?${encodeURIComponent(inner.replace(/\/$/, "") + "/chat/completions")}`;
  }
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

function candidateBases(preferred?: string): string[] {
  const direct = (preferred || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  return [...new Set([workingBase, direct, `https://corsproxy.io/?${encodeURIComponent(direct)}`].filter(Boolean))] as string[];
}

export async function groqBrowserChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bridge?: BridgeConfig;
  budgetMs?: number;
}): Promise<{ reply: string; provider: string; model?: string }> {
  // Auth fail cooldown only — network fail'de her mesajda tekrar dene
  if (Date.now() < groqDeadUntil) {
    throw new Error("Groq auth cooldown");
  }

  const bridge = opts.bridge ?? (await loadGroqBridge());
  if (!bridge.enabled || !bridge.apiKey) {
    throw new Error("Groq browser bridge kapalı");
  }

  const budget = opts.budgetMs ?? 12000;
  const started = Date.now();
  const left = () => Math.max(1500, budget - (Date.now() - started));

  const bases = candidateBases(bridge.baseURL);
  // Hızlı model önce — gerçek Llama cevabı
  const models = [
    opts.model,
    bridge.fastModel || "llama-3.1-8b-instant",
    "llama-3.1-8b-instant",
    bridge.model || "llama-3.3-70b-versatile",
  ].filter(Boolean) as string[];
  const uniqueModels = [...new Set(models)].slice(0, 2);

  let lastErr: unknown;

  for (const base of bases) {
    for (const model of uniqueModels) {
      if (Date.now() - started > budget) break;
      try {
        const reply = await postChatOnce(
          chatUrl(base),
          bridge.apiKey,
          {
            model,
            messages: opts.messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 600,
            stream: false,
          },
          left()
        );
        workingBase = base.startsWith("http") ? base : workingBase;
        // corsproxy success: remember the proxy base pattern
        if (base.includes("corsproxy")) workingBase = base;
        else workingBase = base;
        return { reply, provider: "groq-browser", model };
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("401") || msg.includes("403")) {
          groqDeadUntil = Date.now() + 120_000;
          throw e;
        }
        continue;
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Groq tarayıcı başarısız");
}

/** Canlılık — soft fail, uzun cooldown YOK */
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
      budgetMs: 8000,
    });
    return true;
  } catch {
    return false;
  }
}

const MODE_HINTS: Record<string, string> = {
  serbest: "Serbest sohbet: günlük konularda konuş, hataları nazikçe düzelt. Kısa ve samimi ol (2-4 cümle). Türkçe + İngilizce karışık yazabilirsin.",
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
