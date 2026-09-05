import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { achievements, userAchievements } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const earned = await db
      .select({ achievement: achievements, earnedAt: userAchievements.earnedAt })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, user.id))
      .orderBy(asc(userAchievements.earnedAt));
    return Response.json({ earned });
  } catch (err) {
    return handleApiError(err);
  }
}
