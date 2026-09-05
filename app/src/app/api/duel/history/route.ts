import { eq, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { duels, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(duels).where(or(eq(duels.challengerId, user.id), eq(duels.opponentId, user.id))).orderBy(desc(duels.createdAt)).limit(10);

    const enriched = await Promise.all(
      rows.map(async (d) => {
        const oppId = d.challengerId === user.id ? d.opponentId : d.challengerId;
        const opp = await db.select().from(users).where(eq(users.id, oppId)).limit(1);
        return {
          ...d,
          opponent: opp[0] ? { id: opp[0].id, fullName: opp[0].fullName, username: opp[0].username } : null,
          isWinner: d.winnerId === user.id,
        };
      })
    );

    const wins = enriched.filter((e) => e.isWinner).length;
    const losses = enriched.filter((e) => e.status === "finished" && !e.isWinner && e.winnerId !== null).length;

    return Response.json({ duels: enriched, stats: { wins, losses, total: enriched.length } });
  } catch (err) {
    return handleApiError(err);
  }
}
