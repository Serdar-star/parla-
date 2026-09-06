/**
 * Birleşik istemci AI zinciri:
 * 1) Tarayıcı → Groq (kullanıcı ağı)
 * 2) Tarayıcı → WebLLM (yerel GPU/CPU, gerçek model)
 * 3) Sunucu /api/ai/chat
 * 4) Yerel kural motoru (sayfa tarafında)
 */

"use client";

import {
  buildChatMessages,
  groqBrowserChat,
  loadGroqBridge,
  type BridgeConfig,
  type ChatMessage,
} from "@/lib/groq-browser";
import { ensureWebLlm, webLlmChat, onWebLlmStatus, getWebLlmStatus, type WebLlmStatus } from "@/lib/webllm-engine";
import { postJson } from "@/lib/api";

export type AiProvider = "groq" | "webllm" | "server" | "local" | "checking";

export type AiChatResult = {
  reply: string;
  provider: AiProvider;
};

let bridgeCache: BridgeConfig | null = null;

export async function initAiProviders(
  onStatus?: (p: AiProvider, detail?: string) => void
): Promise<AiProvider> {
  onStatus?.("checking");

  // 1) Groq bridge
  try {
    const bridge = await loadGroqBridge(true);
    bridgeCache = bridge;
    if (bridge.enabled && bridge.apiKey) {
      try {
        const test = await groqBrowserChat({
          bridge,
          messages: [
            { role: "system", content: "Reply with exactly: OK" },
            { role: "user", content: "ping" },
          ],
          model: bridge.fastModel || bridge.model,
          maxTokens: 8,
          temperature: 0,
        });
        if (test.reply) {
          onStatus?.("groq", "Groq tarayıcı bağlantısı OK");
          return "groq";
        }
      } catch (e) {
        console.warn("Groq browser test failed", e);
      }
    }
  } catch (e) {
    console.warn("Bridge load failed", e);
  }

  // 2) WebLLM background warm-up (don't block forever)
  try {
    onStatus?.("checking", "WebLLM model indiriliyor…");
    // Fire and forget warm-up; status via listeners
    void ensureWebLlm()
      .then(() => onStatus?.("webllm", "WebLLM hazır"))
      .catch((e) => console.warn("WebLLM warm-up failed", e));

    // Give WebLLM a short head-start check
    const st = getWebLlmStatus();
    if (st.state === "ready") {
      onStatus?.("webllm");
      return "webllm";
    }
  } catch {
    /* ignore */
  }

  onStatus?.("local", "Yedek motor");
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

  // 1) Browser Groq
  try {
    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await loadGroqBridge();
      bridgeCache = bridge;
    }
    if (bridge.enabled && bridge.apiKey) {
      const { reply } = await groqBrowserChat({ bridge, messages });
      return { reply, provider: "groq" };
    }
  } catch (e) {
    console.warn("Groq browser chat failed", e);
  }

  // 2) WebLLM
  try {
    const { reply } = await webLlmChat({ messages, maxTokens: 512 });
    return { reply, provider: "webllm" };
  } catch (e) {
    console.warn("WebLLM chat failed", e);
  }

  // 3) Server API
  try {
    const data = await postJson<{ reply: string; provider?: string }>("/api/ai/chat", {
      message: opts.message,
      mode: opts.mode,
    });
    if (data.reply) {
      const p = data.provider === "groq" ? "groq" : "server";
      return { reply: data.reply, provider: p };
    }
  } catch (e) {
    console.warn("Server AI failed", e);
  }

  throw new Error("Tüm AI sağlayıcıları başarısız");
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
      ? `Sen ${opts.characterName} karakterisin (${opts.scenario}). Kısa, doğal ve karaktere uygun ilk mesajı İngilizce yaz. 2-3 cümle.`
      : `Sen ${opts.characterName} karakterisin (${opts.scenario}). Karaktere sadık kal, kısa ve doğal İngilizce konuş (2-3 cümle).`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];
  if (opts.history) {
    for (const h of opts.history.slice(-12)) {
      messages.push({ role: h.role === "user" ? "user" : "assistant", content: h.content });
    }
  }
  if (opts.action === "start" && messages.length === 1) {
    messages.push({ role: "user", content: "Start the conversation now." });
  }

  try {
    let bridge = bridgeCache;
    if (!bridge) {
      bridge = await loadGroqBridge();
      bridgeCache = bridge;
    }
    if (bridge.enabled && bridge.apiKey) {
      const { reply } = await groqBrowserChat({ bridge, messages, temperature: 0.8, maxTokens: 400 });
      return { reply, provider: "groq" };
    }
  } catch (e) {
    console.warn("roleplay groq failed", e);
  }

  try {
    const { reply } = await webLlmChat({ messages, temperature: 0.8, maxTokens: 300 });
    return { reply, provider: "webllm" };
  } catch (e) {
    console.warn("roleplay webllm failed", e);
  }

  const data = await postJson<{ reply: string; provider?: string }>("/api/ai/roleplay", {
    character: opts.characterId,
    action: opts.action,
    message: opts.message,
    history: (opts.history || []).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    })),
  });
  return { reply: data.reply, provider: data.provider === "groq" ? "groq" : "server" };
}
