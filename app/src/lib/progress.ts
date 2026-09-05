import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  achievements,
  dailyActivity,
  friendships,
  leagues,
  tasks,
  userAchievements,
  userLessons,
  userTasks,
  userVocabulary,
  users,
} from "@/db/schema";
import { levelFromXp, todayStr, weekStartStr, yesterdayStr, nextReviewDate } from "./rules";
import type { DbUser } from "./auth";

/* ─────────────────────────── XP + SEVİYE ─────────────────────────── */

export async function addXp(userId: number, amount: number) {
  const rows = await db.select({ xp: users.xp, level: users.level }).from(users).where(eq(users.id, userId)).limit(1);
  const before = rows[0];
  if (!before) return { levelBefore: 1, levelAfter: 1, totalXp: 0 };
  const newXp = before.xp + amount;
  const newLevel = levelFromXp(newXp);
  await db.update(users).set({ xp: newXp, level: newLevel, updatedAt: new Date() }).where(eq(users.id, userId));
  return { levelBefore: before.level, levelAfter: newLevel, totalXp: newXp };
}

/* ───────────────────────────── SERİ ──────────────────────────────── */

export async function applyStreak(user: DbUser): Promise<{ streak: number; freezeUsed: boolean }> {
  const today = todayStr();
  if (user.lastActivity === today) return { streak: user.streak, freezeUsed: false };

  let streak: number;
  let freezeUsed = false;
  if (user.lastActivity === yesterdayStr()) {
    streak = user.streak + 1;
  } else {
    // Bir gün boşluk varsa dondurucu devreye girer
    const gapDate = new Date();
    gapDate.setDate(gapDate.getDate() - 2);
    const twoDaysAgo = `${gapDate.getFullYear()}-${String(gapDate.getMonth() + 1).padStart(2, "0")}-${String(gapDate.getDate()).padStart(2, "0")}`;
    if (user.lastActivity === twoDaysAgo && user.streakFreeze > 0 && user.streak > 0) {
      streak = user.streak + 1;
      freezeUsed = true;
      await db.update(users).set({ streakFreeze: user.streakFreeze - 1 }).where(eq(users.id, user.id));
    } else {
      streak = 1;
    }
  }
  await db
    .update(users)
    .set({ streak, longestStreak: Math.max(user.longestStreak, streak), lastActivity: today })
    .where(eq(users.id, user.id));
  return { streak, freezeUsed };
}

/* ──────────────────────── GÜNLÜK AKTİVİTE ────────────────────────── */

export async function touchDailyActivity(
  userId: number,
  delta: { xp?: number; minutes?: number; lessons?: number; words?: number }
) {
  const date = todayStr();
  const rows = await db.select().from(dailyActivity).where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, date))).limit(1);
  if (rows.length === 0) {
    await db.insert(dailyActivity).values({
      userId,
      date,
      xpEarned: delta.xp ?? 0,
      minutesSpent: delta.minutes ?? 0,
      lessonsCompleted: delta.lessons ?? 0,
      wordsReviewed: delta.words ?? 0,
    });
  } else {
    await db
      .update(dailyActivity)
      .set({
        xpEarned: rows[0].xpEarned + (delta.xp ?? 0),
        minutesSpent: rows[0].minutesSpent + (delta.minutes ?? 0),
        lessonsCompleted: rows[0].lessonsCompleted + (delta.lessons ?? 0),
        wordsReviewed: rows[0].wordsReviewed + (delta.words ?? 0),
      })
      .where(eq(dailyActivity.id, rows[0].id));
  }
}

/* ───────────────────────────── LİG ───────────────────────────────── */

export async function bumpLeague(userId: number, xpAmount: number, leagueType = "altin") {
  const week = weekStartStr();
  const rows = await db.select().from(leagues).where(and(eq(leagues.userId, userId), eq(leagues.weekStart, week))).limit(1);
  if (rows.length === 0) {
    await db.insert(leagues).values({ userId, leagueType, weeklyXp: xpAmount, rank: 0, weekStart: week });
  } else {
    await db.update(leagues).set({ weeklyXp: rows[0].weeklyXp + xpAmount }).where(eq(leagues.id, rows[0].id));
  }
}

/* ──────────────────────── GÖREV TAMAMLAMA ────────────────────────── */

export async function completeTaskByTitle(userId: number, titleMatch: string): Promise<number> {
  const date = todayStr();
  const taskRows = await db.select().from(tasks);
  let xp = 0;
  for (const t of taskRows) {
    if (!t.title.toLowerCase().includes(titleMatch.toLowerCase())) continue;
    const existing = await db.select().from(userTasks).where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, t.id), eq(userTasks.date, date))).limit(1);
    if (existing.length > 0 && existing[0].completed) continue;
    if (existing.length > 0) {
      await db.update(userTasks).set({ completed: true }).where(eq(userTasks.id, existing[0].id));
    } else {
      await db.insert(userTasks).values({ userId, taskId: t.id, date, completed: true });
    }
    xp += t.xp;
  }
  return xp;
}

