/**
 * AI zinciri — GROQ ÖNCE (tarayıcı), sonra sunucu yedek.
 * Sandbox sunucusu Groq'a çıkamaz; kullanıcının tarayıcısı çıkabilir.
 */

"use client";

import {
  buildChatMessages,
  groqBrowserChat,
  loadGroqBridge,
  pingGroqBrowser,
  clearGroqCooldown,
  type BridgeConfig,
  type ChatMessage,
} from "@/lib/groq-browser";
import { onWebLlmStatus, type WebLlmStatus } from "@/lib/webllm-engine";
import { postJson } from "@/lib/api";

export type AiProvider = "groq" | "webllm" | "server" | "local" | "checking";

export type AiChatResult = {
  reply: string;
  provider: AiProvider;
};

let bridgeCache: BridgeConfig | null = null;
let preferred: AiProvider = "checking";

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

  try {
    const bridge = await withTimeout(loadGroqBridge(true), 5000, "bridge_timeout");
    bridgeCache = bridge;

    if (bridge.enabled && bridge.apiKey) {
      // Key var → badge "Groq deneniyor"; ping opsiyonel
      onStatus?.("checking", "Groq test ediliyor…");
      const ok = await pingGroqBrowser(bridge);
      if (ok) {
        preferred = "groq";
        onStatus?.("groq", "Groq AI aktif");
        return "groq";
      }
      // Ping fail olsa bile sohbet'te tekrar denenecek (CORS bazen ilk istekte uyanır)
      preferred = "groq"; // optimistic — chat path tries groq first
      onStatus?.("groq", "Groq hazır (tarayıcı)");
      return "groq";
    }
  } catch (e) {
    console.warn("AI init:", e);
  }

  preferred = "local";
  onStatus?.("local", "Yedek motor");
  return "local";
}

export function subscribeWebLlm(fn: (s: WebLlmStatus) => void) {
  return onWebLlmStatus(fn);
}

async function tryBrowserGroq(
  messages: ChatMessage[],
  budgetMs = 14000
): Promise<AiChatResult | null> {
  try {
    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await withTimeout(loadGroqBridge(), 4000, "bridge");
      bridgeCache = bridge;
    }
    if (!bridge.enabled || !bridge.apiKey) return null;

    const { reply } = await groqBrowserChat({
      bridge,
      messages,
      maxTokens: 600,
      budgetMs,
    });
    preferred = "groq";
    return { reply, provider: "groq" };
  } catch (e) {
    console.warn("Browser Groq:", e);
    return null;
  }
}

async function tryServerChat(message: string, mode: string): Promise<AiChatResult | null> {
  try {
    const data = await withTimeout(
      postJson<{ reply: string; provider?: string }>("/api/ai/chat", { message, mode }),
      10000,
      "server_timeout"
    );
    if (!data.reply) return null;
    if (data.provider === "groq") {
      preferred = "groq";
      return { reply: data.reply, provider: "groq" };
    }
    return {
      reply: data.reply,
      provider: data.provider === "local" ? "local" : "server",
    };
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

  // 1) GROQ TARAYICI ÖNCE — gerçek AI (kullanıcı ağı)
  const groq = await tryBrowserGroq(messages, 14000);
  if (groq) return groq;

  // 2) Sunucu (PC/Vercel'de Groq, sandbox'ta local)
  const server = await tryServerChat(opts.message, opts.mode);
  if (server) return server;

  throw new Error("AI sağlayıcıları başarısız");
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

  // Groq first
  const groq = await tryBrowserGroq(messages, 12000);
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
      10000,
      "roleplay_server_timeout"
    );
    if (data.reply) {
      return {
        reply: data.reply,
        provider: data.provider === "groq" ? "groq" : data.provider === "local" ? "local" : "server",
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
