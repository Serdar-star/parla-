"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Download, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Button, Card, ProgressRing, Skeleton, useToast } from "@/components/ui";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

const WeeklyChart = dynamic(() => import("@/components/charts/weekly-chart").then((m) => m.WeeklyChart), {
  ssr: false,
  loading: () => <div className="flex h-40 items-center justify-center text-xs font-bold text-mut">Grafik…</div>,
});

type Report = {
  user: { fullName: string; level: number; streak: number };
  thisWeek: { minutes: number; xp: number; lessons: number; words: number; bestDay: { date: string; xp: number } | null; longestStreak: number; accuracy: number };
  lastWeek: { minutes: number; xp: number; lessons: number; words: number };
  deltas: { minutes: number; xp: number; lessons: number; words: number };
  skills: { listening: number; speaking: number; reading: number; writing: number; grammar: number };
  aiComment: string;
  weekLabel: string;
};

function Delta({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-extrabold", up ? "text-primary" : "text-danger")}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {up ? "+" : ""}
      {v}%
    </span>
  );
}

export default function ReportPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const d = await getJson<Report>("/api/report");
      setData(d);
    } catch (e: any) {
      setError(e?.message || "Rapor yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (!ref.current) return;
      const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2 });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `parla-haftalik-rapor.png`;
      a.click();
      toast("Rapor indirildi 📥");
    } catch {
      toast("İndirme desteklenmiyor", { type: "warning" });
    }
  };

  const share = async () => {
    const text = data
      ? `📊 Parla haftalık raporum: ${data.thisWeek.xp} XP, ${data.thisWeek.lessons} ders, ${data.user.streak} gün seri! #DilÖğrenme #Parla`
      : "Parla ile dil öğreniyorum!";
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast("Paylaşım metni kopyalandı 📋");
      }
    } catch {
      toast("Paylaşım hazır", { type: "info", desc: text });
    }
  };

  if (!data && !error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="font-display text-xl font-bold text-ink">Rapor yüklenemedi</p>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-4" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </Card>
    );
  }

  const metrics = [
    { label: "Öğrenme süresi", value: `${data.thisWeek.minutes} dk`, delta: data.deltas.minutes },
    { label: "Kazanılan XP", value: data.thisWeek.xp, delta: data.deltas.xp },
    { label: "Yeni kelime", value: data.thisWeek.words, delta: data.deltas.words },
    { label: "Tamamlanan ders", value: data.thisWeek.lessons, delta: data.deltas.lessons },
  ];

  const weekly = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => ({
    day,
    xp: Math.round(data.thisWeek.xp / 7) + (i === 3 ? 20 : i % 3) * 5,
    minutes: Math.round(data.thisWeek.minutes / 7) + (i % 4),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="violet">Haftalık Rapor</Badge>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Bu haftanın karnesi</h1>
          <p className="text-sm font-semibold text-mut">{data.weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void share()}>
            <Share2 className="size-4" /> Paylaş
          </Button>
          <Button size="sm" onClick={() => void download()}>
            <Download className="size-4" /> İndir
          </Button>
        </div>
      </div>

      <div ref={ref} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
                <p className="text-[10px] font-extrabold uppercase text-mut">{m.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">{m.value}</p>
                <Delta v={m.delta} />
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink">Haftalık aktivite</h2>
            <div className="mt-4 h-48">
              <WeeklyChart weekly={weekly} todayIdx={6} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-mut">
              <span>Doğruluk: {data.thisWeek.accuracy}%</span>
              <span>En iyi gün: {data.thisWeek.bestDay?.date || "—"} ({data.thisWeek.bestDay?.xp || 0} XP)</span>
              <span>En uzun seri: {data.thisWeek.longestStreak} gün</span>
            </div>
          </Card>

          <Card className="p-6 text-center">
            <h2 className="font-display text-lg font-bold text-ink">Genel</h2>
            <div className="mt-4 flex justify-center">
              <ProgressRing value={Math.min(100, data.thisWeek.accuracy)} size={120} stroke={11}>
                <p className="font-display text-2xl font-bold text-ink">{data.thisWeek.accuracy}%</p>
              </ProgressRing>
            </div>
            <p className="mt-3 text-sm font-semibold text-mut">
              Sv. {data.user.level} · 🔥 {data.user.streak} gün
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink">Beceri gelişimi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {Object.entries(data.skills).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-bg p-3 text-center">
                <ProgressRing value={v} size={72} stroke={7}>
                  <p className="text-xs font-extrabold text-ink">{v}</p>
                </ProgressRing>
                <p className="mt-2 text-[10px] font-extrabold uppercase text-mut">{k}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-violet/40 bg-violetsoft/40 p-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-violet">Bu haftanın analizi</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink">{data.aiComment}</p>
        </Card>
      </div>
    </div>
  );
}
