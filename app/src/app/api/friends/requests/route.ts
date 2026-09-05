import { eq, and, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    // Requests where friendId == user.id and status pending
    const rows = await db.select().from(friendships).where(and(eq(friendships.friendId, user.id), eq(friendships.status, "pending"))).orderBy(desc(friendships.createdAt));

    if (rows.length === 0) return Response.json({ requests: [] });

    const requesterIds = rows.map((r) => r.userId);
    const requesters = await db.select().from(users).where(or(...requesterIds.map((id) => eq(users.id, id))));

    const enriched = rows.map((r) => {
      const u = requesters.find((x) => x.id === r.userId);
      return {
        id: r.id,
        userId: r.userId,
        friendId: r.friendId,
        status: r.status,
        createdAt: r.createdAt,
        user: u ? { id: u.id, username: u.username, fullName: u.fullName, avatarUrl: u.avatarUrl, level: u.level, currentLanguage: u.currentLanguage } : null,
      };
    });

    return Response.json({ requests: enriched });
  } catch (err) {
    return handleApiError(err);
  }
}
