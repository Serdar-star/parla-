import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, userLanguages } from "@/db/schema";
import { getCurrentUser, handleApiError, publicUser } from "@/lib/auth";
import { weekStartStr } from "@/lib/rules";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });
    const langs = await db.select().from(userLanguages).where(eq(userLanguages.userId, user.id));
    const leagueRows = await db.select().from(leagues).where(eq(leagues.userId, user.id)).orderBy().limit(100);
    const league = leagueRows.find((l) => l.weekStart === weekStartStr()) ?? leagueRows[0] ?? null;
    return Response.json({ user: publicUser(user), languages: langs, league });
  } catch (err) {
    return handleApiError(err);
  }
}
