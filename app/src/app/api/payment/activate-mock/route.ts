import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, payments, notifications } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["premium", "pro"]).default("premium"),
  billing: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

/** Test/mock checkout sonrası premium aktive eder. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz plan" }, { status: 400 });

    const { plan, billing } = parsed.data;
    const expires = new Date();
    if (billing === "yearly") expires.setFullYear(expires.getFullYear() + 1);
    else expires.setMonth(expires.getMonth() + 1);

    await db
      .update(users)
      .set({
        isPremium: true,
        subscriptionPlan: plan,
        premiumExpiresAt: expires,
        xp: user.xp + 500,
      })
      .where(eq(users.id, user.id));

    await db.insert(payments).values({
      userId: user.id,
      stripePaymentId: `mock_${Date.now()}`,
      amount: plan === "pro" ? (billing === "yearly" ? 8999 : 1299) : billing === "yearly" ? 4999 : 699,
      currency: "usd",
      plan,
      status: "succeeded",
    });

    try {
      await db.insert(notifications).values({
        userId: user.id,
        type: "achievement",
        title: "Hoş geldin Premium! 👑",
        message: `${plan === "pro" ? "Pro" : "Premium"} aboneliğin aktif. +500 XP bonus!`,
        data: { plan },
      });
    } catch {}

    return Response.json({ ok: true, plan, expiresAt: expires.toISOString() });
  } catch (err) {
    return handleApiError(err);
  }
}
