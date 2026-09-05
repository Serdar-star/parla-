import { like, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const offset = (page - 1) * limit;

    let rows;
    if (q) {
      const term = `%${q}%`;
      rows = await db
        .select()
        .from(users)
        .where(or(like(users.email, term), like(users.username, term), like(users.fullName, term)))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    }

    const safe = rows.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.fullName,
      level: u.level,
      xp: u.xp,
      streak: u.streak,
      isPremium: u.isPremium,
      isAdmin: u.isAdmin,
      subscriptionPlan: u.subscriptionPlan,
      currentLanguage: u.currentLanguage,
      createdAt: u.createdAt,
    }));

    return Response.json({ users: safe, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}
