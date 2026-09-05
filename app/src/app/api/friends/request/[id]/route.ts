import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { friendships, notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ action: z.enum(["accept", "reject"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const fid = Number(id);
    if (!fid) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const friendship = await db.select().from(friendships).where(eq(friendships.id, fid)).limit(1);
    if (!friendship[0]) return Response.json({ error: "İstek bulunamadı" }, { status: 404 });
    if (friendship[0].friendId !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (friendship[0].status !== "pending") return Response.json({ error: "Zaten işlenmiş" }, { status: 400 });

    if (parsed.data.action === "accept") {
      await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, fid));
      // Create reciprocal? No, single row is enough but we create notification for requester
      try {
        await db.insert(notifications).values({
          userId: friendship[0].userId,
          type: "friend_request",
          title: "İstek kabul edildi!",
          message: `${user.fullName} arkadaşlık isteğini kabul etti!`,
          data: { friendId: user.id },
        });
      } catch {}
      return Response.json({ status: "accepted" });
    } else {
      await db.delete(friendships).where(eq(friendships.id, fid));
      return Response.json({ status: "rejected" });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
