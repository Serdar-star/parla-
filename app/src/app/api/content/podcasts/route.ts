import { handleApiError, requireUser } from "@/lib/auth";
import { PODCASTS } from "@/data/content";
import { db } from "@/db";
import { podcasts } from "@/db/schema";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    let rows: any[] = [];
    try {
      rows = await db.select().from(podcasts);
    } catch {}

    if (!rows.length) {
      rows = PODCASTS.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        language: p.language,
        duration: p.duration,
        transcriptJson: p.transcript,
        difficulty: p.difficulty,
        category: p.category,
        emoji: p.emoji,
        questionsJson: p.questions,
      }));
    }

    if (id) {
      const podcast = rows.find((r) => String(r.id) === id);
      if (!podcast) return Response.json({ error: "Podcast bulunamadı" }, { status: 404 });
      return Response.json({ podcast });
    }

    if (category && category !== "all") {
      rows = rows.filter((r) => r.category === category);
    }

    return Response.json({ podcasts: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
