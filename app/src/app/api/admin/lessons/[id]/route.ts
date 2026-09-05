import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { handleApiError } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  xpReward: z.number().int().min(0).max(500).optional(),
  estimatedMinutes: z.number().int().min(1).max(120).optional(),
  content: z.any().optional(),
  cefrLevel: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const lid = Number(id);
    if (!lid) return Response.json({ error: "Geçersiz id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek" }, { status: 400 });

    await db.update(lessons).set(parsed.data as any).where(eq(lessons.id, lid));
    const rows = await db.select().from(lessons).where(eq(lessons.id, lid)).limit(1);
    return Response.json({ lesson: rows[0] || null });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const lid = Number(id);
    if (!lid) return Response.json({ error: "Geçersiz id" }, { status: 400 });
    await db.delete(lessons).where(eq(lessons.id, lid));
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
