import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function PUT() {
  try {
    const user = await requireUser();
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
