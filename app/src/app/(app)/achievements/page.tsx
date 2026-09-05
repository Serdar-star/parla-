"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { Badge, Card, Skeleton, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  coinReward: number;
}
interface EarnedRow {
  achievement: Achievement;
  earnedAt: string;
}

const catColor: Record<string, string> = {
  İlerleme: "#58cc02",
  Kelime: "#1cb0f6",
  Seri: "#ff9600",
  Puan: "#9b5cff",
  Oyun: "#f43f5e",
  XP: "#ffc800",
  Özel: "#2dd4bf",
  Sosyal: "#ff7daa",
};

export default function AchievementsPage() {
  const { toast } = useToast();
  const [all, setAll] = useState<Achievement[] | null>(null);
  const [earnedIds, setEarnedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, e] = await Promise.all([getJson<{ achievements: Achievement[] }>("/api/achievements"), getJson<{ earned: EarnedRow[] }>("/api/achievements/user")]);
      setAll(a.achievements);
      setEarnedIds(new Set(e.earned.map((x) => x.achievement.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rozetler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Rozetler yüklenemedi 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <button onClick={() => void load()} className="mt-5 cursor-pointer rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primaryink shadow-[0_4px_0_var(--primary-strong)]">
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!all) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-56 rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const earnedCount = earnedIds.size;
  const pct = all.length === 0 ? 0 : Math.round((earnedCount / all.length) * 100);
  const categories = [...new Set(all.map((a) => a.category))];

  return (
    <div className="mx-auto max-w-5xl">
      {/* ═══════════════════════════ KUPA ODASI ════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-gold/40 bg-gradient-to-br from-[#241a02] via-[#33270a] to-[#1c1404] p-8 shadow-pop sm:p-10">
        <div className="dot-grid absolute inset-0 opacity-10" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 300px at 25% 0%, rgba(255,200,0,.2), transparent)" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-gold">
              <Trophy className="size-3.5" /> Şöhretler Müzesi
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Kupa Odası.</h1>
            <p className="mt-3 max-w-md text-[15px] font-semibold leading-relaxed text-white/60">Her rozet bir hikâye anlatır. {all.length} rozetten {earnedCount} tanesi senin.</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,.12)" strokeWidth="12" fill="none" />
                <motion.circle cx="64" cy="64" r="54" stroke="var(--gold)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} initial={{ strokeDashoffset: 2 * Math.PI * 54 }} animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - pct / 100) }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} className="text-3xl">
                  🏆
                </motion.span>
                <p className="font-display text-lg font-bold text-white">%{pct}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Kazanılan", value: earnedCount, cls: "text-gold" },
                { label: "Kalan", value: all.length - earnedCount, cls: "text-white/60" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/8 px-4 py-2">
                  <p className={cn("font-display text-xl font-bold", s.cls)}>{s.value}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ ROZET DUVARI ══════════════════════════ */}
      {categories.map((cat) => {
        const list = all.filter((a) => a.category === cat);
        const color = catColor[cat] ?? "#58cc02";
        return (
          <motion.section key={cat} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10">
            <div className="flex items-center gap-3">
              <span className="size-3 rounded-full" style={{ background: color }} />
              <h2 className="font-display text-xl font-bold text-ink">{cat} Rozetleri</h2>
              <span className="text-xs font-extrabold text-mut">
                {list.filter((a) => earnedIds.has(a.id)).length}/{list.length}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((a, i) => {
                const earned = earnedIds.has(a.id);
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
                    whileHover={{ y: -5 }}
                    className={cn("group relative flex flex-col items-center rounded-3xl border-2 p-5 text-center", earned ? "bg-surface shadow-card" : "border-line bg-raise/50 opacity-70 grayscale")}
                    style={earned ? { borderColor: `${color}55` } : undefined}
                  >
                    <motion.span whileHover={earned ? { rotateY: 360 } : undefined} transition={{ duration: 0.8 }} className="relative flex size-16 items-center justify-center rounded-2xl text-3xl" style={{ background: earned ? `color-mix(in srgb, ${color} 20%, var(--surface))` : "var(--raise)", border: `2px solid ${earned ? color + "66" : "var(--line)"}` }}>
                      {earned ? a.icon : "🔒"}
                      {!earned && (
                        <span className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-bg bg-linestrong">
                          <Lock className="size-3 text-surface" />
                        </span>
                      )}
                    </motion.span>
                    <p className="mt-3 font-display text-base font-semibold text-ink">{a.name}</p>
                    <p className="mt-1 text-[11px] font-bold leading-snug text-mut">{a.description}</p>
                    <div className="mt-3 flex gap-1.5">
                      {a.xpReward > 0 && <Badge tone="gold">+{a.xpReward} XP</Badge>}
                      {a.coinReward > 0 && <Badge tone="accent">+{a.coinReward} 🪙</Badge>}
                    </div>
                    {earned && (
                      <div className="pointer-events-none absolute -top-2 left-1/2 z-20 w-40 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-center text-[11px] font-bold text-bg opacity-0 shadow-pop transition-opacity duration-200 group-hover:opacity-100">
                        Kazanıldı! 🎉
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        );
      })}

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10">
        <Card className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-4">
            <Mascot mood="joy" size={88} />
            <div>
              <p className="font-display text-lg font-semibold text-ink">Sıradaki hedefin ne?</p>
              <p className="mt-0.5 text-sm font-semibold text-mut">Ders bitir, kelime öğren, seri yap — rozetler kendiliğinden gelir.</p>
            </div>
          </div>
          <button onClick={() => toast("Rozetler otomatik kontrol edilir", { desc: "Her ders ve XP kazanımında yeni rozetler taranır.", type: "info" })} className="cursor-pointer rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primaryink shadow-[0_4px_0_var(--primary-strong)] transition hover:brightness-105">
            Derslere Git
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
