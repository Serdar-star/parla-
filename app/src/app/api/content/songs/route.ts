import { handleApiError, requireUser } from "@/lib/auth";
import { SONGS } from "@/data/content";
import { db } from "@/db";
import { songs } from "@/db/schema";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre");
    const id = searchParams.get("id");

    // Prefer DB if seeded, else mock
    let rows: any[] = [];
    try {
      rows = await db.select().from(songs);
    } catch {}

    if (!rows.length) {
      rows = SONGS.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        language: s.language,
        lyricsJson: s.lyrics,
        difficulty: s.difficulty,
        genre: s.genre,
        emoji: s.emoji,
        youtubeId: s.youtubeId,
      }));
    }

    if (id) {
      const song = rows.find((r) => String(r.id) === id);
      if (!song) return Response.json({ error: "Şarkı bulunamadı" }, { status: 404 });
      return Response.json({ song });
    }

    if (genre && genre !== "all") {
      rows = rows.filter((r) => r.genre === genre);
    }

    return Response.json({ songs: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
