import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, userLanguages, users } from "@/db/schema";
import { ApiError, getCurrentUser, handleApiError, publicUser } from "@/lib/auth";
import { weekStartStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const langs = await db.select().from(userLanguages).where(eq(userLanguages.userId, user.id));
    const league = (await db.select().from(leagues).where(eq(leagues.weekStart, weekStartStr())).limit(200)).find((l) => l.userId === user.id) ?? null;
    return Response.json({ user: publicUser(user), languages: langs, league });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as { fullName?: string; username?: string; dailyGoal?: number };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.fullName === "string" && body.fullName.trim().length >= 3) updates.fullName = body.fullName.trim();
    if (typeof body.username === "string" && body.username.trim().length >= 3) updates.username = body.username.trim().toLowerCase();
    if (typeof body.dailyGoal === "number" && body.dailyGoal >= 5 && body.dailyGoal <= 60) updates.dailyGoal = body.dailyGoal;

    if (Object.keys(updates).length === 1) throw new ApiError(400, "Güncellenecek alan yok.");
    const rows = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();
    return Response.json({ user: publicUser(rows[0]) });
  } catch (err) {
    return handleApiError(err);
  }
}
