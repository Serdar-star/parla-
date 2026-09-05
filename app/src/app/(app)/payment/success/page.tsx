"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { postJson } from "@/lib/api";
import { fireConfetti } from "@/lib/utils";

function SuccessInner() {
  const params = useSearchParams();
  const plan = params.get("plan") || "premium";
  const mock = params.get("mock");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fireConfetti(true);
    if (mock) {
      postJson("/api/payment/activate-mock", { plan })
        .then(() => setDone(true))
        .catch(() => setDone(true));
    } else {
      setDone(true);
    }
  }, [mock, plan]);

  return (
    <div className="mx-auto max-w-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="p-8 text-center">
          <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex size-20 items-center justify-center rounded-full bg-gold text-4xl shadow-[0_5px_0_color-mix(in_srgb,var(--gold)_55%,black)]">
            👑
          </motion.span>
          <h1 className="mt-5 font-display text-3xl font-bold text-ink">Hoş geldin Premium!</h1>
          <p className="mt-2 text-sm font-semibold text-mut">
            {plan === "pro" ? "Pro" : "Premium"} aboneliğin aktif. +500 XP bonus ve özel rozet hesabında!
          </p>
          {!done && <p className="mt-3 text-xs font-bold text-mut">Aktive ediliyor…</p>}
          <div className="mt-6 flex flex-col gap-2">
            <Button full href="/dashboard">
              <Crown className="size-4" /> Dashboard&apos;a Git
            </Button>
            <Button full variant="outline" href="/roleplay">
              Roleplay&apos;i Dene
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-mut">Yükleniyor…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
