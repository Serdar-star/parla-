import { handleApiError, requireUser } from "@/lib/auth";
import { ANA_MODEL, GROQ_API_KEY, GROQ_MODEL_FALLBACKS, HIZLI_MODEL, buildTeacherSystemPrompt } from "@/lib/groq";import { probeGroq } from "@/lib/ai-local";

/**
 * Tarayıcı köprüsü: sandbox sunucusu Groq TLS'ine çıkamazken,
 * kullanıcının tarayıcısı dışarıdan api.groq.com'a erişebilir.
 * Anahtar yalnızca oturum açmış kullanıcıya ve yalnızca sunucu
 * Groq'a ulaşamadığında (veya DEMO_MODE) verilir.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const hasKey = Boolean(GROQ_API_KEY);
    if (!hasKey) {
      return Response.json({ enabled: false, reason: "no_key" });
    }

    const demo = process.env.DEMO_MODE === "on" || process.env.DEMO_MODE === "true";
    const serverReachable = await probeGroq(2500);

    // Sunucu Groq'a çıkabiliyorsa köprüye gerek yok
    if (serverReachable && !demo) {
      return Response.json({ enabled: false, reason: "server_ok", provider: "groq" });
    }

    // DEMO veya sunucu engelli → tarayıcı köprüsünü aç
    if (!serverReachable || demo) {
      const targetLang = user.currentLanguage || "en";
      return Response.json({
        enabled: true,
        provider: "groq-browser",
        apiKey: GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        model: ANA_MODEL,
        fastModel: HIZLI_MODEL,
        models: GROQ_MODEL_FALLBACKS,
        systemPrompt: buildTeacherSystemPrompt(targetLang, "A2"),
        userId: user.id,
      });    }

    return Response.json({ enabled: false, reason: "disabled" });
  } catch (err) {
    return handleApiError(err);
  }
}
