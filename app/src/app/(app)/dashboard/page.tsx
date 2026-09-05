"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Diamond, Flame, Heart, Play, Swords, Zap } from "lucide-react";
import { Badge, Button, Card, Counter, ProgressBar, ProgressRing, Skeleton, StatChip, useToast } from "@/components/ui";

// recharts (~360 KB) ilk açılışı bloklamasın diye istemcide sonradan yükleniyor.
const WeeklyChart = dynamic(
  () => import("@/components/charts/weekly-chart").then((m) => m.WeeklyChart),
  {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center text-xs font-bold text-mut">Grafik yükleniyor…</div>,
  }
);
import { Mascot } from "@/components/mascot";
import { getJson, postJson } from "@/lib/api";
import { cn, fireConfetti, greeting } from "@/lib/utils";

interface DashboardData {
  user: {
    fullName: string;
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    dailyGoal: number;
    coins: number;
    isPremium: boolean;
  };
  loginBonus: number;
  streak: number;
  weekly: { day: string; xp: number; minutes: number }[];
  todayMinutes: number;
  todayXp: number;
  lessonsDone: number;
  wordsLearned: number;
  league: { type: string; weeklyXp: number; rank: number } | null;
  recentAchievements: { id: number; name: string; icon: string }[];
  quests: { id: number; title: string; icon: string; xp: number; done: boolean }[];
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<DashboardData["quests"]>([]);

