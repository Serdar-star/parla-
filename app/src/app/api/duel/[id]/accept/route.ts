import { eq } from "drizzle-orm";
import { db } from "@/db";
import { duels, notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ action: z.enum(["accept", "reject"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const duelId = Number(id);
    if (!duelId) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const duel = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
    if (!duel[0]) return Response.json({ error: "Düello bulunamadı" }, { status: 404 });
    if (duel[0].opponentId !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (duel[0].status !== "pending") return Response.json({ error: "Zaten işlenmiş" }, { status: 400 });

    if (parsed.data.action === "accept") {
      await db.update(duels).set({ status: "active", startedAt: new Date() }).where(eq(duels.id, duelId));
      try {
        await db.insert(notifications).values({
          userId: duel[0].challengerId,
          type: "duel_invite",
          title: "Düello kabul edildi!",
          message: `Rakibin düelloyu kabul etti! Savaş başlasın!`,
          data: { duelId },
        });
      } catch {}
      return Response.json({ status: "active" });
    } else {
      await db.update(duels).set({ status: "declined", finishedAt: new Date() }).where(eq(duels.id, duelId));
      return Response.json({ status: "declined" });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
