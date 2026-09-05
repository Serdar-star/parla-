import { GROQ_API_KEY } from "@/lib/groq";
import { probeGroq } from "@/lib/ai-local";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const hasKey = Boolean(GROQ_API_KEY);
    const reachable = hasKey ? await probeGroq(4000) : false;
    return Response.json({
      hasKey,
      reachable,
      provider: reachable ? "groq" : "local",
      message: reachable
        ? "Groq bağlantısı aktif ✅"
        : hasKey
          ? "API anahtarı var ama bu ortamdan Groq'a çıkılamıyor — yerel AI motoru aktif."
          : "GROQ_API_KEY yok — yerel AI motoru aktif. .env'e key ekle.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
