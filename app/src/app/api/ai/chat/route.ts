import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, userLanguages } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { getGroqClient, ANA_MODEL, checkDailyLimit, buildTeacherSystemPrompt, groqWithRetry, GROQ_API_KEY } from "@/lib/groq";
import { localTeacherReply, probeGroq } from "@/lib/ai-local";
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

export async function POST(req: Request) {
  try {
    const user = await requireUser();
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

    const limitCheck = checkDailyLimit(user.id, !!user.isPremium);
    if (!limitCheck.allowed) {
      return Response.json({ error: "Günlük limitin doldu, premium'a geç veya yarın tekrar dene.", limit: true }, { status: 429 });
    }

    let targetLang = user.currentLanguage || "en";
    let cefr = "A2";
    try {
      const langRows = await db
        .select()
        .from(userLanguages)
        .where(and(eq(userLanguages.userId, user.id), eq(userLanguages.languageCode, targetLang)))
        .limit(1);
      if (langRows[0]) cefr = langRows[0].cefrLevel || "A2";
    } catch {
      /* ignore */
    }

    await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "user", content: trimmed });

    let history: { role: string; content: string }[] = [];
    try {
      const rows = await db.select().from(aiConversations).where(eq(aiConversations.userId, user.id)).orderBy(desc(aiConversations.id)).limit(12);
      history = rows.reverse().map((r) => ({ role: r.role === "user" ? "user" : "assistant", content: r.content }));
    } catch {
      /* ignore */
    }

    const systemPrompt = buildTeacherSystemPrompt(targetLang, cefr) + "\n" + (MODES[mode] ?? MODES.serbest);
    const useStreaming = stream || req.headers.get("accept")?.includes("text/event-stream");

    // Try Groq if key exists and network allows
    const groqUp = Boolean(GROQ_API_KEY) && (await probeGroq(3500));

    if (groqUp) {
      try {
        const client = getGroqClient();
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...history.slice(-10).map((h) => ({
            role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: h.content,
          })),
          { role: "user", content: trimmed },
        ];

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
                for await (const chunk of streamResp as AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>) {
                  const delta = chunk.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    fullReply += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                }
                controller.close();
                if (fullReply.trim()) {
                  await db.insert(aiConversations).values({
                    userId: user.id,
                    languageCode: targetLang,
                    role: "assistant",
                    content: fullReply.trim(),
                  });
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
              "X-AI-Provider": "groq",
            },
          });
        }

        const completion = await groqWithRetry(() =>
          client.chat.completions.create({
            model: ANA_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 800,
          })
        );
        const reply = completion.choices?.[0]?.message?.content?.trim() || localTeacherReply(trimmed, mode);
        await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: reply });
        return Response.json({ reply, mode, usedAI: true, provider: "groq", remaining: limitCheck.remaining });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
        }
        console.error("Groq chat error, falling back to local:", msg);
      }
    }

    // Local intelligent fallback (always works offline / blocked network)
    const reply = localTeacherReply(trimmed, mode);
    await db.insert(aiConversations).values({ userId: user.id, languageCode: targetLang, role: "assistant", content: reply });

    if (useStreaming) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Stream word-by-word for nicer UX
          const parts = reply.split(/(\s+)/);
          for (const p of parts) {
            controller.enqueue(encoder.encode(p));
            await new Promise((r) => setTimeout(r, 12));
          }
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-AI-Provider": "local",
        },
      });
    }

    return Response.json({
      reply,
      mode,
      usedAI: true,
      provider: groqUp ? "local-fallback" : "local",
      remaining: limitCheck.remaining,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
