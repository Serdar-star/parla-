import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, userLanguages } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, ANA_MODEL, checkDailyLimit, buildTeacherSystemPrompt, groqWithRetry } from "@/lib/groq";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  mode: z.string().optional().default("serbest"),
  stream: z.boolean().optional().default(false),
});

const MODES: Record<string, string> = {
  serbest: "Serbest sohbet modu: Kullanıcıyla günlük konularda sohbet et.",
  gramer: "Gramer modu: Kullanıcının gramer sorularını basit ve net açıkla, örnek cümle ver.",
  kelime: "Kelime modu: Kullanıcıya yeni kelimeler öğret, örneklerle pekiştir.",
  ceviri: "Çeviri modu: Kullanıcının Türkçe cümlelerini doğal şekilde çevir ve açıkla.",
};

function fallbackReply(message: string, mode: string): string {
  const t = message.toLowerCase();
  if (mode === "ceviri") return "Harika bir cümle! 🖋️ İngilizcesi: “I've been learning English for six months and I'm making great progress.” Dikkat: süre devam ediyorsa 'for + Present Perfect' kullanılır. Şimdi kendi cümleni kur!";
  if (mode === "gramer") {
    if (/(perfect|tense|zaman)/.test(t)) return "Present Perfect: geçmişte olmuş ama etkisi hâlâ süren olaylar. 'I have lost my keys' → anahtarlar hâlâ kayıp! Bitmiş ve zamanı belliyse Past Simple kullan: 'I lost my keys yesterday.' Bir örnek cümle kur, kontrol edeyim! 📐";
    return "Gramer kliniği açık! 🩺 Hangisi zorluyor: tense'ler mi, edatlar (in/on/at) mı, yoksa article'lar (a/the) mı? Seç, derine inelim.";
  }
  if (mode === "kelime") return "Yeni kelimen: 'journey' (yolculuk) 🧳 — 'The journey to fluency takes small daily steps.' Şimdi sen 'journey' ile bir cümle kur!";
  if (/(hi|hello|merhaba|selam)/.test(t)) return "Hello hello! 😊 Enerjin harika. Bugün sana nasıl yardımcı olabilirim? Bir konu seç ya da direkt İngilizce yazmaya başla!";
  if (/(teşekkür|thanks)/.test(t)) return "You're very welcome! 🌟 'Thanks' günlük, 'thank you' nazik, 'I appreciate it' kalpleri eritir. Bugün birini kullan, söz mü?";
  return "Interesting! 🚀 Devam edelim: bunu bir sıfat ve bir duygu kelimesiyle zenginleştir. Örnek: 'It was exciting and I felt proud.' Şimdi sıra sende!";
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    // Rate limiting per IP + user
    const ip = getClientIp(req);
    const rl = rateLimit(`ai-chat:${user.id}:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return Response.json({ error: "Çok fazla istek, biraz bekle." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Geçersiz istek", details: parsed.error.issues }, { status: 400 });
    }
    const { message, mode, stream } = parsed.data;
    const trimmed = message.trim();
    if (!trimmed) return Response.json({ error: "Mesaj boş olamaz." }, { status: 400 });

    // Daily limit check
    const limitCheck = checkDailyLimit(user.id, !!user.isPremium);
    if (!limitCheck.allowed) {
      return Response.json({ error: "Günlük limitin doldu, premium'a geç veya yarın tekrar dene.", limit: true }, { status: 429 });
    }

    // Get user language info
    let targetLang = user.currentLanguage || "en";
    let cefr = "A2";
    try {
      const langRows = await db.select().from(userLanguages).where(and(eq(userLanguages.userId, user.id), eq(userLanguages.languageCode, targetLang))).limit(1);
      if (langRows[0]) cefr = langRows[0].cefrLevel || "A2";
    } catch {}

    // Save user message
    await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "user", content: trimmed });

    // Get recent history (last 12)
    let history: { role: string; content: string }[] = [];
    try {
      const rows = await db.select().from(aiConversations).where(eq(aiConversations.userId, user.id)).orderBy(desc(aiConversations.id)).limit(12);
      history = rows.reverse().map((r) => ({ role: r.role === "user" ? "user" : "assistant", content: r.content }));
    } catch {}

    const systemPrompt = buildTeacherSystemPrompt(targetLang, cefr) + "\n" + (MODES[mode] ?? MODES.serbest);

    const groqKey = process.env.GROQ_API_KEY;
    const useStreaming = stream || req.headers.get("accept")?.includes("text/event-stream");

    if (!groqKey) {
      const reply = fallbackReply(trimmed, mode);
      await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: reply });
      if (useStreaming) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(reply));
            controller.close();
          },
        });
        return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      return Response.json({ reply, mode, usedAI: false, remaining: limitCheck.remaining });
    }

    // Try Groq with retry
    try {
      const client = getGroqClient();
      const messages: any[] = [{ role: "system", content: systemPrompt }, ...history.slice(-10), { role: "user", content: trimmed }];

      if (useStreaming) {
        const streamResp = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 800,
            stream: true,
          })
        );

        let fullReply = "";
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResp as any) {
                const delta = chunk.choices?.[0]?.delta?.content || "";
                if (delta) {
                  fullReply += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              }
              controller.close();
              // Save after stream ends
              if (fullReply.trim()) {
                await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: fullReply.trim() });
              }
            } catch (e) {
              controller.error(e);
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Remaining": String(limitCheck.remaining),
          },
        });
      } else {
        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 800,
          })
        );
        const reply = (completion as any).choices?.[0]?.message?.content?.trim() || fallbackReply(trimmed, mode);
        await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: reply });
        return Response.json({ reply, mode, usedAI: true, remaining: limitCheck.remaining });
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      }
      console.error("Groq chat error", err);
      const reply = fallbackReply(trimmed, mode);
      await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: reply });
      return Response.json({ reply, mode, usedAI: false, fallback: true, remaining: limitCheck.remaining });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
