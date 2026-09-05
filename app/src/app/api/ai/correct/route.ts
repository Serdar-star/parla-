import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, HIZLI_MODEL, groqWithRetry } from "@/lib/groq";
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

    const systemPrompt = `Sen bir ${targetLang} dil bilgisi uzmanısın. Kullanıcının yazdığı metni analiz et.
Görev:
1. Gramer hatalarını bul
2. Düzeltilmiş versiyonu ver
3. Her hatanın neden yanlış olduğunu Türkçe açıkla
4. Daha iyi alternatif cümle öner
JSON formatında dön:
{
  "original": "orijinal metin",
  "corrected": "düzeltilmiş metin",
  "errors": [{"error": "hatalı kısım", "correction": "doğrusu", "explanation": "açıklama"}],
  "alternative": "daha doğal alternatif"
}`;

    try {
      const client = getGroqClient();
      const completion = await groqWithRetry(() =>
        client.chat.completions.create({
          model: HIZLI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.2,
          max_tokens: 800,
        })
      );
      let raw = (completion as any).choices?.[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const j = JSON.parse(jsonMatch[0]);
          return Response.json(j);
        } catch {}
      }
      return Response.json({ original: text, corrected: raw, errors: [], alternative: raw });
    } catch (err: any) {
      if (String(err?.message).includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      console.error("Correct error", err);
      return Response.json({ original: text, corrected: text, errors: [], alternative: text });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
