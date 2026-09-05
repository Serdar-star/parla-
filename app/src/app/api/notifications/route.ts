import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50);
    const unreadCount = rows.filter((r) => !r.isRead).length;
    return Response.json({ notifications: rows, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}
