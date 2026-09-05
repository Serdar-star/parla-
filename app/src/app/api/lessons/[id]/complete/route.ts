import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, userLanguages, userLessons } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { starsFor } from "@/lib/rules";
import { addXp, applyStreak, bumpLeague, checkAchievements, completeTaskByTitle, grantSpecialAchievement, learnWords, touchDailyActivity } from "@/lib/progress";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const lessonId = Number(id);

    const body = (await req.json().catch(() => ({}))) as { correct?: number; wrong?: number; timeSpent?: number };
    const correct = Math.max(0, Math.min(100, Number(body.correct ?? 0)));
    const wrong = Math.max(0, Math.min(100, Number(body.wrong ?? 0)));
    const timeSpent = Math.max(0, Math.min(3600, Number(body.timeSpent ?? 0)));

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (lessonRows.length === 0) return Response.json({ error: "Ders bulunamadı." }, { status: 404 });
    const lesson = lessonRows[0];

    /* ── XP hesaplama ── */
    const stars = starsFor(wrong);
    let xpGained = correct * 5 + Math.round(lesson.xpReward * (stars / 3));
    if (wrong === 0) xpGained += 20; // hatasız bonusu

    /* ── Seri güncelle ── */
    const streakInfo = await applyStreak(user);

    /* ── Ders kaydını oluştur/güncelle ── */
    const existing = await db.select().from(userLessons).where(eq(userLessons.userId, user.id)).limit(500);
    const mine = existing.find((r) => r.lessonId === lessonId);
    if (mine) {
      await db
        .update(userLessons)
        .set({ completed: true, score: stars, xpEarned: mine.xpEarned + xpGained, mistakes: wrong, timeSpent, completedAt: new Date() })
        .where(eq(userLessons.id, mine.id));
    } else {
      await db.insert(userLessons).values({ userId: user.id, lessonId, completed: true, score: stars, xpEarned: xpGained, mistakes: wrong, timeSpent, completedAt: new Date() });
    }

    /* ── XP uygula + seviye kontrolü ── */
    const xpInfo = await addXp(user.id, xpGained);

    /* ── Günlük aktivite + lig ── */
    await touchDailyActivity(user.id, { xp: xpGained, minutes: Math.max(1, Math.round(timeSpent / 60)), lessons: 1 });
    await bumpLeague(user.id, xpGained);

    /* ── Kelimeleri öğren ── */
    type QWord = { word?: { id?: number } };
    const content = (lesson.content ?? []) as Array<QWord>;
    const vocabIds = [...new Set(content.map((q) => q.word?.id).filter((v): v is number => typeof v === "number"))];
    if (vocabIds.length > 0) await learnWords(user.id, vocabIds);
    const langRows = await db.select().from(userLanguages).where(eq(userLanguages.userId, user.id)).limit(5);
    if (langRows.length > 0) {
      await db
        .update(userLanguages)
        .set({ lessonsCompleted: langRows[0].lessonsCompleted + 1, totalXp: langRows[0].totalXp + xpGained, wordsLearned: langRows[0].wordsLearned + Math.min(vocabIds.length, 4) })
        .where(eq(userLanguages.id, langRows[0].id));
    }

    /* ── Görev + özel rozetler ── */
    const taskXp = await completeTaskByTitle(user.id, "ders tamamla");
    if (taskXp > 0) await addXp(user.id, taskXp);

    const newAchievements: Array<{ id: number; name: string; icon: string; description: string }> = [];
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) {
      const a = await grantSpecialAchievement(user.id, "Gece Kuşu");
      if (a) newAchievements.push(a);
    }
    if (hour >= 4 && hour < 6) {
      const a = await grantSpecialAchievement(user.id, "Erken Kuş");
      if (a) newAchievements.push(a);
    }
    if (timeSpent > 0 && timeSpent <= 180) {
      const a = await grantSpecialAchievement(user.id, "Hız Ustası");
      if (a) newAchievements.push(a);
    }
    const earned = await checkAchievements(user.id);
    newAchievements.push(...earned);

    return Response.json({
      stars,
      xpGained: xpGained + taskXp,
      totalXp: xpInfo.totalXp,
      levelBefore: xpInfo.levelBefore,
      levelAfter: xpInfo.levelAfter,
      streak: streakInfo.streak,
      freezeUsed: streakInfo.freezeUsed,
      wordsLearned: vocabIds.length,
      newAchievements,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
