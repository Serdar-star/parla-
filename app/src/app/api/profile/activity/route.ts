import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyActivity } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

/** Son 180 günün günlük aktivite haritası. */
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, user.id)).orderBy(desc(dailyActivity.date)).limit(200);
    return Response.json({
      activity: rows.map((r) => ({ date: r.date, xp: r.xpEarned, minutes: r.minutesSpent, lessons: r.lessonsCompleted, words: r.wordsReviewed })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
