/**
 * AI zinciri:
 * 1) Tarayıcı Groq (direkt + CORS proxy)
 * 2) Sunucu /api/ai/chat (PC/Vercel'de gerçek Groq)
 * 3) Hata fırlat → sayfa yedek gösterir + uyarı
 */

"use client";

import {
  buildChatMessages,
  groqBrowserChat,
  loadGroqBridge,
  pingGroqBrowser,
  clearGroqCooldown,
  getLastGroqBrowserError,
  type BridgeConfig,
  type ChatMessage,
} from "@/lib/groq-browser";
import { onWebLlmStatus, type WebLlmStatus } from "@/lib/webllm-engine";
import { postJson } from "@/lib/api";

export type AiProvider = "groq" | "webllm" | "server" | "local" | "checking";

export type AiChatResult = {
  reply: string;
  provider: AiProvider;
  warning?: string;
};

let bridgeCache: BridgeConfig | null = null;
let preferred: AiProvider = "checking";
let lastWarning = "";

export function getAiWarning() {
  return lastWarning;
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

export async function initAiProviders(
  onStatus?: (p: AiProvider, detail?: string) => void
): Promise<AiProvider> {
  onStatus?.("checking", "Groq bağlanıyor…");
  clearGroqCooldown();
  lastWarning = "";

  try {
    const bridge = await withTimeout(loadGroqBridge(true), 6000, "bridge_timeout");
    bridgeCache = bridge;

    if (bridge.enabled && bridge.apiKey) {
      onStatus?.("checking", "Groq test…");
      const ok = await pingGroqBrowser(bridge);
      if (ok) {
        preferred = "groq";
        lastWarning = "";
        onStatus?.("groq", "Groq AI aktif ✓");
        return "groq";
      }
      // Key var ama tarayıcıdan çıkılamadı — sohbette sunucu denenecek
      lastWarning =
        "Bu tarayıcı/ortam Groq'a çıkamıyor (Arena sandbox). Kendi PC'nde npm run dev ile gerçek Groq açılır.";
      preferred = "checking";
      onStatus?.("local", lastWarning);
      return "local";
    }

    lastWarning = "GROQ_API_KEY yok — app/.env.local dosyasına ekle";
    onStatus?.("local", lastWarning);
  } catch (e) {
    lastWarning = e instanceof Error ? e.message : "init hata";
    onStatus?.("local", lastWarning);
  }

  preferred = "local";
  return "local";
}

export function subscribeWebLlm(fn: (s: WebLlmStatus) => void) {
  return onWebLlmStatus(fn);
}

async function tryBrowserGroq(messages: ChatMessage[], budgetMs = 16000): Promise<AiChatResult | null> {
  try {
    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await withTimeout(loadGroqBridge(), 5000, "bridge");
      bridgeCache = bridge;
    }
    if (!bridge.enabled || !bridge.apiKey) return null;

    const { reply } = await groqBrowserChat({
      bridge,
      messages,
      maxTokens: 700,
      budgetMs,
    });
    preferred = "groq";
    lastWarning = "";
    return { reply, provider: "groq" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    lastWarning = getLastGroqBrowserError() || msg;
    console.warn("Browser Groq:", msg);
    return null;
  }
}

async function tryServerChat(message: string, mode: string): Promise<AiChatResult | null> {
  try {
    const data = await withTimeout(
      postJson<{ reply: string; provider?: string; hint?: string; model?: string }>("/api/ai/chat", {
        message,
        mode,
      }),
      12000,
      "server_timeout"
    );
    if (!data.reply) return null;

    if (data.provider === "groq") {
      preferred = "groq";
      lastWarning = "";
      return { reply: data.reply, provider: "groq" };
    }

    // Server local = network blocked on server too
    const warning =
      data.hint ||
      lastWarning ||
      "Groq bu ortamda kapalı. Kendi bilgisayarında: cd app && npm run dev";
    lastWarning = warning;
    preferred = "local";
    return { reply: data.reply, provider: "local", warning };
  } catch (e) {
    console.warn("Server AI:", e);
    return null;
  }
}

export async function clientAiChat(opts: {
  message: string;
  mode: string;
  history: { role: "user" | "ai"; content: string }[];
  systemPrompt?: string;
}): Promise<AiChatResult> {
  const system =
    opts.systemPrompt ||
    bridgeCache?.systemPrompt ||
    "Sen sabırlı bir dil öğretmenisin. Kullanıcının anadili Türkçe, hedef dil İngilizce. Hataları nazikçe düzelt. Kısa ve samimi ol (2-4 cümle).";

  const messages: ChatMessage[] = buildChatMessages(system, opts.mode, opts.history, opts.message);

  // 1) Tarayıcı Groq
  const groq = await tryBrowserGroq(messages, 16000);
  if (groq) return groq;

  // 2) Sunucu (PC'de asıl çalışan yol)
  const server = await tryServerChat(opts.message, opts.mode);
  if (server) return server;

  throw new Error(lastWarning || "AI başarısız");
}

export async function clientRoleplayChat(opts: {
  characterName: string;
  scenario: string;
  action: "start" | "message";
  message?: string;
  history?: { role: "user" | "ai"; content: string }[];
  characterId: string;
}): Promise<AiChatResult> {
  const system =
    opts.action === "start"
      ? `Sen ${opts.characterName} karakterisin (${opts.scenario}). Kısa, doğal ilk mesajı İngilizce yaz. 2-3 cümle.`
      : `Sen ${opts.characterName} karakterisin (${opts.scenario}). Kısa ve doğal İngilizce konuş (2-3 cümle).`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];
  if (opts.history) {
    for (const h of opts.history.slice(-8)) {
      messages.push({ role: h.role === "user" ? "user" : "assistant", content: h.content });
    }
  }
  if (opts.action === "start" && messages.length === 1) {
    messages.push({ role: "user", content: "Start the conversation now." });
  }

  const groq = await tryBrowserGroq(messages, 14000);
  if (groq) return groq;

  try {
    const data = await withTimeout(
      postJson<{ reply: string; provider?: string }>("/api/ai/roleplay", {
        character: opts.characterId,
        action: opts.action,
        message: opts.message,
        history: (opts.history || []).map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        })),
      }),
      12000,
      "roleplay_server_timeout"
    );
    if (data.reply) {
      return {
        reply: data.reply,
        provider: data.provider === "groq" ? "groq" : "local",
        warning: data.provider === "groq" ? undefined : lastWarning || "Roleplay yedek mod",
      };
    }
  } catch (e) {
    console.warn("roleplay server:", e);
  }

  throw new Error("Roleplay AI başarısız");
}

export function getPreferredProvider(): AiProvider {
  return preferred;
}
