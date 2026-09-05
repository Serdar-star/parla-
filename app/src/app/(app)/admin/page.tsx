"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { BookOpen, Crown, Shield, Users } from "lucide-react";
import { Badge, Button, Card, Skeleton, useToast } from "@/components/ui";
import { getJson } from "@/lib/api";

const WeeklyChart = dynamic(() => import("@/components/charts/weekly-chart").then((m) => m.WeeklyChart), { ssr: false });

type Stats = {
  totalUsers: number;
  todaySignups: number;
  completedLessons: number;
  totalAiMessages: number;
  activePremium: number;
  monthlyRevenue: number;
  chart: { date: string; xp: number }[];
  planDistribution: { free: number; premium: number; pro: number };
};

export default function AdminPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getJson<Stats>("/api/admin/stats");
      setStats(d);
    } catch (e: any) {
      setError(e?.message || "Admin erişimi yok");
      if (e?.status === 403) toast("Sadece adminler girebilir", { type: "warning" });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Shield className="mx-auto size-12 text-danger" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Erişim engellendi</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-5" href="/dashboard">
          Ana Sayfa
        </Button>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Toplam kullanıcı", value: stats.totalUsers, icon: Users, tone: "primary" },
    { label: "Bugün kayıt", value: stats.todaySignups, icon: Users, tone: "azure" },
    { label: "Tamamlanan ders", value: stats.completedLessons, icon: BookOpen, tone: "gold" },
    { label: "AI mesajı", value: stats.totalAiMessages, icon: Shield, tone: "violet" },
    { label: "Aktif premium", value: stats.activePremium, icon: Crown, tone: "gold" },
    { label: "Gelir ($)", value: stats.monthlyRevenue.toFixed(2), icon: Crown, tone: "primary" },
  ];

  const weekly = stats.chart.slice(-7).map((c, i) => ({
    day: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i] || c.date.slice(5),
    xp: c.xp,
    minutes: Math.round(c.xp / 10),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-ink text-bg">
            <Shield className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Admin Paneli</h1>
            <p className="text-sm font-semibold text-mut">Genel bakış ve yönetim</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" href="/admin/users">
            Kullanıcılar
          </Button>
          <Button size="sm" variant="outline" href="/admin/lessons">
            Dersler
          </Button>
          <Button size="sm" variant="outline" href="/admin/content">
            İçerik
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase text-mut">{c.label}</p>
                <c.icon className="size-4 text-mut" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-ink">{c.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink">Son 7 gün XP</h2>
          <div className="mt-4 h-52">
            <WeeklyChart weekly={weekly.length ? weekly : [{ day: "—", xp: 0, minutes: 0 }]} todayIdx={Math.max(0, weekly.length - 1)} />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink">Plan dağılımı</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Ücretsiz", v: stats.planDistribution.free, tone: "mut" as const },
              { label: "Premium", v: stats.planDistribution.premium, tone: "gold" as const },
              { label: "Pro", v: stats.planDistribution.pro, tone: "violet" as const },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3">
                <span className="text-sm font-extrabold text-ink">{p.label}</span>
                <Badge tone={p.tone}>{p.v}</Badge>
              </div>
            ))}
          </div>
          <Link href="/admin/users" className="mt-4 block text-center text-xs font-extrabold text-primary hover:underline">
            Kullanıcı yönetimine git →
          </Link>
        </Card>
      </div>
    </div>
  );
}
