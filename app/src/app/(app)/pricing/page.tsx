"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { postJson } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Ücretsiz",
    priceM: 0,
    priceY: 0,
    icon: "🌱",
    features: ["Günde 3 ders", "Günde 20 AI mesajı", "Temel oyunlar", "Reklamlı"],
  },
  {
    id: "premium",
    name: "Premium",
    priceM: 6.99,
    priceY: 49.99,
    icon: "👑",
    badge: "En Popüler",
    features: ["Sınırsız ders", "Sınırsız AI mesajı", "Tüm oyunlar", "Reklamsız", "Çevrimdışı mod", "Öncelikli destek"],
  },
  {
    id: "pro",
    name: "Pro",
    priceM: 12.99,
    priceY: 89.99,
    icon: "💎",
    features: ["Premium'un hepsi", "AI Roleplay (sınırsız)", "Kamera ile nesne tanıma", "Gelişmiş telaffuz analizi", "Özel avatar öğeleri", "Sertifika sınavları"],
  },
] as const;

export default function PricingPage() {
  const { toast } = useToast();
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (plan: "premium" | "pro") => {
    setLoading(plan);
    try {
      const data = await postJson<{ url: string; mock?: boolean }>("/api/payment/create-checkout", {
        plan,
        billing: yearly ? "yearly" : "monthly",
      });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast("Checkout oluşturulamadı", { type: "error" });
      }
    } catch (e: any) {
      toast(e?.message || "Ödeme başlatılamadı", { type: "error" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <Badge tone="gold">
          <Crown className="size-3.5" /> Parla Premium
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink">Öğrenmeyi hızlandır</h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-mut">7 gün ücretsiz dene · Kredi kartı gerekmez · 30 gün iade garantisi</p>
        <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-1.5">
          <button onClick={() => setYearly(false)} className={cn("cursor-pointer rounded-xl px-4 py-2 text-sm font-extrabold", !yearly ? "bg-primary text-white" : "text-mut")}>
            Aylık
          </button>
          <button onClick={() => setYearly(true)} className={cn("cursor-pointer rounded-xl px-4 py-2 text-sm font-extrabold", yearly ? "bg-primary text-white" : "text-mut")}>
            Yıllık <span className="ml-1 text-gold">-%40</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((p, i) => {
          const price = yearly ? p.priceY : p.priceM;
          const popular = p.id === "premium";
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className={cn("relative flex h-full flex-col p-6", popular && "border-gold/60 shadow-[0_6px_0_color-mix(in_srgb,var(--gold)_40%,transparent)]")}>
                {popular && p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold text-[#4a3800]">{p.badge}</span>
                )}
                <span className="text-4xl">{p.icon}</span>
                <h2 className="mt-3 font-display text-xl font-bold text-ink">{p.name}</h2>
                <p className="mt-2 font-display text-3xl font-bold text-ink">
                  {price === 0 ? "₺0" : `$${price}`}
                  {price > 0 && <span className="text-sm font-semibold text-mut">/{yearly ? "yıl" : "ay"}</span>}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-semibold text-ink">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                {p.id === "free" ? (
                  <Button variant="outline" full className="mt-6" href="/dashboard">
                    Mevcut Plan
                  </Button>
                ) : (
                  <Button full className="mt-6" variant={popular ? "gold" : "primary"} loading={loading === p.id} onClick={() => void checkout(p.id as "premium" | "pro")}>
                    <Sparkles className="size-4" /> Şimdi Başla
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs font-semibold text-mut">
        30 gün içinde memnun kalmazsan iade ederiz. · Stripe ile güvenli ödeme
      </p>
    </div>
  );
}
