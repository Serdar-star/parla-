import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const nid = Number(id);
    if (!nid) return Response.json({ error: "Geçersiz id" }, { status: 400 });
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, nid), eq(notifications.userId, user.id)));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
