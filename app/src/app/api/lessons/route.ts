import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, userLessons } from "@/db/schema";
import { getCurrentUser, handleApiError } from "@/lib/auth";
import { isLessonUnlocked } from "@/lib/progress";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Oturum yok." }, { status: 401 });

    const allLessons = await db.select().from(lessons).orderBy(asc(lessons.unitNumber), asc(lessons.lessonNumber));
    const doneRows = await db.select().from(userLessons).where(eq(userLessons.userId, user.id));
    const doneByKey = new Map<string, { stars: number; score: number }>();
    for (const r of doneRows) {
      const l = allLessons.find((x) => x.id === r.lessonId);
      if (l && r.completed) doneByKey.set(`${l.unitNumber}-${l.lessonNumber}`, { stars: r.score, score: r.score });
    }
    const completedSet = new Set(doneByKey.keys());

    let activeAssigned = false;
    const items = allLessons.map((l) => {
      const done = doneByKey.get(`${l.unitNumber}-${l.lessonNumber}`);
      let status: "completed" | "active" | "locked" = "locked";
      if (done) status = "completed";
      else if (!activeAssigned && isLessonUnlocked(l.unitNumber, l.lessonNumber, completedSet)) {
        status = "active";
        activeAssigned = true;
      }
      return {
        id: l.id,
        unitNumber: l.unitNumber,
        lessonNumber: l.lessonNumber,
        title: l.title,
        type: l.type,
        xpReward: l.xpReward,
        estimatedMinutes: l.estimatedMinutes,
        status,
        stars: done?.stars ?? 0,
      };
    });

    const unitNames: Record<number, { name: string; subtitle: string; emoji: string; color: string }> = {
      1: { name: "Selamlaşma ve Tanışma", subtitle: "Merhaba demeyi ve kendini tanıtmayı öğren", emoji: "👋", color: "#58cc02" },
      2: { name: "Aile ve İnsanlar", subtitle: "Aileni ve insanları anlatmayı öğren", emoji: "👨‍👩‍👧", color: "#1cb0f6" },
      3: { name: "Yiyecek ve İçecek", subtitle: "Sipariş ver, menüleri anla", emoji: "🍽️", color: "#ff9600" },
    };

    return Response.json({ units: [1, 2, 3].map((n) => ({ unit: n, ...unitNames[n], lessons: items.filter((i) => i.unitNumber === n) })) });
  } catch (err) {
    return handleApiError(err);
  }
}
