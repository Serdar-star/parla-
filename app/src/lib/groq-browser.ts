/**
 * Tarayıcıdan Groq — kısa timeout'lu, hızlı fail.
 * Takılı kalmasın diye her istek AbortController ile sınırlı.
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
const CACHE_MS = 60_000;

/** Bilinen çalışan base — bir kez bulununca tekrar dene */
let workingBase: string | null = null;
let groqDeadUntil = 0; // cooldown after hard fail

export async function loadGroqBridge(force = false): Promise<BridgeConfig> {
  if (!force && cachedBridge && Date.now() - cacheAt < CACHE_MS) return cachedBridge;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
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

function withTimeout<T>(p: Promise<T>, ms: number, label = "timeout"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
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
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 120)}`);
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
  if (base.includes("allorigins.win/raw?url=")) {
    const inner = decodeURIComponent(base.split("url=")[1] || "");
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(inner.replace(/\/$/, "") + "/chat/completions")}`;
  }
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

export async function groqBrowserChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bridge?: BridgeConfig;
  /** Toplam süre bütçesi (ms) — aşılırsa throw */
  budgetMs?: number;
}): Promise<{ reply: string; provider: string }> {
  if (Date.now() < groqDeadUntil) {
    throw new Error("Groq cooldown");
  }

  const bridge = opts.bridge ?? (await loadGroqBridge());
  if (!bridge.enabled || !bridge.apiKey) {
    throw new Error("Groq browser bridge kapalı");
  }

  const budget = opts.budgetMs ?? 4000;
  const started = Date.now();
  const left = () => Math.max(500, budget - (Date.now() - started));

  const direct = (bridge.baseURL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  // Önce bilinen çalışan base, sonra direkt — proxy'leri sona (yavaş)
  const bases = [...new Set([workingBase, direct].filter(Boolean))] as string[];

  // Sadece 1-2 hızlı model — uzun liste takılıyordu
  const models = [
    opts.model,
    bridge.fastModel || "llama-3.1-8b-instant",
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
            max_tokens: opts.maxTokens ?? 400,
            stream: false,
          },
          left()
        );
        workingBase = base;
        return { reply, provider: "groq-browser" };
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("401") || msg.includes("403")) {
          groqDeadUntil = Date.now() + 60_000;
          throw e;
        }
        continue;
      }
    }
  }

  // Kısa deneme bitti — 30 sn cooldown (UI donmasın)
  groqDeadUntil = Date.now() + 30_000;
  throw lastErr instanceof Error ? lastErr : new Error("Groq tarayıcı zaman aşımı");
}

/** Hızlı canlılık: tek model, 2.5 sn */
export async function pingGroqBrowser(bridge: BridgeConfig): Promise<boolean> {
  if (!bridge.enabled || !bridge.apiKey) return false;
  if (Date.now() < groqDeadUntil) return false;
  try {
    await withTimeout(
      groqBrowserChat({
        bridge,
        messages: [
          { role: "system", content: "Reply with exactly: OK" },
          { role: "user", content: "ping" },
        ],
        model: bridge.fastModel || "llama-3.1-8b-instant",
        maxTokens: 4,
        temperature: 0,
        budgetMs: 2500,
      }),
      2500,
      "ping_timeout"
    );
    return true;
  } catch {
    return false;
  }
}

const MODE_HINTS: Record<string, string> = {
  serbest: "Serbest sohbet: günlük konularda konuş, hataları nazikçe düzelt. Kısa ve samimi ol (2-4 cümle).",
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
