import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { recalcLeagueRanks } from "@/lib/progress";
import { weekStartStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await requireUser();
    const week = weekStartStr();
    await recalcLeagueRanks(week);

    const rows = await db
      .select({
        rank: leagues.rank,
        weeklyXp: leagues.weeklyXp,
        leagueType: leagues.leagueType,
        userId: users.id,
        name: users.fullName,
        username: users.username,
        streak: users.streak,
      })
      .from(leagues)
      .innerJoin(users, eq(leagues.userId, users.id))
      .where(eq(leagues.weekStart, week))
      .orderBy(desc(leagues.weeklyXp))
      .limit(50);

    return Response.json({ week, rows: rows.map((r, i) => ({ ...r, rank: i + 1, you: r.userId === user.id })) });
  } catch (err) {
    return handleApiError(err);
  }
}
