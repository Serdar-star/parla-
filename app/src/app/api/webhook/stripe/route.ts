import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, payments, notifications, achievements, userAchievements } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  // Mock / test mode: accept JSON body with type + metadata
  if (secretKey.includes("Example") || secretKey.startsWith("sk_test_51Hx") || !webhookSecret || webhookSecret.startsWith("whsec_test")) {
    try {
      const body = await req.json().catch(() => ({}));
      const type = body.type || body.event || "payment_intent.succeeded";
      const userId = Number(body.userId || body.metadata?.userId || 0);
      const plan = body.plan || body.metadata?.plan || "premium";

      if (type === "payment_intent.succeeded" || type === "checkout.session.completed") {
        if (userId) {
          const expires = new Date();
          expires.setMonth(expires.getMonth() + 1);
          await db
            .update(users)
            .set({
              isPremium: true,
              subscriptionPlan: plan,
              premiumExpiresAt: expires,
              xp: (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0]?.xp + 500 || 500,
            })
            .where(eq(users.id, userId));

          await db.insert(payments).values({
            userId,
            stripePaymentId: body.id || `mock_${Date.now()}`,
            amount: plan === "pro" ? 1299 : 699,
            currency: "usd",
            plan,
            status: "succeeded",
          });

          try {
            await db.insert(notifications).values({
              userId,
              type: "achievement",
              title: "Hoş geldin Premium! 👑",
              message: `${plan === "pro" ? "Pro" : "Premium"} aboneliğin aktif. +500 XP bonus!`,
              data: { plan },
            });
          } catch {}
        }
        return Response.json({ received: true, mock: true });
      }

      if (type === "customer.subscription.deleted") {
        if (userId) {
          await db
            .update(users)
            .set({ isPremium: false, subscriptionPlan: "free", premiumExpiresAt: null })
            .where(eq(users.id, userId));
        }
        return Response.json({ received: true, mock: true });
      }

      return Response.json({ received: true, mock: true });
    } catch (e) {
      console.error("Mock webhook error", e);
      return Response.json({ error: "Webhook error" }, { status: 400 });
    }
  }

  // Real Stripe webhook
  try {
    const stripe = getStripe();
    const sig = req.headers.get("stripe-signature") || "";
    const raw = await req.text();
    const event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const session = event.data.object as any;
      const userId = Number(session.metadata?.userId || 0);
      const plan = session.metadata?.plan || "premium";
      if (userId) {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        await db
          .update(users)
          .set({
            isPremium: true,
            subscriptionPlan: plan,
            premiumExpiresAt: expires,
            stripeCustomerId: session.customer || rows[0]?.stripeCustomerId,
            xp: (rows[0]?.xp || 0) + 500,
          })
          .where(eq(users.id, userId));

        await db.insert(payments).values({
          userId,
          stripePaymentId: session.id || session.payment_intent || `pi_${Date.now()}`,
          amount: session.amount_total || 699,
          currency: session.currency || "usd",
          plan,
          status: "succeeded",
        });

        try {
          await db.insert(notifications).values({
            userId,
            type: "achievement",
            title: "Hoş geldin Premium! 👑",
            message: `${plan === "pro" ? "Pro" : "Premium"} aboneliğin aktif. +500 XP bonus!`,
            data: { plan },
          });
        } catch {}
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const rows = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
      if (rows[0]) {
        await db
          .update(users)
          .set({ isPremium: false, subscriptionPlan: "free", premiumExpiresAt: null })
          .where(eq(users.id, rows[0].id));
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error", err);
    return Response.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }
}