/* ─────────────────────── KELİME ÖĞRENME ──────────────────────────── */

export async function learnWords(userId: number, vocabIds: number[]) {
  for (const vid of vocabIds) {
    const existing = await db
      .select()
      .from(userVocabulary)
      .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.vocabularyId, vid)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(userVocabulary).values({
        userId,
        vocabularyId: vid,
        strength: 0,
        nextReview: nextReviewDate(1), // ilk tekrar: 1 gün sonra
      });
    }
  }
}

/* ─────────────────────── BAŞARI MOTORU ───────────────────────────── */

export async function checkAchievements(userId: number): Promise<Array<{ id: number; name: string; icon: string; description: string; xpReward: number; coinReward: number }>> {
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return [];

  const lessonsDone = (await db.select({ c: count() }).from(userLessons).where(and(eq(userLessons.userId, userId), eq(userLessons.completed, true))))[0].c;
  const perfectLessons = (await db.select({ c: count() }).from(userLessons).where(and(eq(userLessons.userId, userId), eq(userLessons.completed, true), eq(userLessons.mistakes, 0))))[0].c;
  const wordsKnown = (await db.select({ c: count() }).from(userVocabulary).where(eq(userVocabulary.userId, userId)))[0].c;
  const friendCount = (await db.select({ c: count() }).from(friendships).where(eq(friendships.userId, userId)))[0].c;

  const all = await db.select().from(achievements);
  const earnedRows = await db.select({ achievementId: userAchievements.achievementId }).from(userAchievements).where(eq(userAchievements.userId, userId));
  const earned = new Set(earnedRows.map((r) => r.achievementId));

  const progressFor = (a: (typeof all)[number]): number | null => {
    switch (a.requirementType) {
      case "lessons":
        return lessonsDone >= a.requirementValue ? 1 : 0;
      case "perfect":
        return perfectLessons >= a.requirementValue ? 1 : 0;
      case "words":
        return wordsKnown >= a.requirementValue ? 1 : 0;
      case "streak":
        return user.streak >= a.requirementValue ? 1 : 0;
      case "games":
        return user.gamesPlayed >= a.requirementValue ? 1 : 0;
      case "boss":
        return user.bossKills >= a.requirementValue ? 1 : 0;
      case "friends":
        return friendCount >= a.requirementValue ? 1 : 0;
      case "xp":
        return user.xp >= a.requirementValue ? 1 : 0;
      default:
        return null; // özel rozetler olay anında verilir
    }
  };

  const newly: Array<{ id: number; name: string; icon: string; description: string; xpReward: number; coinReward: number }> = [];
  for (const a of all) {
    if (earned.has(a.id)) continue;
    const ok = progressFor(a);
    if (ok === null || ok === 0) continue;
    await db.insert(userAchievements).values({ userId, achievementId: a.id });
    if (a.xpReward > 0) await addXp(userId, a.xpReward);
    if (a.coinReward > 0) await db.update(users).set({ coins: sql`${users.coins} + ${a.coinReward}` }).where(eq(users.id, userId));
    newly.push({ id: a.id, name: a.name, icon: a.icon, description: a.description, xpReward: a.xpReward, coinReward: a.coinReward });
  }
  return newly;
}

/** Gece kuşu / erken kuş / hız gibi olay bazlı rozetleri isimle verir. */
export async function grantSpecialAchievement(userId: number, name: string) {
  const rows = await db.select().from(achievements).where(eq(achievements.name, name)).limit(1);
  if (rows.length === 0) return null;
  const a = rows[0];
  const earned = await db.select().from(userAchievements).where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, a.id))).limit(1);
  if (earned.length > 0) return null;
  await db.insert(userAchievements).values({ userId, achievementId: a.id });
  if (a.xpReward > 0) await addXp(userId, a.xpReward);
  return { id: a.id, name: a.name, icon: a.icon, description: a.description, xpReward: a.xpReward, coinReward: a.coinReward };
}

/* ─────────────────── LİG SIRALAMASI GÜNCELLE ─────────────────────── */

export async function recalcLeagueRanks(week: string) {
  const rows = await db.select().from(leagues).where(eq(leagues.weekStart, week)).orderBy(sql`${leagues.weeklyXp} desc`);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].rank !== i + 1) {
      await db.update(leagues).set({ rank: i + 1 }).where(eq(leagues.id, rows[i].id));
    }
  }
}

/* ───────────────────── DERS KİLİT AÇMA YARDIMCISI ────────────────── */

export function isLessonUnlocked(unit: number, lesson: number, completedSet: Set<string>) {
  if (unit === 1 && lesson === 1) return true;
  const prev = lesson > 1 ? `${unit}-${lesson - 1}` : `${unit - 1}-5`;
  return completedSet.has(prev);
}

export { gte, lte };
