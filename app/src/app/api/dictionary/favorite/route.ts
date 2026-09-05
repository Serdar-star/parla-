import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { vocabularyId?: number };
    const vocabularyId = Number(body.vocabularyId);
    if (!vocabularyId) return Response.json({ error: "Kelime ID gerekli." }, { status: 400 });

    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.vocabularyId, vocabularyId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return Response.json({ favorite: false });
    }
    await db.insert(favorites).values({ userId: user.id, vocabularyId });
    return Response.json({ favorite: true });
  } catch (err) {
    return handleApiError(err);
  }
}
