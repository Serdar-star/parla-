import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_123";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia" as any,
  });
  return stripeClient;
}

export const PLANS = {
  free: {
    id: "free",
    name: "Ücretsiz",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Günde 3 ders", "Günde 20 AI mesajı", "Temel oyunlar", "Reklamlı"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthly: 6.99,
    priceYearly: 49.99,
    badge: "En Popüler",
    features: ["Sınırsız ders", "Sınırsız AI mesajı", "Tüm oyunlar", "Reklamsız", "Çevrimdışı mod", "Öncelikli destek"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 12.99,
    priceYearly: 89.99,
    features: ["Premium'un hepsi", "AI Roleplay (sınırsız)", "Kamera ile nesne tanıma", "Gelişmiş telaffuz analizi", "Özel avatar öğeleri", "Sertifika sınavları"],
  },
} as const;

export type PlanId = keyof typeof PLANS;
