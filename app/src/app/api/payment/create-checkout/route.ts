import { handleApiError, requireUser } from "@/lib/auth";
import { getStripe, PLANS } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["premium", "pro"]),
  billing: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Geçersiz plan" }, { status: 400 });

    const { plan, billing } = parsed.data;
    const planDef = PLANS[plan];
    const price = billing === "yearly" ? planDef.priceYearly : planDef.priceMonthly;

    // If Stripe keys are test dummy, return mock URL
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    if (secretKey.includes("Example") || secretKey.startsWith("sk_test_51Hx")) {
      return Response.json({
        url: `/payment/success?plan=${plan}&billing=${billing}&mock=1`,
        mock: true,
        message: "Test modunda mock checkout",
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Parla ${planDef.name} (${billing === "yearly" ? "Yıllık" : "Aylık"})` },
            unit_amount: Math.round(price * 100),
            recurring: { interval: billing === "yearly" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=1`,
      metadata: { userId: String(user.id), plan, billing },
    });

    return Response.json({ url: session.url, id: session.id });
  } catch (err) {
    return handleApiError(err);
  }
}
