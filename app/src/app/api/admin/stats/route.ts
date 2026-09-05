import { sql, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { users, userLessons, aiConversations, payments, dailyActivity } from "@/db/schema";
import { handleApiError } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin();

    const allUsers = await db.select().from(users);
    const today = new Date().toISOString().slice(0, 10);
    const todayUsers = allUsers.filter((u) => {
      const d = u.createdAt instanceof Date ? u.createdAt.toISOString().slice(0, 10) : String(u.createdAt).slice(0, 10);
      return d === today;
    });

    const completedLessons = await db.select().from(userLessons).where(eq(userLessons.completed, true));
    const aiMsgs = await db.select().from(aiConversations);
    const premiumUsers = allUsers.filter((u) => u.isPremium);
    const paymentRows = await db.select().from(payments);
    const revenue = paymentRows.reduce((a, p) => a + (p.amount || 0), 0);

    // Last 30 days activity for chart
    const acts = await db.select().from(dailyActivity);
    const byDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const a of acts) {
      if (byDay[a.date] !== undefined) byDay[a.date] += a.xpEarned || 0;
    }
    const chart = Object.entries(byDay).map(([date, xp]) => ({ date, xp }));

    return Response.json({
      totalUsers: allUsers.length,
      todaySignups: todayUsers.length,
      completedLessons: completedLessons.length,
      totalAiMessages: aiMsgs.length,
      activePremium: premiumUsers.length,
      monthlyRevenue: revenue / 100,
      chart,
      planDistribution: {
        free: allUsers.filter((u) => !u.isPremium).length,
        premium: allUsers.filter((u) => u.subscriptionPlan === "premium").length,
        pro: allUsers.filter((u) => u.subscriptionPlan === "pro").length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
