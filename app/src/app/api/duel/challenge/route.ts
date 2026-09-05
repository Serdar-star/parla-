import { eq } from "drizzle-orm";
import { db } from "@/db";
import { duels, vocabulary, notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ opponentId: z.number().int().positive() });

function generateDuelQuestions(count = 10) {
  // Mock questions from vocab or general
  const qs = [];
  for (let i = 0; i < count; i++) {
    qs.push({
      id: i,
      question: `Kelime ${i + 1}: "Book" kelimesinin Türkçe karşılığı nedir?`,
      options: ["Kitap", "Defter", "Kalem", "Masa"],
      correct: 0,
    });
  }
  return qs;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const { opponentId } = parsed.data;
    if (opponentId === user.id) return Response.json({ error: "Kendinle düello yapamazsın" }, { status: 400 });

    const questions = generateDuelQuestions(10);

    const inserted = await db.insert(duels).values({
      challengerId: user.id,
      opponentId,
      status: "pending",
      questionsJson: questions,
      currentQuestion: 0,
    }).returning();

    try {
      await db.insert(notifications).values({
        userId: opponentId,
        type: "duel_invite",
        title: "Düelloya davet edildin! ⚔️",
        message: `${user.fullName} seni düelloya davet etti!`,
        data: { duelId: inserted[0].id, challengerId: user.id },
      });
    } catch {}

    return Response.json({ duel: inserted[0] });
  } catch (err) {
    return handleApiError(err);
  }
}
