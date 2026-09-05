import { handleApiError, requireUser } from "@/lib/auth";
import { NEWS } from "@/data/content";
import { db } from "@/db";
import { newsArticles } from "@/db/schema";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    let rows: any[] = [];
    try {
      rows = await db.select().from(newsArticles);
    } catch {}

    if (!rows.length) {
      rows = NEWS.map((n) => ({
        id: n.id,
        title: n.title,
        language: n.language,
        simpleContent: n.simple,
        mediumContent: n.medium,
        originalContent: n.original,
        category: n.category,
        emoji: n.emoji,
        readingTime: n.readingTime,
        difficulty: n.difficulty,
        questionsJson: n.questions,
      }));
    }

    if (id) {
      const article = rows.find((r) => String(r.id) === id);
      if (!article) return Response.json({ error: "Haber bulunamadı" }, { status: 404 });
      return Response.json({ article });
    }

    if (category && category !== "all") {
      rows = rows.filter((r) => r.category === category);
    }

    return Response.json({ articles: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
