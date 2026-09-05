import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, userTasks } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { todayStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await requireUser();
    const allTasks = await db.select().from(tasks);
    const mine = await db.select().from(userTasks).where(and(eq(userTasks.userId, user.id), eq(userTasks.date, todayStr())));
    return Response.json({
      tasks: allTasks.map((t) => ({
        id: t.id,
        title: t.title,
        icon: t.icon,
        xp: t.xp,
        done: mine.some((m) => m.taskId === t.id && m.completed),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
