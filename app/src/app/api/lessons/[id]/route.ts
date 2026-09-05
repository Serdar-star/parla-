import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { getCurrentUser, handleApiError } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const { id } = await ctx.params;
    const rows = await db.select().from(lessons).where(eq(lessons.id, Number(id))).limit(1);
    if (rows.length === 0) return Response.json({ error: "Ders bulunamadı." }, { status: 404 });
    const l = rows[0];
    return Response.json({
      id: l.id,
      title: l.title,
      description: l.description,
      type: l.type,
      xpReward: l.xpReward,
      estimatedMinutes: l.estimatedMinutes,
      unitNumber: l.unitNumber,
      lessonNumber: l.lessonNumber,
      content: l.content,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
