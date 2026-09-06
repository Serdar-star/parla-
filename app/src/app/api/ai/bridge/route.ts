import { handleApiError, requireUser } from "@/lib/auth";
import {
  ANA_MODEL,
  GROQ_MODEL_FALLBACKS,
  HIZLI_MODEL,
  buildTeacherSystemPrompt,
  getGroqApiKey,
  hasGroqKey,
} from "@/lib/groq";
import { probeGroq } from "@/lib/ai-local";

/**
 * Tarayıcı köprüsü: sunucu Groq'a çıkamazsa kullanıcının tarayıcısı
 * api.groq.com'u çağırır. Key yalnızca oturumlu (veya DEMO) kullanıcıya verilir.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const apiKey = getGroqApiKey();
    if (!hasGroqKey()) {
      return Response.json({
        enabled: false,
        reason: "no_key",
        message: "GROQ_API_KEY eksik. app/.env.local dosyasına ekle.",
      });
    }

    // Demo / sandbox: her zaman tarayıcı köprüsünü aç (sunucu TLS engelli olabilir)
    // Production + sunucu Groq'a çıkabiliyorsa key verme
    const forceBrowser = process.env.DEMO_MODE !== "off" || process.env.FORCE_GROQ_BROWSER === "1";
    let serverReachable = false;
    if (!forceBrowser) {
      serverReachable = await probeGroq(800);
      if (serverReachable) {
        return Response.json({ enabled: false, reason: "server_ok", provider: "groq" });
      }
    }

    const targetLang = user.currentLanguage || "en";
    return Response.json({
      enabled: true,
      provider: "groq-browser",
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      model: ANA_MODEL,
      fastModel: HIZLI_MODEL,
      models: GROQ_MODEL_FALLBACKS,
      systemPrompt: buildTeacherSystemPrompt(targetLang, "A2"),
      userId: user.id,
      serverReachable,
      forceBrowser,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
