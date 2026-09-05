"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Hourglass, ShieldCheck, Timer, TrendingDown } from "lucide-react";
import { Badge, Button, Card, Skeleton, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Row {
  rank: number;
  weeklyXp: number;
  leagueType: string;
  name: string;
  username: string;
  streak: number;
  you: boolean;
}
interface UserPos {
  rank: number | null;
  totalPlayers: number;
  leagueType: string;
  weeklyXp: number;
  promoted: boolean;
  demoted: boolean;
}

const leagueMeta: Record<string, { name: string; color: string; icon: string }> = {
  bronz: { name: "Bronz", color: "#cd7f32", icon: "🥉" },
  gumus: { name: "Gümüş", color: "#9ca3af", icon: "🥈" },
  altin: { name: "Altın", color: "#f0a90f", icon: "🥇" },
  platin: { name: "Platin", color: "#2dd4bf", icon: "💠" },
  elmas: { name: "Elmas", color: "#a78bfa", icon: "💎" },
  sampiyon: { name: "Şampiyon", color: "#f43f5e", icon: "👑" },
};

function hueFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pos, setPos] = useState<UserPos | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [lb, me] = await Promise.all([getJson<{ rows: Row[] }>("/api/leaderboard"), getJson<UserPos>("/api/leaderboard/user")]);
      setRows(lb.rows);
      setPos(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sıralama yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Sıralama yüklenemedi 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!rows || !pos) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-40 rounded-[2.5rem]" />
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    );
  }

  const league = leagueMeta[pos.leagueType] ?? leagueMeta.altin;
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = ["h-20 sm:h-24", "h-32 sm:h-40", "h-14 sm:h-16"];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="mx-auto max-w-4xl">
      {/* ═══════════════════════════ LİG HERO ══════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-black/10 p-7 shadow-pop sm:p-9" style={{ background: `linear-gradient(120deg, ${league.color}f0, color-mix(in srgb, ${league.color} 70%, #1a1206))`, boxShadow: `0 8px 0 color-mix(in srgb, ${league.color} 45%, black)` }}>
        <div className="dot-grid absolute inset-0 opacity-15" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <motion.span animate={{ y: [0, -7, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 3.4, repeat: Infinity }} className="flex size-20 items-center justify-center rounded-[1.6rem] bg-white/20 text-5xl backdrop-blur-sm">
              {league.icon}
            </motion.span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/70">Bu haftaki ligin</p>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{league.name} Lig</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold text-white">Sıran: #{pos.rank ?? "-"}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold text-white">{pos.weeklyXp.toLocaleString("tr-TR")} XP</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/75">
              <Hourglass className="size-4" /> Sıfırlanmaya kalan
            </p>
            <span className="rounded-xl bg-white/15 px-4 py-2 font-display text-sm font-bold text-white backdrop-blur">Pazar 23:59 · Her hafta</span>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ PODYUM ════════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="relative mt-8 overflow-hidden rounded-[2.5rem] border-2 border-line bg-surface p-6 shadow-card sm:p-8" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${league.color} 8%, var(--surface)), var(--surface))` }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center opacity-60">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3], rotate: [i * 8 - 8, i * 8 - 4, i * 8 - 8] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.7 }} className="h-40 w-24 origin-top" style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${league.color} 30%, transparent), transparent)`, clipPath: "polygon(45% 0, 55% 0, 100% 100%, 0 100%)" }} />
          ))}
        </div>
        <p className="relative text-center text-[11px] font-extrabold uppercase tracking-[0.3em] text-mut">Haftanın En İyileri</p>
        <div className="relative mt-6 flex items-end justify-center gap-3 sm:gap-8">
          {podium.map((p, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const hue = hueFor(p.name);
            return (
              <motion.div key={p.username} initial={{ opacity: 0, y: 46 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + place * 0.15, type: "spring", stiffness: 240, damping: 20 }} className="flex w-24 flex-col items-center sm:w-36">
                <div className="relative">
                  {place === 1 && (
                    <motion.span animate={{ y: [0, -7, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-9 left-1/2 z-10 -translate-x-1/2">
                      <Crown className="size-8 fill-gold text-gold drop-shadow-[0_4px_10px_rgba(255,200,0,.6)]" />
                    </motion.span>
                  )}
                  <span className="flex size-16 items-center justify-center rounded-full font-display text-lg font-bold text-white sm:size-20 sm:text-xl" style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${(hue + 40) % 360} 72% 38%))`, boxShadow: `0 0 0 4px var(--surface), 0 0 0 7px ${league.color}, 0 14px 30px -8px ${league.color}aa` }}>
                    {p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <p className="mt-2.5 max-w-full truncate text-sm font-extrabold text-ink">{p.name}</p>
                <p className="text-xs font-bold text-mut">{p.weeklyXp.toLocaleString("tr-TR")} XP</p>
                <div className={cn("relative mt-3 flex w-full items-start justify-center rounded-t-2xl border-2 border-b-0 font-display text-3xl font-bold", heights[i])} style={{ borderColor: `${league.color}66`, background: `linear-gradient(180deg, color-mix(in srgb, ${league.color} ${place === 1 ? 34 : place === 2 ? 22 : 14}%, var(--raise)), var(--raise))` }}>
                  <span className="mt-2 drop-shadow-sm">{medals[i]}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ═══════════════════════════ TABLO ═════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b-2 border-line bg-raise/50 px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-mut">
            <span>Sıra</span>
            <span>Öğrenen</span>
            <span className="text-right">Haftalık XP</span>
          </div>
          {rows.map((r, i) => (
            <motion.div key={r.username} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.03 }} whileHover={{ x: 3 }} className={cn("relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b-2 border-line/60 px-5 py-3.5 last:border-0", r.you && "bg-primarysoft/70")}>
              {(r.rank <= 10 || r.rank > rows.length - 5) && <span className={cn("absolute inset-y-0 left-0 w-1.5", r.rank <= 10 ? "bg-primary" : "bg-danger")} />}
              <span className={cn("font-display text-sm font-bold", r.rank <= 3 ? "text-gold" : "text-mut")}>{r.rank}</span>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, hsl(${hueFor(r.name)} 70% 50%), hsl(${(hueFor(r.name) + 40) % 360} 72% 38%))` }}>
                  {r.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-extrabold text-ink">
                    {r.name}
                    {r.you && <Badge tone="primary">Sen</Badge>}
                  </p>
                  <p className="truncate text-xs font-bold text-mut">@{r.username} · 🔥 {r.streak} gün</p>
                </div>
              </div>
              <span className="text-right font-display text-sm font-bold tabular-nums text-ink">{r.weeklyXp.toLocaleString("tr-TR")}</span>
            </motion.div>
          ))}
        </Card>
      </motion.div>

      {/* ═══════════════════════════ YÜKSELME/DÜŞME ════════════════════════ */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="rounded-3xl border-2 border-primary/35 bg-primarysoft p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primaryink shadow-[0_3px_0_var(--primary-strong)]">
              <TrendingDown className="size-5.5 rotate-180" />
            </span>
            <div>
              <p className="font-display font-semibold text-primarystrong">İlk 10 yükselir 🚀</p>
              <p className="text-xs font-bold text-primarystrong/80">{pos.promoted ? "Şu an yükselme bölgesindesin — harika!" : `Sıran #${pos.rank ?? "-"} · yükselmek için ilk 10'a gir.`}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="rounded-3xl border-2 border-danger/30 bg-dangersoft p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-danger text-white shadow-[0_3px_0_color-mix(in_srgb,var(--danger)_55%,black)]">
              <ShieldCheck className="size-5.5" />
            </span>
            <div>
              <p className="font-display font-semibold text-danger">Son 5 düşer ⚠️</p>
              <p className="text-xs font-bold text-danger/80">{pos.demoted ? "Düşme hattındasın, XP topla!" : `Güvendesin — ${pos.totalPlayers} kişi arasındasın.`}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <button onClick={() => toast("Lig nasıl çalışır?", { desc: "Her Pazartesi XP sıfırlanır, haftalık XP'ye göre sıralanır ve ligler güncellenir.", type: "info" })} className="mt-6 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-linestrong py-3.5 text-sm font-extrabold text-mut transition hover:border-primary hover:text-primary">
        <Timer className="size-4" /> Lig nasıl çalışır?
      </button>
    </div>
  );
}
