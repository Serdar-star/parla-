import { desc } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { handleApiError } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const createSchema = z.object({
  languageCode: z.string().min(2).max(5).default("en"),
  cefrLevel: z.string().min(1).max(5).default("A1"),
  unitNumber: z.number().int().min(1),
  lessonNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional().default(""),
  type: z.string().optional().default("ders"),
  xpReward: z.number().int().min(0).max(500).optional().default(20),
  estimatedMinutes: z.number().int().min(1).max(120).optional().default(7),
  content: z.any().optional().default({}),
});

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(lessons).orderBy(desc(lessons.id)).limit(100);
    return Response.json({ lessons: rows });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz istek", details: parsed.error.issues }, { status: 400 });

    const inserted = await db
      .insert(lessons)
      .values({
        languageCode: parsed.data.languageCode,
        cefrLevel: parsed.data.cefrLevel,
        unitNumber: parsed.data.unitNumber,
        lessonNumber: parsed.data.lessonNumber,
        title: parsed.data.title,
        description: parsed.data.description || "",
        type: parsed.data.type || "ders",
        xpReward: parsed.data.xpReward ?? 20,
        estimatedMinutes: parsed.data.estimatedMinutes ?? 7,
        content: parsed.data.content ?? {},
      })
      .returning();

    return Response.json({ lesson: inserted[0] });
  } catch (err) {
    return handleApiError(err);
  }
}
