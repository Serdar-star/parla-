import { handleApiError, requireUser } from "@/lib/auth";
import { groqChatCompletion, hasGroqKey, HIZLI_MODEL, ANA_MODEL } from "@/lib/groq";
import { localTranslate } from "@/lib/ai-local";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(2000),
  style: z.enum(["resmi", "gunluk", "argo"]).optional().default("gunluk"),
  targetLang: z.string().optional().default("en"),
  sourceLang: z.string().optional().default("tr"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(req);
    const rl = rateLimit(`ai-translate:${user.id}:${ip}`, 30, 60_000);
    if (!rl.allowed) return Response.json({ error: "Çok fazla istek" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek", details: parsed.error.issues }, { status: 400 });

    const { text, style, targetLang, sourceLang } = parsed.data;

    if (hasGroqKey()) {
      try {
        const styleDesc = { resmi: "resmi ve profesyonel", gunluk: "günlük ve doğal", argo: "samimi/argo" }[style];
        const systemPrompt = `Sen profesyonel bir çevirmensin. Kaynak: ${sourceLang}, hedef: ${targetLang}, stil: ${styleDesc}.
JSON döndür: {"main":"...","alternatives":["...","..."],"idiom":null,"note":"..."}`;
        const { content: raw } = await groqChatCompletion({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.3,
          max_tokens: 600,
          models: [HIZLI_MODEL, ANA_MODEL],
        });
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return Response.json({ ...JSON.parse(jsonMatch[0]), provider: "groq" });
        }
        return Response.json({ main: raw.trim(), alternatives: [], idiom: null, note: "", provider: "groq" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      }
    }

    return Response.json({ ...localTranslate(text, style), provider: "local" });
  } catch (err) {
    return handleApiError(err);
  }
}
