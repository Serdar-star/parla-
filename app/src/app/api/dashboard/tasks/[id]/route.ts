import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, userTasks } from "@/db/schema";
import { ApiError, handleApiError, requireUser } from "@/lib/auth";
import { addXp, bumpLeague } from "@/lib/progress";
import { todayStr } from "@/lib/rules";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const taskId = Number(id);

    const taskRows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (taskRows.length === 0) throw new ApiError(404, "Görev bulunamadı.");
    const task = taskRows[0];
    const date = todayStr();

    const existing = await db.select().from(userTasks).where(and(eq(userTasks.userId, user.id), eq(userTasks.taskId, taskId), eq(userTasks.date, date))).limit(1);
    if (existing.length > 0 && existing[0].completed) {
      return Response.json({ ok: true, already: true, xpGained: 0 });
    }
    if (existing.length > 0) {
      await db.update(userTasks).set({ completed: true }).where(eq(userTasks.id, existing[0].id));
    } else {
      await db.insert(userTasks).values({ userId: user.id, taskId, date, completed: true });
    }
    const xpInfo = await addXp(user.id, task.xp);
    await bumpLeague(user.id, task.xp);
    return Response.json({ ok: true, xpGained: task.xp, totalXp: xpInfo.totalXp, levelAfter: xpInfo.levelAfter });
  } catch (err) {
    return handleApiError(err);
  }
}
