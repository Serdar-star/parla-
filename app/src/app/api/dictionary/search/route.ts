import { asc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { favorites, userVocabulary, vocabulary } from "@/db/schema";
import { getCurrentUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const cat = url.searchParams.get("cat") ?? "";

    let rows;
    if (q) {
      // SQLite LIKE zaten büyük/küçük harf duyarsız (ASCII): hem kelime
      // hem çeviride arar — Türkçe sorgu da sonuç verir.
      rows = await db
        .select()
        .from(vocabulary)
        .where(or(like(vocabulary.word, `%${q}%`), like(vocabulary.translation, `%${q}%`)))
        .orderBy(asc(vocabulary.id))
        .limit(60);
    } else {
      rows = await db.select().from(vocabulary).orderBy(asc(vocabulary.id)).limit(400);
    }
    if (cat) rows = rows.filter((r) => r.category === cat);

    const favs = await db.select().from(favorites).where(eq(favorites.userId, user.id));
    const favSet = new Set(favs.map((f) => f.vocabularyId));
    const learned = await db.select().from(userVocabulary).where(eq(userVocabulary.userId, user.id));
    const learnedMap = new Map(learned.map((l) => [l.vocabularyId, l.strength]));

    return Response.json({
      words: rows.map((w) => ({
        id: w.id,
        word: w.word,
        translation: w.translation,
        pronunciation: w.pronunciation,
        emoji: w.imageEmoji,
        category: w.category,
        example: w.exampleSentence,
        exampleTr: w.exampleTranslation,
        favorite: favSet.has(w.id),
        strength: learnedMap.get(w.id) ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
