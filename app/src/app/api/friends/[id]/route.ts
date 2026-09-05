import { eq, or, and } from "drizzle-orm";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const fid = Number(id);
    if (!fid) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    // fid is friendship id OR friend user id? Spec says DELETE /api/friends/[id] - arkadaşı sil. We'll support both: if friendship id exists, delete, else delete by friendId
    const existing = await db.select().from(friendships).where(eq(friendships.id, fid)).limit(1);
    if (existing[0]) {
      if (existing[0].userId !== user.id && existing[0].friendId !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
      await db.delete(friendships).where(eq(friendships.id, fid));
      return Response.json({ ok: true });
    }

    // Try by friend user id
    await db.delete(friendships).where(or(and(eq(friendships.userId, user.id), eq(friendships.friendId, fid)), and(eq(friendships.userId, fid), eq(friendships.friendId, user.id))));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
