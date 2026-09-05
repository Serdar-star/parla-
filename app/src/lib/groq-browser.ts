/**
 * Tarayıcıdan doğrudan Groq çağrısı.
 * Sunucu sandbox TLS engeline takılsa bile kullanıcının ağı açıkken çalışır.
 * CORS engellenirse bilinen CORS proxy'leri dener.
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
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

let cachedBridge: BridgeConfig | null = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

/** Çalışan base URL (doğrudan veya proxy) — bir kez bulununca cache'lenir */
let workingBase: string | null = null;

export async function loadGroqBridge(force = false): Promise<BridgeConfig> {
  if (!force && cachedBridge && Date.now() - cacheAt < CACHE_MS) return cachedBridge;
  try {
    const res = await fetch("/api/ai/bridge", { cache: "no-store" });
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

function candidateBases(preferred?: string): string[] {
  const direct = (preferred || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const list = [
    workingBase,
    direct,
    // CORS proxy fallbacks (tarayıcı ağı üzerinden)
    `https://corsproxy.io/?${encodeURIComponent(direct)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`,
  ].filter(Boolean) as string[];
  return [...new Set(list)];
}

async function postChat(
  base: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<Response> {
  // corsproxy.io: URL'nin sonuna path eklenir farklı; allorigins raw da benzer.
  // En temiz yol: base zaten full openai/v1 ise /chat/completions ekle.
  let url: string;
  if (base.includes("corsproxy.io/?")) {
    // corsproxy.io/?https://api.groq.com/openai/v1  → append /chat/completions to inner
    const inner = decodeURIComponent(base.split("corsproxy.io/?")[1] || "");
    url = `https://corsproxy.io/?${encodeURIComponent(inner.replace(/\/$/, "") + "/chat/completions")}`;
  } else if (base.includes("allorigins.win/raw?url=")) {
    const inner = decodeURIComponent(base.split("url=")[1] || "");
    url = `https://api.allorigins.win/raw?url=${encodeURIComponent(inner.replace(/\/$/, "") + "/chat/completions")}`;
  } else {
    url = `${base.replace(/\/$/, "")}/chat/completions`;
  }

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function groqBrowserChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bridge?: BridgeConfig;
}): Promise<{ reply: string; provider: string }> {
  const bridge = opts.bridge ?? (await loadGroqBridge());
  if (!bridge.enabled || !bridge.apiKey) {
    throw new Error("Groq browser bridge kapalı");
  }

  const models = [
    opts.model,
    bridge.model,
    bridge.fastModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
    "gemma2-9b-it",
  ].filter(Boolean) as string[];
  const uniqueModels = [...new Set(models)];

  const bases = candidateBases(bridge.baseURL);
  let lastErr: unknown;

  for (const base of bases) {
    for (const model of uniqueModels) {
      try {
        const res = await postChat(base, bridge.apiKey, {
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 800,
          stream: false,
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          lastErr = new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
          if (res.status === 401 || res.status === 403) throw lastErr;
          // 404 model → sıradaki model
          continue;
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content?.trim() || "";
        if (!reply) {
          lastErr = new Error("Groq boş cevap");
          continue;
        }
        workingBase = base;
        return { reply, provider: "groq-browser" };
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("401") || msg.includes("403")) throw e;
        continue;
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Groq tarayıcı çağrısı başarısız");
}
export async function groqBrowserChatStream(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bridge?: BridgeConfig;
  onDelta: (text: string) => void;
}): Promise<{ reply: string; provider: string }> {
  // Stream CORS proxy'lerde sorunlu olabilir — non-stream'e düş
  try {
    const bridge = opts.bridge ?? (await loadGroqBridge());
    if (!bridge.enabled || !bridge.apiKey) throw new Error("bridge kapalı");

    const base = workingBase || (bridge.baseURL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    // Sadece doğrudan groq için stream dene
    if (base.includes("api.groq.com") && !base.includes("proxy") && !base.includes("allorigins")) {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bridge.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: opts.model || bridge.model || "meta-llama/llama-3.1-8b-instant",
          messages: opts.messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 800,
          stream: true,
        }),
      });
      if (!res.ok) throw new Error(`stream ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no reader");
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
            const delta = json.choices?.[0]?.delta?.content || "";
            if (delta) {
              full += delta;
              opts.onDelta(delta);
            }
          } catch {
            /* ignore */
          }
        }
      }
      if (full.trim()) return { reply: full.trim(), provider: "groq-browser" };
    }
  } catch {
    /* fall through to non-stream */
  }

  const result = await groqBrowserChat(opts);
  opts.onDelta(result.reply);
  return result;
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
  for (const h of history.slice(-10)) {
    msgs.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    });
  }
  msgs.push({ role: "user", content: userMessage });
  return msgs;
}
