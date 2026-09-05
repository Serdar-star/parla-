import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const updateSchema = z.object({
  isPremium: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  subscriptionPlan: z.string().optional(),
  level: z.number().int().min(1).max(100).optional(),
  xp: z.number().int().min(0).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const uid = Number(id);
    if (!uid) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    const data: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.isPremium === true && !parsed.data.subscriptionPlan) {
      data.subscriptionPlan = "premium";
    }
    if (parsed.data.isPremium === false) {
      data.subscriptionPlan = "free";
      data.premiumExpiresAt = null;
    }

    await db.update(users).set(data as any).where(eq(users.id, uid));
    const rows = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    return Response.json({ user: rows[0] ? { id: rows[0].id, email: rows[0].email, isPremium: rows[0].isPremium, isAdmin: rows[0].isAdmin } : null });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const uid = Number(id);
    if (!uid) return Response.json({ error: "Geçersiz id" }, { status: 400 });
    if (uid === admin.id) return Response.json({ error: "Kendini silemezsin" }, { status: 400 });

    await db.delete(users).where(eq(users.id, uid));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
