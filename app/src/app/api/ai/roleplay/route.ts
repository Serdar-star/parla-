import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userLanguages } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import {
  getGroqClient,
  ANA_MODEL,
  HIZLI_MODEL,
  ROLEPLAY_CHARACTERS,
  groqWithRetry,
  groqChatCompletion,
  checkDailyLimit,
  hasGroqKey,
} from "@/lib/groq";
import { localRoleplayReply, localRoleplayReport } from "@/lib/ai-local";
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
    const charDef = (ROLEPLAY_CHARACTERS as Record<string, (typeof ROLEPLAY_CHARACTERS)[keyof typeof ROLEPLAY_CHARACTERS]>)[character] || ROLEPLAY_CHARACTERS.arkadas;

    if (!user.isPremium) {
      const limitCheck = checkDailyLimit(user.id, false);
      if (!limitCheck.allowed) {
        return Response.json({ error: "Günlük limitin doldu, premium'a geç veya yarın tekrar dene.", limit: true }, { status: 429 });
      }
    }

    let targetLang = user.currentLanguage || "en";
    let cefr = "A2";
    try {
      const rows = await db
        .select()
        .from(userLanguages)
        .where(and(eq(userLanguages.userId, user.id), eq(userLanguages.languageCode, targetLang)))
        .limit(1);
      if (rows[0]) cefr = rows[0].cefrLevel;
    } catch {
      /* ignore */
    }

    const groqUp = hasGroqKey();

    if (action === "start") {
      if (groqUp) {
        try {
          const prompt = `${charDef.systemPrompt}\nKullanıcının öğrendiği dil: ${targetLang}, seviyesi: ${cefr}. Sen ${charDef.name} karakterisin. İlk mesajı sen başlat, kısa ve karaktere uygun.`;
          const { content: reply } = await groqChatCompletion({
            messages: [{ role: "system", content: prompt }],
            temperature: 0.8,
            max_tokens: 300,
          });
          return Response.json({ reply, character: charDef.id, provider: "groq" });
        } catch {
          /* fall through */
        }
      }
      return Response.json({ reply: localRoleplayReply(charDef.id, "", true), character: charDef.id, provider: "local" });
    }

    if (action === "hint") {
      if (groqUp) {
        try {
          const hintPrompt = `Sen ${charDef.name} karakterisin. Kullanıcı ne söyleyeceğini bilmiyor. Bu durumda söyleyebileceği 3 farklı cümleyi ${targetLang} dilinde öner. Kısa, doğal ve seviyeye uygun (${cefr}). Sadece 3 cümle listele, numaralandır.`;
          const { content: text } = await groqChatCompletion({
            messages: [
              { role: "system", content: hintPrompt },
              ...((history || []).slice(-6).map((m) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
              }))),
            ],
            temperature: 0.7,
            max_tokens: 300,
            models: [HIZLI_MODEL, ANA_MODEL],
          });
          const suggestions = text
            .split("\n")
            .filter((l: string) => l.trim().length > 3)
            .slice(0, 3)
            .map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim());
          if (suggestions.length) return Response.json({ hints: suggestions, provider: "groq" });
        } catch {
          /* fall through */
        }
      }
      const hints: Record<string, string[]> = {
        barista: ["I'd like a latte, please.", "What do you recommend?", "Can I get that iced?"],
        garson: ["Could I see the menu, please?", "I'd like the special, please.", "Could we have the bill?"],
        resepsiyonist: ["I have a reservation under my name.", "Is breakfast included?", "Could I have a late checkout?"],
        taksi: ["Could you take me to the museum?", "How long will it take?", "Please stop here."],
        doktor: ["I've had a headache for two days.", "It hurts when I breathe.", "Do I need any medicine?"],
        kasiyer: ["Cash, please.", "Do you have a bag?", "Can I pay by card?"],
        mulakatci: ["I have three years of experience.", "My greatest strength is teamwork.", "I'm a fast learner."],
        biletci: ["Two tickets for tonight, please.", "Do you have student discounts?", "Where is the entrance?"],
        musteri_hizmetleri: ["My internet is not working.", "Can you reset my line?", "I'd like to speak to a manager."],
        arkadas: ["What's up?", "Want to hang out this weekend?", "That sounds amazing!"],
      };
      return Response.json({ hints: hints[charDef.id] || hints.arkadas, provider: "local" });
    }

    if (action === "finish") {
      if (groqUp) {
        try {
          const transcript = history || [];
          const analysisPrompt = `Kullanıcının ${charDef.name} (${charDef.scenario}) ile yaptığı roleplay konuşmasını analiz et. Dil: ${targetLang}, Seviye: ${cefr}. Şu formatta JSON döndür (sadece JSON):
{"score":0-100,"grammar":0-100,"vocabulary":0-100,"communication":0-100,"mistakes":["..."],"suggestions":["..."]}
Konuşma:
${transcript.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
          const { content: raw } = await groqChatCompletion({
            messages: [{ role: "system", content: analysisPrompt }],
            temperature: 0.3,
            max_tokens: 800,
          });
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return Response.json({ report: JSON.parse(jsonMatch[0]), provider: "groq" });
          }
        } catch {
          /* fall through */
        }
      }
      return Response.json({ report: localRoleplayReport(), provider: "local" });
    }

    if (!message) return Response.json({ error: "Mesaj gerekli" }, { status: 400 });

    const systemPrompt = `${charDef.systemPrompt}\nKullanıcının öğrendiği dil: ${targetLang}, seviyesi: ${cefr}, anadili: Türkçe. Karakterine sadık kal, kısa ve doğal konuş (2-3 cümle).`;
    const useStreaming = stream || req.headers.get("accept")?.includes("text/event-stream");

    if (groqUp) {
      try {
        const client = getGroqClient();
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
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamResp as AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>) {
                  const delta = chunk.choices?.[0]?.delta?.content || "";
                  if (delta) controller.enqueue(encoder.encode(delta));
                }
                controller.close();
              } catch (e) {
                controller.error(e);
              }
            },
          });
          return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Provider": "groq" } });
        }

        const { content: reply } = await groqChatCompletion({
          messages,
          temperature: 0.8,
          max_tokens: 500,
        });
        return Response.json({ reply, character: charDef.id, provider: "groq" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("429")) return Response.json({ error: "AI şu an çok meşgul, biraz sonra tekrar dene" }, { status: 429 });
      }
    }

    const reply = localRoleplayReply(charDef.id, message, false);
    return Response.json({ reply, character: charDef.id, provider: "local" });
  } catch (err) {
    return handleApiError(err);
  }
}
