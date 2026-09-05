import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, GORSEL_MODEL, groqWithRetry, GROQ_API_KEY } from "@/lib/groq";
import { localVisionFallback, probeGroq } from "@/lib/ai-local";
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
      return Response.json(
        { error: "Bu özellik Premium'a özel! Hemen yükselt ve tüm özelliklere eriş.", premium: true },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rl = rateLimit(`ai-vision:${user.id}:${ip}`, 15, 60_000);
    if (!rl.allowed) return Response.json({ error: "Çok fazla istek" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const { image, targetLang } = parsed.data;
    let imageUrl = image;
    if (!image.startsWith("data:") && !image.startsWith("http")) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const groqUp = Boolean(GROQ_API_KEY) && (await probeGroq(3000));

    if (groqUp) {
      try {
        const systemPrompt = `Sen görsel tanıma uzmanısın. JSON döndür:
{"object":"TR adı","objectEn":"${targetLang} adı","pronunciation":"...","description":"...","examples":["...","...","..."]}`;
        const client = getGroqClient();
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: GORSEL_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  { type: "text" as const, text: "Bu resimde ne var? Hedef dilde adını ve 3 örnek cümle ver." },
                  { type: "image_url" as const, image_url: { url: imageUrl } },
                ],
              },
            ],
            temperature: 0.3,
            max_tokens: 800,
            stream: false,
          })
        );
        let raw = (completion as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) return Response.json({ ...JSON.parse(jsonMatch[0]), provider: "groq" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      }
    }

    return Response.json({ ...localVisionFallback(), provider: "local" });
  } catch (err) {
    return handleApiError(err);
  }
}
