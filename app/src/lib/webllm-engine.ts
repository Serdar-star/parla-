/**
 * Tarayıcıda çalışan gerçek LLM (WebLLM / MLC).
 * Groq ağı kapalı olsa bile kullanıcının GPU/CPU'sunda model çalışır.
 * Model HuggingFace'ten indirilir (tarayıcı ağı).
 */

"use client";

export type WebLlmStatus =
  | { state: "idle" }
  | { state: "loading"; progress: number; text: string }
  | { state: "ready"; modelId: string }
  | { state: "error"; message: string };

type EngineLike = {
  chat: {
    completions: {
      create: (opts: {
        messages: { role: string; content: string }[];
        temperature?: number;
        max_tokens?: number;
        stream?: boolean;
      }) => Promise<{ choices?: { message?: { content?: string } }[] }>;
    };
  };
  unload?: () => Promise<void>;
};

let engine: EngineLike | null = null;
let loadPromise: Promise<EngineLike> | null = null;
let statusListeners = new Set<(s: WebLlmStatus) => void>();
let lastStatus: WebLlmStatus = { state: "idle" };

const MODEL_CANDIDATES = [
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  "SmolLM2-360M-Instruct-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
  "Phi-3.5-mini-instruct-q4f16_1-MLC",
  "gemma-2-2b-it-q4f16_1-MLC",
];

function setStatus(s: WebLlmStatus) {
  lastStatus = s;
  statusListeners.forEach((fn) => {
    try {
      fn(s);
    } catch {
      /* ignore */
    }
  });
}

export function getWebLlmStatus(): WebLlmStatus {
  return lastStatus;
}

export function onWebLlmStatus(fn: (s: WebLlmStatus) => void): () => void {
  statusListeners.add(fn);
  fn(lastStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function isWebLlmReady(): boolean {
  return lastStatus.state === "ready" && engine != null;
}

export async function ensureWebLlm(): Promise<EngineLike> {
  if (engine) return engine;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    setStatus({ state: "loading", progress: 0, text: "WebLLM yükleniyor…" });

    if (typeof window === "undefined") {
      throw new Error("WebLLM sadece tarayıcıda çalışır");
    }

    const webllm = await import("@mlc-ai/web-llm");
    const { CreateMLCEngine, prebuiltAppConfig } = webllm as {
      CreateMLCEngine: (
        modelId: string,
        opts?: {
          initProgressCallback?: (p: { progress: number; text: string }) => void;
          appConfig?: unknown;
        }
      ) => Promise<EngineLike>;
      prebuiltAppConfig: { model_list: { model_id: string }[] };
    };

    const available = new Set((prebuiltAppConfig?.model_list || []).map((m) => m.model_id));
    const models = MODEL_CANDIDATES.filter((id) => available.has(id));
    if (models.length === 0) {
      // Fallback: take any small-ish model from catalog
      const any = (prebuiltAppConfig?.model_list || [])
        .map((m) => m.model_id)
        .filter((id) => /1B|360M|2b|2B|mini/i.test(id))
        .slice(0, 5);
      models.push(...any);
    }
    if (models.length === 0) {
      throw new Error("Uygun WebLLM modeli bulunamadı");
    }

    let lastErr: unknown;
    for (const modelId of models) {
      try {
        setStatus({ state: "loading", progress: 0.02, text: `Model: ${modelId}` });
        const eng = await CreateMLCEngine(modelId, {
          initProgressCallback: (p) => {
            setStatus({
              state: "loading",
              progress: Math.min(0.99, p.progress || 0),
              text: p.text || modelId,
            });
          },
        });
        engine = eng;
        setStatus({ state: "ready", modelId });
        return eng;
      } catch (e) {
        lastErr = e;
        console.warn("WebLLM model failed", modelId, e);
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr || "yükleme hatası");
    setStatus({ state: "error", message: msg });
    loadPromise = null;
    throw lastErr instanceof Error ? lastErr : new Error(msg);
  })();

  return loadPromise;
}

export async function webLlmChat(opts: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{ reply: string; provider: "webllm"; modelId?: string }> {
  const eng = await ensureWebLlm();
  const completion = await eng.chat.completions.create({
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 512,
    stream: false,
  });
  const reply = completion.choices?.[0]?.message?.content?.trim() || "";
  if (!reply) throw new Error("WebLLM boş cevap");
  const modelId = lastStatus.state === "ready" ? lastStatus.modelId : undefined;
  return { reply, provider: "webllm", modelId };
}
