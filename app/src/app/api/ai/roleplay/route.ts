import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, userLanguages } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, ANA_MODEL, HIZLI_MODEL, ROLEPLAY_CHARACTERS, groqWithRetry, checkDailyLimit } from "@/lib/groq";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const bodySchema = z.object({
  character: z.string().min(1),
  message: z.string().min(1).max(2000).optional(),
  action: z.enum(["start", "message", "finish", "hint"]).optional().default("message"),
  history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  stream: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(req);
    const rl = rateLimit(`ai-roleplay:${user.id}:${ip}`, 30, 60_000);
    if (!rl.allowed) return Response.json({ error: "Çok fazla istek" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek", details: parsed.error.issues }, { status: 400 });

    const { character, message, action, history, stream } = parsed.data;
    const charDef = (ROLEPLAY_CHARACTERS as any)[character] || ROLEPLAY_CHARACTERS.arkadas;

    // Daily limit for free users
    if (!user.isPremium) {
      const limitCheck = checkDailyLimit(user.id, false);
      if (!limitCheck.allowed) {
        return Response.json({ error: "Günlük limitin doldu, premium'a geç veya yarın tekrar dene.", limit: true }, { status: 429 });
      }
    }

    let targetLang = user.currentLanguage || "en";
    let cefr = "A2";
    try {
      const rows = await db.select().from(userLanguages).where(and(eq(userLanguages.userId, user.id), eq(userLanguages.languageCode, targetLang))).limit(1);
      if (rows[0]) cefr = rows[0].cefrLevel;
    } catch {}

    const client = getGroqClient();

    if (action === "start") {
      const prompt = `${charDef.systemPrompt}\nKullanıcının öğrendiği dil: ${targetLang}, seviyesi: ${cefr}. Sen ${charDef.name} karakterisin. İlk mesajı sen başlat, kısa ve karaktere uygun.`;
      try {
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages: [{ role: "system", content: prompt }],
            temperature: 0.8,
            max_tokens: 300,
          })
        );
        const reply = (completion as any).choices?.[0]?.message?.content || `Merhaba! Ben ${charDef.name} ${charDef.emoji}. Nasıl yardımcı olabilirim?`;
        return Response.json({ reply, character: charDef.id });
      } catch (e) {
        return Response.json({ reply: `Merhaba! Ben ${charDef.name} ${charDef.emoji}. Bugün nasıl yardımcı olabilirim?`, character: charDef.id });
      }
    }

    if (action === "hint") {
      const hintPrompt = `Sen ${charDef.name} karakterisin. Kullanıcı ne söyleyeceğini bilmiyor. Bu durumda söyleyebileceği 3 farklı cümleyi ${targetLang} dilinde öner. Kısa, doğal ve seviyeye uygun (${cefr}). Sadece 3 cümle listele, numaralandır.`;
      try {
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: HIZLI_MODEL,
            messages: [
              { role: "system", content: hintPrompt },
              ...((history || []).slice(-6).map((m) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
              }))),
            ],
            temperature: 0.7,
            max_tokens: 300,
          })
        );
        const text = (completion as any).choices?.[0]?.message?.content || "";
        const suggestions = text.split("\n").filter((l: string) => l.trim().length > 3).slice(0, 3).map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim());
        return Response.json({ hints: suggestions.length ? suggestions : ["Could you help me please?", "I would like to order something.", "Thank you!"] });
      } catch {
        return Response.json({ hints: ["Could you help me please?", "What do you recommend?", "Thank you so much!"] });
      }
    }

    if (action === "finish") {
      const transcript = history || [];
      const analysisPrompt = `Kullanıcının ${charDef.name} (${charDef.scenario}) ile yaptığı roleplay konuşmasını analiz et. Dil: ${targetLang}, Seviye: ${cefr}. Şu formatta JSON döndür (sadece JSON, başka metin yok):
{
  "score": 0-100 arası genel puan,
  "grammar": 0-100,
  "vocabulary": 0-100,
  "communication": 0-100,
  "mistakes": ["yanlış1 - doğrusu ve açıklama", "yanlış2", "yanlış3"],
  "suggestions": ["öneri1", "öneri2", "öneri3"]
}
Konuşma:
${transcript.map((m) => `${m.role}: ${m.content}`).join("\n")}`;

      try {
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages: [{ role: "system", content: analysisPrompt }],
            temperature: 0.3,
            max_tokens: 800,
          })
        );
        let raw = (completion as any).choices?.[0]?.message?.content || "";
        // Try to extract JSON
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) raw = jsonMatch[0];
        const report = JSON.parse(raw);
        return Response.json({ report });
      } catch (e) {
        console.error("Roleplay finish error", e);
        return Response.json({
          report: {
            score: 75,
            grammar: 70,
            vocabulary: 80,
            communication: 78,
            mistakes: ["I am agree -> I agree (agree fiil, am almaz)", "more better -> better (karşılaştırma zaten var)", "I go yesterday -> I went yesterday"],
            suggestions: ["Geçmiş zaman için went, saw gibi düzensiz fiilleri tekrar et", "Günlük ifadeleri ezberle: Could you...?", "Her gün 5 dakika roleplay yap"],
          },
        });
      }
    }

    // Default message action
    if (!message) return Response.json({ error: "Mesaj gerekli" }, { status: 400 });

    const systemPrompt = `${charDef.systemPrompt}\nKullanıcının öğrendiği dil: ${targetLang}, seviyesi: ${cefr}, anadili: Türkçe. Karakterine sadık kal, kısa ve doğal konuş (2-3 cümle). Hataları nazikçe düzeltme, sadece konuşmaya devam et.`;

    const useStreaming = stream || req.headers.get("accept")?.includes("text/event-stream");

    try {
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...((history || []).slice(-12).map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }))),
        { role: "user", content: message },
      ];

      if (useStreaming) {
        const streamResp = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages,
            temperature: 0.8,
            max_tokens: 500,
            stream: true,
          })
        );
        let full = "";
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResp as any) {
                const delta = chunk.choices?.[0]?.delta?.content || "";
                if (delta) {
                  full += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          },
        });
        return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      } else {
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages,
            temperature: 0.8,
            max_tokens: 500,
          })
        );
        const reply = (completion as any).choices?.[0]?.message?.content?.trim() || "Anladım, devam edelim!";
        return Response.json({ reply, character: charDef.id });
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      console.error("Roleplay error", err);
      return Response.json({ reply: "Harika! Devam edelim, bir şey daha söyle!", character: charDef.id });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
