import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, userLessons, userVocabulary } from "@/db/schema";
import { getCurrentUser, handleApiError } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const total = (await db.select({ c: count() }).from(lessons))[0].c;
    const done = (await db.select({ c: count() }).from(userLessons).where(and(eq(userLessons.userId, user.id), eq(userLessons.completed, true))))[0].c;
    const words = (await db.select({ c: count() }).from(userVocabulary).where(eq(userVocabulary.userId, user.id)))[0].c;
    return Response.json({ totalLessons: total, completedLessons: done, wordsLearned: words, pct: total === 0 ? 0 : Math.round((done / total) * 100) });
  } catch (err) {
    return handleApiError(err);
  }
}
