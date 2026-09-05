import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db";
import { aiConversations } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

const MODES: Record<string, string> = {
  serbest: "Serbest sohbet modu: Kullanıcıyla günlük konularda İngilizce sohbet et.",
  gramer: "Gramer modu: Kullanıcının gramer sorularını basit ve net açıkla, örnek cümle ver.",
  kelime: "Kelime modu: Kullanıcıya yeni İngilizce kelimeler öğret, örneklerle pekiştir.",
  ceviri: "Çeviri modu: Kullanıcının Türkçe cümlelerini doğal İngilizceye çevir ve açıkla.",
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
    const body = (await req.json().catch(() => ({}))) as { message?: string; mode?: string };
    const message = body.message?.trim();
    const mode = body.mode ?? "serbest";
    if (!message) return Response.json({ error: "Mesaj boş olamaz." }, { status: 400 });

    await db.insert(aiConversations).values({ userId: user.id, languageCode: "en", role: "user", content: message });

    let reply = "";
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const history = await db
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.userId, user.id))
          .orderBy(aiConversations.id)
          .limit(12);
        const prompt = [
          "Sen Parla adlı dil öğrenme uygulamasının sabırlı ve motive edici İngilizce öğretmeni 'Lumen'sin.",
          "Kullanıcı Türkçe konuşan bir A2 seviye öğrenci. Görevin: seviyeye uygun konuşmak, hataları nazikçe düzeltip nedenini açıklamak, grameri basit anlatmak, kullanıcıyı İngilizce konuşturmak.",
          MODES[mode] ?? MODES.serbest,
          "Kurallar: Kısa ve samimi ol (2-4 cümle). Varsa kullanıcının hatasını düzelt. Her mesajın SONUNDA kullanıcıyı konuşturacak bir soru sor. Türkçe ve İngilizceyi harmanlayabilirsin.",
          "Önceki konuşma:",
          ...history.slice(0, -1).map((h) => `${h.role === "user" ? "Öğrenci" : "Lumen"}: ${h.content}`),
          `Öğrenci: ${message}`,
          "Lumen:",
        ].join("\n");
        const result = await model.generateContent(prompt);
        reply = result.response.text().trim();
      } catch {
        reply = fallbackReply(message, mode);
      }
    } else {
      // Gemini anahtarı yoksa kural tabanlı öğretmen devreye girer
      await new Promise((r) => setTimeout(r, 400));
      reply = fallbackReply(message, mode);
    }

    await db.insert(aiConversations).values({ userId: user.id, languageCode: "en", role: "assistant", content: reply });
    return Response.json({ reply, mode, usedAI: Boolean(key) });
  } catch (err) {
    return handleApiError(err);
  }
}
