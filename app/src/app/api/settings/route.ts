import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSettings, users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);
    return Response.json({ settings: rows[0] ?? null, dailyGoal: user.dailyGoal });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const allowed: Record<string, unknown> = {};
    const bools = ["soundEffects", "micPermission", "animations", "notifLesson", "notifStreak", "notifLeague"] as const;
    for (const k of bools) if (typeof body[k] === "boolean") allowed[k] = body[k];
    if (typeof body.theme === "string" && ["light", "dark", "system"].includes(body.theme)) allowed.theme = body.theme;
    if (typeof body.notifTime === "string" && /^\d{2}:\d{2}$/.test(body.notifTime)) allowed.notifTime = body.notifTime;

    if (typeof body.dailyGoal === "number" && body.dailyGoal >= 5 && body.dailyGoal <= 60) {
      await db.update(users).set({ dailyGoal: body.dailyGoal }).where(eq(users.id, user.id));
    }

    if (Object.keys(allowed).length > 0) {
      const existing = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(userSettings).set(allowed).where(eq(userSettings.userId, user.id));
      } else {
        await db.insert(userSettings).values({ userId: user.id, ...allowed } as typeof userSettings.$inferInsert);
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
