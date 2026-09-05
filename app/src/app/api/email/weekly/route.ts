import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyActivity } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { sendEmail, weeklyEmailHtml } from "@/lib/email";

export async function POST() {
  try {
    const user = await requireUser();
    const acts = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, user.id));
    const xp = acts.reduce((a, b) => a + (b.xpEarned || 0), 0);
    const lessons = acts.reduce((a, b) => a + (b.lessonsCompleted || 0), 0);

    const ok = await sendEmail(
      user.email,
      "Haftalık Raporun Hazır! 📊",
      weeklyEmailHtml(user.fullName, { xp, lessons, streak: user.streak })
    );
    return Response.json({ ok, stats: { xp, lessons, streak: user.streak } });
  } catch (err) {
    return handleApiError(err);
  }
}
