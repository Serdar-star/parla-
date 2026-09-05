import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { userLessons, lessons, userVocabulary, vocabulary } from "@/db/schema";
import { getCurrentUser, handleApiError } from "@/lib/auth";

/** Bugün tekrar edilmesi gereken kelimeleri döndürür. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const now = new Date();

    // 1) Zamanı gelenler
    let due = await db
      .select({ uv: userVocabulary, v: vocabulary })
      .from(userVocabulary)
      .innerJoin(vocabulary, eq(userVocabulary.vocabularyId, vocabulary.id))
      .where(and(eq(userVocabulary.userId, user.id), lte(userVocabulary.nextReview, now)))
      .orderBy(asc(userVocabulary.nextReview))
      .limit(12);

    // 2) Azsa, tamamlanan derslerin kelimelerinden ekle
    if (due.length < 5) {
      const doneLessons = await db.select({ lessonId: userLessons.lessonId }).from(userLessons).where(and(eq(userLessons.userId, user.id), eq(userLessons.completed, true)));
      const lessonRows = await db.select().from(lessons).limit(100);
      const vocabIds = new Set<number>();
      for (const dl of doneLessons) {
        const l = lessonRows.find((x) => x.id === dl.lessonId);
        if (!l) continue;
        for (const q of (l.content ?? []) as Array<{ word?: { id?: number } }>) {
          if (typeof q.word?.id === "number") vocabIds.add(q.word.id);
        }
      }
      const already = new Set(due.map((d) => d.v.id));
      const missing = [...vocabIds].filter((idv) => !already.has(idv));
      if (missing.length > 0) {
        const extra = await db
          .select({ v: vocabulary })
          .from(vocabulary)
          .where(sql`${vocabulary.id} IN (${sql.join(missing.map((m) => sql`${m}`), sql`, `)})`)
          .limit(12 - due.length);
        for (const e of extra) {
          due = [...due, { uv: null as unknown as typeof userVocabulary.$inferSelect, v: e.v }];
        }
      }
    }

    // 3) Hiç yoksa ilk 8 kelimeyi öner (yeni başlayanlar)
    if (due.length === 0) {
      const first = await db.select({ v: vocabulary }).from(vocabulary).orderBy(asc(vocabulary.id)).limit(8);
      due = first.map((f) => ({ uv: null as unknown as typeof userVocabulary.$inferSelect, v: f.v }));
    }

    return Response.json({
      count: due.length,
      cards: due.map((d) => ({
        id: d.v.id,
        word: d.v.word,
        translation: d.v.translation,
        pronunciation: d.v.pronunciation,
        emoji: d.v.imageEmoji,
        category: d.v.category,
        example: d.v.exampleSentence,
        exampleTr: d.v.exampleTranslation,
        strength: d.uv?.strength ?? 0,
        isNew: !d.uv,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
