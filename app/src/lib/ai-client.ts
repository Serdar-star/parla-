/**
 * Hızlı AI zinciri — ASLA takılmaz.
 * Sıra: sunucu (ms) → Groq tarayıcı (kısa) → yedek throw
 * WebLLM sohbet yolunda YOK (indirme dakikalar sürer, UI kilitler).
 */

"use client";

import {
  buildChatMessages,
  groqBrowserChat,
  loadGroqBridge,
  pingGroqBrowser,
  type BridgeConfig,
  type ChatMessage,
} from "@/lib/groq-browser";
import { onWebLlmStatus, getWebLlmStatus, type WebLlmStatus } from "@/lib/webllm-engine";
import { postJson } from "@/lib/api";

export type AiProvider = "groq" | "webllm" | "server" | "local" | "checking";

export type AiChatResult = {
  reply: string;
  provider: AiProvider;
};

let bridgeCache: BridgeConfig | null = null;
let preferred: AiProvider = "local";

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
  onStatus?.("checking");

  // Bridge'i arka planda yükle — UI'yi bloklama
  try {
    const bridge = await withTimeout(loadGroqBridge(true), 3000, "bridge_timeout");
    bridgeCache = bridge;

    if (bridge.enabled && bridge.apiKey) {
      // Kısa ping — max 2.5s; başarısızsa local/server'a düş
      const ok = await pingGroqBrowser(bridge);
      if (ok) {
        preferred = "groq";
        onStatus?.("groq", "Groq hazır");
        return "groq";
      }
    }
  } catch (e) {
    console.warn("AI init:", e);
  }

  preferred = "local";
  onStatus?.("local", "Hızlı yedek motor");
  return "local";
}

export function subscribeWebLlm(fn: (s: WebLlmStatus) => void) {
  return onWebLlmStatus(fn);
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

  // 1) SUNUCU ÖNCE — lokal yedek ms-seviyesinde, Groq açıksa da hızlı
  try {
    const data = await withTimeout(
      postJson<{ reply: string; provider?: string }>("/api/ai/chat", {
        message: opts.message,
        mode: opts.mode,
      }),
      8000,
      "server_timeout"
    );
    if (data.reply) {
      if (data.provider === "groq") {
        preferred = "groq";
        return { reply: data.reply, provider: "groq" };
      }
      // Server local fallback — yine de anında cevap
      return { reply: data.reply, provider: data.provider === "local" ? "local" : "server" };
    }
  } catch (e) {
    console.warn("Server AI:", e);
  }

  // 2) Tarayıcı Groq — sadece kısa bütçe (4 sn)
  try {
    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await withTimeout(loadGroqBridge(), 2000, "bridge");
      bridgeCache = bridge;
    }
    if (bridge.enabled && bridge.apiKey) {
      const { reply } = await groqBrowserChat({
        bridge,
        messages,
        maxTokens: 400,
        budgetMs: 4000,
      });
      preferred = "groq";
      return { reply, provider: "groq" };
    }
  } catch (e) {
    console.warn("Groq browser:", e);
  }

  // WebLLM sohbet yolunda YOK — model indirme UI'yi kilitliyordu

  throw new Error("AI sağlayıcıları zaman aşımına uğradı");
}

export async function clientRoleplayChat(opts: {
  characterName: string;
  scenario: string;
  action: "start" | "message";
  message?: string;
  history?: { role: "user" | "ai"; content: string }[];
  characterId: string;
}): Promise<AiChatResult> {
  // Roleplay: sunucu önce (anında local character replies)
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
      8000,
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

  // Kısa Groq denemesi
  try {
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
      messages.push({ role: "user", content: "Start now." });
    }

    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await withTimeout(loadGroqBridge(), 2000, "bridge");
      bridgeCache = bridge;
    }
    if (bridge.enabled && bridge.apiKey) {
      const { reply } = await groqBrowserChat({
        bridge,
        messages,
        temperature: 0.8,
        maxTokens: 250,
        budgetMs: 4000,
      });
      return { reply, provider: "groq" };
    }
  } catch (e) {
    console.warn("roleplay groq:", e);
  }

  throw new Error("Roleplay AI zaman aşımı");
}

export function getPreferredProvider(): AiProvider {
  return preferred;
}
