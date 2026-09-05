import { eq } from "drizzle-orm";
import { db } from "@/db";
import { duels, duelAnswers, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const duelId = Number(id);
    if (!duelId) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const duel = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
    if (!duel[0]) return Response.json({ error: "Düello bulunamadı" }, { status: 404 });
    if (duel[0].challengerId !== user.id && duel[0].opponentId !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });

    const answers = await db.select().from(duelAnswers).where(eq(duelAnswers.duelId, duelId));
    const challenger = await db.select().from(users).where(eq(users.id, duel[0].challengerId)).limit(1);
    const opponent = await db.select().from(users).where(eq(users.id, duel[0].opponentId)).limit(1);

    return Response.json({
      duel: duel[0],
      answers,
      challenger: challenger[0] ? { id: challenger[0].id, fullName: challenger[0].fullName, username: challenger[0].username } : null,
      opponent: opponent[0] ? { id: opponent[0].id, fullName: opponent[0].fullName, username: opponent[0].username } : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
