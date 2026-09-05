import { count } from "drizzle-orm";
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { handleApiError } from "@/lib/auth";

export async function GET() {
  try {
    const total = (await db.select({ c: count() }).from(vocabulary))[0].c;
    if (total === 0) return Response.json({ word: null });
    // Günün kelimesi: tarihe göre deterministik seçim
    const day = new Date();
    const idx = (day.getFullYear() * 372 + (day.getMonth() + 1) * 31 + day.getDate()) % total;
    const rows = await db.select().from(vocabulary).limit(total);
    const w = rows[idx];
    return Response.json({
      word: {
        id: w.id,
        word: w.word,
        translation: w.translation,
        pronunciation: w.pronunciation,
        emoji: w.imageEmoji,
        category: w.category,
        example: w.exampleSentence,
        exampleTr: w.exampleTranslation,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
