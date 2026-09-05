import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { achievements, dailyActivity, leagues, tasks, userAchievements, userLessons, userTasks, userVocabulary, users } from "@/db/schema";
import { handleApiError, publicUser, requireUser } from "@/lib/auth";
import { addXp, applyStreak, bumpLeague, touchDailyActivity } from "@/lib/progress";
import { todayStr, weekStartStr, yesterdayStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await requireUser();

    // Seri kontrolü (giriş anında)
    const streakInfo = await applyStreak(user);

    // Günlük giriş bonusu: bugün hiç aktivite yoksa +10 XP
    const today = todayStr();
    const todayRows = await db.select().from(dailyActivity).where(and(eq(dailyActivity.userId, user.id), eq(dailyActivity.date, today))).limit(1);
    let loginBonus = 0;
    if (todayRows.length === 0) {
      loginBonus = 10;
      await addXp(user.id, loginBonus);
      await bumpLeague(user.id, loginBonus);
      await touchDailyActivity(user.id, { xp: loginBonus });
    }

    const refreshed = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0];

    // Haftalık XP (son 7 gün)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const sinceDate = todayStr(weekAgo);

    // Birbirinden bağımsız sorgular paralel çalışıyor — eskiden sırayla
    // bekliyorlardı (her biri ayrı bir DB turu).
    const [activity, lessonsDone, words, league, recentAch, allTasks, myTasks] = await Promise.all([
      db.select().from(dailyActivity).where(and(eq(dailyActivity.userId, user.id), gte(dailyActivity.date, sinceDate))),
      db.select({ c: count() }).from(userLessons).where(and(eq(userLessons.userId, user.id), eq(userLessons.completed, true))),
      db.select({ c: count() }).from(userVocabulary).where(eq(userVocabulary.userId, user.id)),
      // userId filtresi SQL'de: eskiden haftanın tüm lig satırları (limit 500)
      // çekilip JS tarafında .find() ile aranıyor.
      db
        .select()
        .from(leagues)
        .where(and(eq(leagues.weekStart, weekStartStr()), eq(leagues.userId, user.id)))
        .limit(1),
      db
        .select({ a: achievements, earnedAt: userAchievements.earnedAt })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, user.id))
        .orderBy(desc(userAchievements.earnedAt))
        .limit(5),
      db.select().from(tasks),
      db.select().from(userTasks).where(and(eq(userTasks.userId, user.id), eq(userTasks.date, today))),
    ]);

    const byDate = new Map(activity.map((a) => [a.date, a]));
    const weekly: { day: string; xp: number; minutes: number }[] = [];
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayStr(d);
      weekly.push({ day: dayNames[d.getDay()], xp: byDate.get(key)?.xpEarned ?? 0, minutes: byDate.get(key)?.minutesSpent ?? 0 });
    }

    // Sayılar (Promise.all sonucundan)
    const lessonsDoneCount = lessonsDone[0].c;
    const wordsCount = words[0].c;
    const myLeague = league[0] ?? null;

    const questStatus = allTasks.map((t) => {
      const mine = myTasks.find((m) => m.taskId === t.id);
      return { id: t.id, title: t.title, icon: t.icon, xp: t.xp, done: mine?.completed ?? false };
    });

    const todayActivity = byDate.get(today);
    void yesterdayStr;
    return Response.json({
      user: publicUser(refreshed),
      loginBonus,
      streak: streakInfo.streak,
      streakFreeze: refreshed.streakFreeze,
      weekly,
      todayMinutes: todayActivity?.minutesSpent ?? 0,
      todayXp: todayActivity?.xpEarned ?? 0,
      lessonsDone: lessonsDoneCount,
      wordsLearned: wordsCount,
      league: myLeague ? { type: myLeague.leagueType, weeklyXp: myLeague.weeklyXp, rank: myLeague.rank } : null,
      recentAchievements: recentAch.map((r) => ({ id: r.a.id, name: r.a.name, icon: r.a.icon, date: r.earnedAt })),
      quests: questStatus,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
