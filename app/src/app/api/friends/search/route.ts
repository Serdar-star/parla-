import { like, or, eq, and, not } from "drizzle-orm";
import { db } from "@/db";
import { users, friendships } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ q: z.string().min(1).max(100) });

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const parsed = schema.safeParse({ q });
    if (!parsed.success) return Response.json({ error: "Geçersiz arama" }, { status: 400 });

    const term = `%${q}%`;

    // Search users by username, fullName, email
    const results = await db
      .select()
      .from(users)
      .where(and(or(like(users.username, term), like(users.fullName, term), like(users.email, term)), not(eq(users.id, user.id))))
      .limit(20);

    // Filter out already friends or pending?
    // For simplicity, include status if exists
    const enriched = await Promise.all(
      results.map(async (u) => {
        let friendshipStatus: string | null = null;
        try {
          const f = await db.select().from(friendships).where(or(and(eq(friendships.userId, user.id), eq(friendships.friendId, u.id)), and(eq(friendships.userId, u.id), eq(friendships.friendId, user.id)))).limit(1);
          if (f[0]) friendshipStatus = f[0].status;
        } catch {}
        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          avatarUrl: u.avatarUrl,
          level: u.level,
          currentLanguage: u.currentLanguage,
          friendshipStatus,
        };
      })
    );

    return Response.json({ users: enriched });
  } catch (err) {
    return handleApiError(err);
  }
}
