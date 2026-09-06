import { handleApiError, requireUser } from "@/lib/auth";
import { groqChatCompletion, hasGroqKey, HIZLI_MODEL, ANA_MODEL } from "@/lib/groq";
import { localCorrect } from "@/lib/ai-local";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.string().optional().default("en"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(req);
    const rl = rateLimit(`ai-correct:${user.id}:${ip}`, 30, 60_000);
    if (!rl.allowed) return Response.json({ error: "Çok fazla istek" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const { text, targetLang } = parsed.data;

    if (hasGroqKey()) {
      try {
        const systemPrompt = `Sen bir ${targetLang} dil bilgisi uzmanısın. JSON döndür:
{"original":"...","corrected":"...","errors":[{"error":"...","correction":"...","explanation":"..."}],"alternative":"..."}`;
        const { content: raw } = await groqChatCompletion({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.2,
          max_tokens: 800,
          models: [HIZLI_MODEL, ANA_MODEL],
        });
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) return Response.json({ ...JSON.parse(jsonMatch[0]), provider: "groq" });
        return Response.json({ original: text, corrected: raw, errors: [], alternative: raw, provider: "groq" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      }
    }

    return Response.json({ ...localCorrect(text), provider: "local" });
  } catch (err) {
    return handleApiError(err);
  }
}
