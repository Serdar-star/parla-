import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { dailyActivity } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { todayStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await requireUser();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const rows = await db
      .select()
      .from(dailyActivity)
      .where(and(eq(dailyActivity.userId, user.id), gte(dailyActivity.date, todayStr(weekAgo))));
    return Response.json({ days: rows.map((r) => ({ date: r.date, xp: r.xpEarned, minutes: r.minutesSpent, lessons: r.lessonsCompleted })) });
  } catch (err) {
    return handleApiError(err);
  }
}
