import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handleApiError, requireUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
    const current = body.current ?? "";
    const next = body.next ?? "";

    if (!bcrypt.compareSync(current, user.passwordHash)) throw new ApiError(401, "Mevcut şifre hatalı.");
    if (next.length < 6) throw new ApiError(400, "Yeni şifre en az 6 karakter olmalı.");

    await db.update(users).set({ passwordHash: bcrypt.hashSync(next, 10), updatedAt: new Date() }).where(eq(users.id, user.id));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
