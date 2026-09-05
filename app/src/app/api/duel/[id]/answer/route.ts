import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { duels, duelAnswers, users, notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  questionIndex: z.number().int().min(0).max(20),
  answer: z.string().min(1).max(500),
  timeTaken: z.number().int().min(0).max(20),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const duelId = Number(id);
    if (!duelId) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const duel = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
    if (!duel[0]) return Response.json({ error: "Düello bulunamadı" }, { status: 404 });
    if (duel[0].challengerId !== user.id && duel[0].opponentId !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (duel[0].status !== "active") return Response.json({ error: "Düello aktif değil" }, { status: 400 });

    const questions = (duel[0].questionsJson as any[]) || [];
    const q = questions[parsed.data.questionIndex];
    if (!q) return Response.json({ error: "Soru bulunamadı" }, { status: 404 });

    const isCorrect = Number(parsed.data.answer) === q.correct || parsed.data.answer === q.options?.[q.correct];
    let points = 0;
    if (isCorrect) {
      if (parsed.data.timeTaken <= 5) points = 100;
      else if (parsed.data.timeTaken <= 10) points = 75;
      else points = 50;
    }

    // Check if already answered
    const existing = await db.select().from(duelAnswers).where(and(eq(duelAnswers.duelId, duelId), eq(duelAnswers.userId, user.id), eq(duelAnswers.questionIndex, parsed.data.questionIndex))).limit(1);
    if (existing[0]) return Response.json({ error: "Zaten cevapladın" }, { status: 400 });

    await db.insert(duelAnswers).values({
      duelId,
      userId: user.id,
      questionIndex: parsed.data.questionIndex,
      answer: parsed.data.answer,
      isCorrect,
      timeTaken: parsed.data.timeTaken,
      pointsEarned: points,
    });

    // Update score
    const isChallenger = duel[0].challengerId === user.id;
    if (isChallenger) {
      await db.update(duels).set({ challengerScore: duel[0].challengerScore + points, currentQuestion: Math.max(duel[0].currentQuestion, parsed.data.questionIndex + 1) }).where(eq(duels.id, duelId));
    } else {
      await db.update(duels).set({ opponentScore: duel[0].opponentScore + points, currentQuestion: Math.max(duel[0].currentQuestion, parsed.data.questionIndex + 1) }).where(eq(duels.id, duelId));
    }

    // Check if duel finished (both answered 10 questions)
    const allAnswers = await db.select().from(duelAnswers).where(eq(duelAnswers.duelId, duelId));
    const challengerAnswers = allAnswers.filter((a) => a.userId === duel[0].challengerId).length;
    const opponentAnswers = allAnswers.filter((a) => a.userId === duel[0].opponentId).length;

    if (challengerAnswers >= 10 && opponentAnswers >= 10) {
      const updated = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
      const d = updated[0];
      let winnerId = null;
      if (d.challengerScore > d.opponentScore) winnerId = d.challengerId;
      else if (d.opponentScore > d.challengerScore) winnerId = d.opponentId;

      await db.update(duels).set({ status: "finished", winnerId, finishedAt: new Date() }).where(eq(duels.id, duelId));

      // XP rewards
      try {
        if (winnerId) {
          const winner = await db.select().from(users).where(eq(users.id, winnerId)).limit(1);
          if (winner[0]) await db.update(users).set({ xp: winner[0].xp + 50 }).where(eq(users.id, winnerId));
          const loserId = winnerId === d.challengerId ? d.opponentId : d.challengerId;
          const loser = await db.select().from(users).where(eq(users.id, loserId)).limit(1);
          if (loser[0]) await db.update(users).set({ xp: loser[0].xp + 20 }).where(eq(users.id, loserId));
        }
        // Notifications
        await db.insert(notifications).values({
          userId: d.challengerId,
          type: "duel_result",
          title: "Düello sonuçlandı!",
          message: winnerId === d.challengerId ? "Kazandın! +50 XP 🎉" : winnerId ? "Kaybettin ama +20 XP kazandın!" : "Berabere!",
          data: { duelId },
        });
        await db.insert(notifications).values({
          userId: d.opponentId,
          type: "duel_result",
          title: "Düello sonuçlandı!",
          message: winnerId === d.opponentId ? "Kazandın! +50 XP 🎉" : winnerId ? "Kaybettin ama +20 XP kazandın!" : "Berabere!",
          data: { duelId },
        });
      } catch {}
    }

    return Response.json({ correct: isCorrect, points, isCorrectAnswer: q.correct });
  } catch (err) {
    return handleApiError(err);
  }
}
