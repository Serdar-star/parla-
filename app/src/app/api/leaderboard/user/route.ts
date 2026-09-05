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

    const all = await db
      .select()
      .from(leagues)
      .where(eq(leagues.weekStart, week))
      .orderBy(desc(leagues.weeklyXp));
    const idx = all.findIndex((r) => r.userId === user.id);
    const mine = idx >= 0 ? all[idx] : null;

    const userRow = await db.select({ streak: users.streak }).from(users).where(eq(users.id, user.id)).limit(1);
    return Response.json({
      week,
      rank: idx >= 0 ? idx + 1 : null,
      totalPlayers: all.length,
      leagueType: mine?.leagueType ?? "altin",
      weeklyXp: mine?.weeklyXp ?? 0,
      streak: userRow[0]?.streak ?? 0,
      promoted: mine ? idx + 1 <= 10 : false,
      demoted: mine ? idx + 1 > all.length - 5 : false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
