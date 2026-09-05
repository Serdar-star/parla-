import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, HIZLI_MODEL, groqWithRetry } from "@/lib/groq";
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

    const styleDesc = {
      resmi: "resmi ve profesyonel",
      gunluk: "günlük ve doğal konuşma dili",
      argo: "samimi, argo ve sokak dili (uygunsa)",
    }[style];

    const systemPrompt = `Sen profesyonel bir çevirmensin. Kaynak dil: ${sourceLang}, hedef dil: ${targetLang}. Çeviri stili: ${styleDesc}. 
Görev:
1. Ana çeviriyi ver
2. 2 alternatif çeviri sun
3. Varsa deyim/idiom açıklaması yap
4. Kısa ve net ol
JSON formatında dön:
{
  "main": "ana çeviri",
  "alternatives": ["alt1", "alt2"],
  "idiom": "deyim açıklaması veya null",
  "note": "kısa not"
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
          temperature: 0.3,
          max_tokens: 600,
        })
      );
      let raw = (completion as any).choices?.[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedJson = JSON.parse(jsonMatch[0]);
          return Response.json(parsedJson);
        } catch {}
      }
      return Response.json({ main: raw.trim(), alternatives: [], idiom: null, note: "" });
    } catch (err: any) {
      if (String(err?.message).includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      console.error("Translate error", err);
      return Response.json({ main: text, alternatives: [text], idiom: null, note: "Çeviri servisi şu an müsait değil, orijinal metin döndürüldü." });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
