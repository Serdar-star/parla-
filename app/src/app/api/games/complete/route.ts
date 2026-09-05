import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { addXp, bumpLeague, checkAchievements, touchDailyActivity } from "@/lib/progress";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { game?: string; score?: number; xp?: number; won?: boolean };
    const game = body.game ?? "hunt";
    const score = Math.max(0, Math.min(9999, Number(body.score ?? 0)));
    const xp = Math.max(0, Math.min(200, Number(body.xp ?? 10)));
    const won = Boolean(body.won);

    await db.update(users).set({ gamesPlayed: sql`${users.gamesPlayed} + 1`, bossKills: game === "boss" && won ? sql`${users.bossKills} + 1` : users.bossKills }).where(sql`${users.id} = ${user.id}`);

    const xpInfo = await addXp(user.id, xp);
    await bumpLeague(user.id, xp);
    await touchDailyActivity(user.id, { xp, minutes: 2 });

    const newAchievements = await checkAchievements(user.id);
    return Response.json({ game, score, xpGained: xp, totalXp: xpInfo.totalXp, levelBefore: xpInfo.levelBefore, levelAfter: xpInfo.levelAfter, newAchievements });
  } catch (err) {
    return handleApiError(err);
  }
}
