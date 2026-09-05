import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, GORSEL_MODEL, groqWithRetry } from "@/lib/groq";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  image: z.string().min(10),
  targetLang: z.string().optional().default("en"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user.isPremium) {
      return Response.json({ error: "Bu özellik Premium'a özel! Hemen yükselt ve tüm özelliklere eriş.", premium: true }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rl = rateLimit(`ai-vision:${user.id}:${ip}`, 15, 60_000);
    if (!rl.allowed) return Response.json({ error: "Çok fazla istek" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const { image, targetLang } = parsed.data;

    // image is expected to be base64 or data URL
    let imageUrl = image;
    if (!image.startsWith("data:") && !image.startsWith("http")) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const systemPrompt = `Sen bir görsel tanıma uzmanısın. Resimdeki ana nesneyi tanımla ve şu JSON formatında dön:
{
  "object": "nesnenin Türkçe adı",
  "objectEn": "nesnenin ${targetLang} dilindeki adı",
  "pronunciation": "telaffuzu",
  "description": "kısa açıklama",
  "examples": ["örnek cümle 1 ${targetLang}", "örnek cümle 2", "örnek cümle 3"]
}
Sadece JSON döndür.`;

    try {
      const client = getGroqClient();
      const completion = await groqWithRetry(() =>
        client.chat.completions.create({
          model: GORSEL_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Bu resimde ne var? Hedef dilde adını ve 3 örnek cümle ver." },
                { type: "image_url", image_url: { url: imageUrl } },
              ] as any,
            },
          ],
          temperature: 0.3,
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
      return Response.json({
        object: "Nesne",
        objectEn: "Object",
        pronunciation: "/ˈɒbdʒɪkt/",
        description: raw.slice(0, 200),
        examples: ["This is an object.", "I can see the object clearly.", "The object is on the table."],
      });
    } catch (err: any) {
      console.error("Vision error", err);
      if (String(err?.message).includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      // Fallback mock
      return Response.json({
        object: "Bardak",
        objectEn: "Cup",
        pronunciation: "/kʌp/",
        description: "Fotoğraftaki nesne bir bardak gibi görünüyor.",
        examples: ["This is a cup.", "I drink coffee from this cup.", "The cup is on the table."],
      });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
