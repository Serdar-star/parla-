import { eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, notifications, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ friendId: z.number().int().positive() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });
    const { friendId } = parsed.data;

    if (friendId === user.id) return Response.json({ error: "Kendine istek gönderemezsin" }, { status: 400 });

    // Check if already exists
    const existing = await db.select().from(friendships).where(or(and(eq(friendships.userId, user.id), eq(friendships.friendId, friendId)), and(eq(friendships.userId, friendId), eq(friendships.friendId, user.id)))).limit(1);
    if (existing[0]) {
      if (existing[0].status === "pending") return Response.json({ error: "Zaten istek gönderilmiş" }, { status: 400 });
      if (existing[0].status === "accepted") return Response.json({ error: "Zaten arkadaşsınız" }, { status: 400 });
    }

    const inserted = await db.insert(friendships).values({ userId: user.id, friendId, status: "pending" }).returning();

    // Create notification for friend
    try {
      await db.insert(notifications).values({
        userId: friendId,
        type: "friend_request",
        title: "Arkadaşlık isteği",
        message: `${user.fullName} sana arkadaşlık isteği gönderdi!`,
        data: { fromUserId: user.id, friendshipId: inserted[0].id },
      });
    } catch {}

    return Response.json({ friendship: inserted[0] });
  } catch (err) {
    return handleApiError(err);
  }
}
