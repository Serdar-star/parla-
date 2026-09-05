import { eq, and, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users, dailyActivity } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    // Get accepted friendships where user is either side
    const rows = await db.select().from(friendships).where(and(or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id)), eq(friendships.status, "accepted"))).orderBy(desc(friendships.createdAt));

    const friendIds = rows.map((r) => (r.userId === user.id ? r.friendId : r.userId));
    if (friendIds.length === 0) return Response.json({ friends: [] });

    const friendUsers = await db.select().from(users).where(or(...friendIds.map((id) => eq(users.id, id))));

    // Enrich with weekly XP and streak
    const enriched = await Promise.all(
      friendUsers.map(async (fu) => {
        let weeklyXp = 0;
        try {
          const acts = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, fu.id));
          weeklyXp = acts.reduce((a, b) => a + (b.xpEarned || 0), 0);
        } catch {}
        return {
          id: fu.id,
          username: fu.username,
          fullName: fu.fullName,
          avatarUrl: fu.avatarUrl,
          level: fu.level,
          xp: fu.xp,
          streak: fu.streak,
          currentLanguage: fu.currentLanguage,
          weeklyXp,
          friendshipId: rows.find((r) => r.userId === fu.id || r.friendId === fu.id)?.id,
        };
      })
    );

    return Response.json({ friends: enriched });
  } catch (err) {
    return handleApiError(err);
  }
}