  const load = useCallback(async () => {
    try {
      const d = await getJson<DashboardData>("/api/dashboard");
      setData(d);
      setQuests(d.quests);
      if (d.loginBonus > 0) toast(`Günlük giriş bonusu: +${d.loginBonus} XP ⚡`, { type: "info" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veriler yüklenemedi.");
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleQuest = async (id: number) => {
    const q = quests.find((x) => x.id === id);
    if (!q || q.done) return;
    setQuests((prev) => prev.map((x) => (x.id === id ? { ...x, done: true } : x)));
    try {
      await postJson(`/api/dashboard/tasks/${id}`);
      const allDone = quests.every((x) => x.id === id || x.done);
      if (allDone) fireConfetti(true);
      toast(`Görev tamamlandı: +${q.xp} XP ⚡`);
    } catch {
      setQuests((prev) => prev.map((x) => (x.id === id ? { ...x, done: false } : x)));
    }
  };

  /* ── İskelet ── */
  if (!data && !error) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-64 rounded-[2.5rem]" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  /* ── Hata ── */
  if (error || !data) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Bir şeyler ters gitti 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error ?? "Veriler yüklenemedi."}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const { user } = data;
  const goalPct = Math.min(100, Math.round((data.todayMinutes / user.dailyGoal) * 100));
  const todayIdx = data.weekly.length - 1;
  const weeklyTotal = data.weekly.reduce((a, d) => a + d.xp, 0);

  return (
    <div className="mx-auto max-w-6xl">
      {/* ═══════════════════════════ HERO ══════════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-line bg-surface shadow-pop">
        <motion.div animate={{ y: [0, -22, 0], x: [0, 14, 0] }} transition={{ duration: 10, repeat: Infinity }} className="pointer-events-none absolute -right-14 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border-2 border-line bg-bg px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-[0_2px_0_var(--line)]">☀️ {greeting()}</span>
              <span className="flex items-center gap-1.5 rounded-full border-2 border-gold/40 bg-goldsoft px-3.5 py-1.5 text-xs font-extrabold text-gold">
                <Crown className="size-3.5" /> Sv. {user.level}
              </span>
              {user.isPremium && <Badge tone="gold">👑 Süper</Badge>}
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-[3rem]">
              {greeting()}, {user.fullName.split(" ")[0]}!
            </h1>
            <p className="mt-3 max-w-md text-[15px] font-semibold leading-relaxed text-mut">
              Hedefine <span className="font-extrabold text-primary">{Math.max(0, user.dailyGoal - data.todayMinutes)} dakika</span> kaldı — {data.streak} günlük seriyi koruyalım! 🔥
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <StatChip icon={<Zap className="size-4.5 text-gold" />} value={<Counter to={user.xp} />} title="Toplam XP" />
              <StatChip icon={<Flame className="size-4.5 text-accent" />} value={`${data.streak} gün`} title="Seri" />
              <StatChip icon={<Diamond className="size-4.5 fill-azure text-azure" />} value={user.coins} title="Para" />
            </div>
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="mt-7 max-w-xl">
              <Link href="/lessons" className="group block cursor-pointer rounded-3xl bg-primary p-2 shadow-[0_6px_0_var(--primary-strong)] transition-all hover:brightness-105 active:translate-y-[6px] active:shadow-none">
                <div className="flex items-center gap-4 rounded-[1.35rem] bg-primary px-5 py-4">
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">👋</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">Kaldığın yer</p>
                    <p className="truncate font-display text-lg font-semibold text-white">Selamlaşma ve Tanışma · Ünite 1</p>
                  </div>
                  <span className="hidden rounded-xl bg-white/20 px-3 py-1.5 text-xs font-extrabold text-white sm:block">{data.lessonsDone}/15 ders</span>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-primarystrong transition-transform duration-300 group-hover:translate-x-1">
                    <Play className="size-5 fill-current" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
          <div className="flex flex-row items-center justify-center gap-6 lg:flex-col lg:gap-5">
            <ProgressRing value={goalPct} size={150} stroke={13}>
              <p className="font-display text-3xl font-bold text-ink">{goalPct}%</p>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-mut">günlük hedef</p>
            </ProgressRing>
            <div className="text-center lg:text-left">
              <p className="font-display text-lg font-bold text-ink">
                {data.todayMinutes}/{user.dailyGoal} dk
              </p>
              <p className="text-xs font-extrabold text-primary">{goalPct >= 100 ? "Hedef tamamlandı! 🎉" : `${user.dailyGoal - data.todayMinutes} dk kaldı`}</p>
            </div>
            <div className="flex gap-2 lg:w-full lg:justify-center">
              <StatChip icon={<Heart className="size-4 fill-danger text-danger" />} value={5} title="Canlar" />
              <StatChip icon={<Swords className="size-4 text-gold" />} value={data.league ? `#${data.league.rank}` : "-"} title="Lig sırası" />
            </div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pointer-events-none absolute -bottom-2 right-8 hidden xl:block">
          <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
            <Mascot mood={goalPct >= 100 ? "joy" : "wave"} size={128} className="drop-shadow-xl" />
          </motion.div>
        </motion.div>
      </motion.section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {/* ── Görevler ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Günlük Görevler</h2>
                <Badge tone={quests.every((q) => q.done) ? "primary" : "gold"}>{quests.filter((q) => q.done).length}/{quests.length} tamamlandı</Badge>
              </div>
              <div className="mt-4 space-y-2.5">
                {quests.map((q) => (
                  <motion.button
                    key={q.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void toggleQuest(q.id)}
                    className={cn("flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200", q.done ? "border-primary/50 bg-primarysoft" : "border-line bg-bg hover:border-primary/60 hover:-translate-y-0.5")}
                  >
                    <span className={cn("flex size-11 items-center justify-center rounded-xl text-xl", q.done ? "bg-primary/15" : "bg-raise")}>{q.icon}</span>
                    <div className="flex-1">
                      <p className={cn("text-sm font-extrabold transition-all", q.done ? "text-primary line-through decoration-2" : "text-ink")}>{q.title}</p>
                      <p className="text-xs font-bold text-mut">+{q.xp} XP</p>
                    </div>
                    <span className={cn("flex size-7 items-center justify-center rounded-full border-2 transition-all", q.done ? "border-primary bg-primary text-primaryink" : "border-linestrong")}>
                      {q.done && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── Haftalık grafik ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Haftalık Aktivite</h2>
                <Badge tone="primary">{weeklyTotal.toLocaleString("tr-TR")} XP</Badge>
              </div>
              <div className="mt-4 h-52">
                <WeeklyChart weekly={data.weekly} todayIdx={todayIdx} />
              </div>
              <p className="mt-2 text-center text-xs font-bold text-mut">Bugün {data.todayXp} XP topladın — rekorun için devam! 🎯</p>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-5">
          {/* ── Lig ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Swords className="size-5 text-gold" /> {data.league ? data.league.type.charAt(0).toUpperCase() + data.league.type.slice(1) : "Altın"} Lig
                </h2>
                <Link href="/leaderboard" className="text-xs font-extrabold text-primary hover:underline">
                  Tam sıralama →
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-goldsoft text-3xl">🏆</span>
                <div>
                  <p className="font-display text-2xl font-bold text-ink">{data.league?.rank ?? "-"}{"."} sıra</p>
                  <ProgressBar value={Math.min(100, ((data.league?.weeklyXp ?? 0) / 4800) * 100)} className="mt-1.5 w-36" barClassName="from-gold to-accent" />
                  <p className="mt-1 text-xs font-bold text-mut">{(data.league?.weeklyXp ?? 0).toLocaleString("tr-TR")} XP bu hafta</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Rozetler ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Son Rozetler</h2>
                <Link href="/achievements" className="text-xs font-extrabold text-primary hover:underline">
                  Tümü →
                </Link>
              </div>
              {data.recentAchievements.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-bg p-5 text-center">
                  <p className="text-3xl">🔓</p>
                  <p className="mt-2 text-xs font-bold text-mut">İlk dersini bitir, ilk rozetini kap!</p>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {data.recentAchievements.map((b, i) => (
                    <motion.span key={b.id} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 300, damping: 18 }} title={b.name} className="flex size-13 cursor-pointer items-center justify-center rounded-2xl border-2 border-gold/40 bg-goldsoft text-2xl shadow-card transition-transform hover:scale-110">
                      {b.icon}
                    </motion.span>
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-bg p-3.5 text-center">
                  <p className="font-display text-2xl font-bold text-primary">
                    <Counter to={data.lessonsDone} />
                  </p>
                  <p className="text-[10px] font-extrabold uppercase text-mut">Ders</p>
                </div>
                <div className="rounded-2xl bg-bg p-3.5 text-center">
                  <p className="font-display text-2xl font-bold text-azure">
                    <Counter to={data.wordsLearned} />
                  </p>
                  <p className="text-[10px] font-extrabold uppercase text-mut">Kelime</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Söz ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl border-2 border-dashed border-linestrong p-5">
            <p className="font-display text-sm font-semibold italic text-ink">“Bir başka dil, hayatın başka bir vizyonudur.”</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-mut">— Federico Fellini</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
