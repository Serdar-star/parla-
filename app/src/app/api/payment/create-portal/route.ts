import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError, requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await requireUser();
    const secretKey = process.env.STRIPE_SECRET_KEY || "";

    if (secretKey.includes("Example") || secretKey.startsWith("sk_test_51Hx") || !user.stripeCustomerId) {
      return Response.json({
        url: "/pricing",
        mock: true,
        message: "Test modunda müşteri portalı yerine fiyatlandırma sayfasına yönlendiriliyorsun.",
      });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return handleApiError(err);
  }
}
