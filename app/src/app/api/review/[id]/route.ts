import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyActivity, userVocabulary, vocabulary } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { nextReviewDate } from "@/lib/rules";
import { addXp, bumpLeague, completeTaskByTitle, touchDailyActivity } from "@/lib/progress";

/** Kelime tekrar sonucu: grade = again | hard | good */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const vocabId = Number(id);

    const body = (await req.json().catch(() => ({}))) as { grade?: string };
    const grade = body.grade;
    if (!["again", "hard", "good"].includes(grade ?? "")) {
      return Response.json({ error: "Geçersiz değerlendirme." }, { status: 400 });
    }

    const vocabRows = await db.select().from(vocabulary).where(eq(vocabulary.id, vocabId)).limit(1);
    if (vocabRows.length === 0) return Response.json({ error: "Kelime bulunamadı." }, { status: 404 });

    const existing = await db
      .select()
      .from(userVocabulary)
      .where(and(eq(userVocabulary.userId, user.id), eq(userVocabulary.vocabularyId, vocabId)))
      .limit(1);

    let strength: number;
    let xp: number;
    if (grade === "good") {
      strength = Math.min(5, (existing[0]?.strength ?? 0) + 1);
      xp = 2;
    } else if (grade === "hard") {
      strength = Math.max(0, existing[0]?.strength ?? 0);
      xp = 1;
    } else {
      strength = 0;
      xp = 0;
    }
    const next = nextReviewDate(grade === "again" ? 0 : strength);

    if (existing.length > 0) {
      await db
        .update(userVocabulary)
        .set({
          strength,
          timesReviewed: existing[0].timesReviewed + 1,
          timesCorrect: existing[0].timesCorrect + (grade === "good" ? 1 : 0),
          nextReview: next,
          lastReviewed: new Date(),
        })
        .where(eq(userVocabulary.id, existing[0].id));
    } else {
      await db.insert(userVocabulary).values({
        userId: user.id,
        vocabularyId: vocabId,
        strength,
        timesReviewed: 1,
        timesCorrect: grade === "good" ? 1 : 0,
        nextReview: next,
        lastReviewed: new Date(),
      });
    }

    if (xp > 0) {
      await addXp(user.id, xp);
      await bumpLeague(user.id, xp);
    }
    await touchDailyActivity(user.id, { words: 1, xp });

    // "5 kelime tekrar et" görevini bugün 5+ olduysa tamamla
    let taskXp = 0;
    const today = new Date().toISOString().slice(0, 10);
    const act = await db.select().from(dailyActivity).where(and(eq(dailyActivity.userId, user.id), eq(dailyActivity.date, today))).limit(1);
    if (act.length > 0 && act[0].wordsReviewed >= 5) {
      taskXp = await completeTaskByTitle(user.id, "kelime tekrar");
      if (taskXp > 0) await addXp(user.id, taskXp);
    }

    return Response.json({ strength, nextReview: next.toISOString(), xpGained: xp + taskXp });
  } catch (err) {
    return handleApiError(err);
  }
}
