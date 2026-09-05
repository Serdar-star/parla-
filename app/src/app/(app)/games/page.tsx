"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Diamond, Flame, Play, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { BossBattle, MemoryGame, SpeedRace, WordHunt } from "@/components/games";
import { Badge } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/utils";

type GameId = "hunt" | "memory" | "race" | "boss";

const games: { id: GameId; emoji: string; title: string; desc: string; grad: string; diff: number; gems: string; players: string }[] = [
  { id: "hunt", emoji: "🎯", title: "Kelime Avı", desc: "60 saniyede olabildiğince çok kelime yakala. Seriler çarpanı x4'e kadar fırlatır!", grad: "from-primary to-primarystrong", diff: 2, gems: "5-40 💎", players: "48K" },
  { id: "memory", emoji: "🃏", title: "Hafıza Kartları", desc: "8 çift kartı en az hamlede eşleştir. 12 hamle = efsane statüsü.", grad: "from-violet to-violet/70", diff: 1, gems: "20 💎", players: "31K" },
  { id: "race", emoji: "🏎️", title: "Hız Yarışı", desc: "30 saniyelik blitz! Sorular uçar, combo yaptıkça pist alev alır.", grad: "from-gold to-accent", diff: 3, gems: "5-35 💎", players: "56K" },
  { id: "boss", emoji: "🐉", title: "Boss Savaşı", desc: "Karanlık Kelime Lordu'nu doğru cevaplarla parçala. 3 can, tek şans.", grad: "from-danger to-accent", diff: 3, gems: "25 💎", players: "39K" },
];

const champions = [
  { name: "Zeynep K.", hue: 340, score: "512 puan", game: "🎯" },
  { name: "Can A.", hue: 210, score: "9 hamle", game: "🃏" },
  { name: "Selin D.", hue: 190, score: "245 puan", game: "🏎️" },
  { name: "Mert O.", hue: 280, score: "14 zafer", game: "🐉" },
];

function readBest(key: string): number | null {
  try {
    const v = localStorage.getItem(key);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

export default function GamesPage() {
  const [active, setActive] = useState<GameId | null>(null);
  const [bests, setBests] = useState<{ hunt: number | null; memory: number | null; race: number | null; boss: number | null }>({ hunt: null, memory: null, race: null, boss: null });

  const dailyIdx = new Date().getDate() % games.length;
  const dailyGame = games[dailyIdx].id;

  useEffect(() => {
    setBests({
      hunt: readBest("parla-best-hunt"),
      memory: readBest("parla-best-memory"),
      race: readBest("parla-best-race"),
      boss: readBest("parla-boss-wins"),
    });
  }, [active]);

  const bestLabel = (id: GameId): string => {
    if (id === "hunt" && bests.hunt !== null) return `Rekor: ${bests.hunt} puan`;
    if (id === "memory" && bests.memory !== null) return `Rekor: ${bests.memory} hamle`;
    if (id === "race" && bests.race !== null) return `Rekor: ${bests.race} puan`;
    if (id === "boss" && bests.boss !== null && bests.boss > 0) return `${bests.boss} boss yenildi`;
    return "Henüz oynanmadı";
  };

  return (
    <div className="mx-auto max-w-5xl">
      <AnimatePresence mode="wait">
        {active === null ? (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
            {/* Arcade tabelası */}
            <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-black/20 bg-[#150b2e] p-8 shadow-pop sm:p-10">
              <div className="dot-grid absolute inset-0 opacity-[0.15]" />
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(500px 260px at 20% 0%, rgba(155,92,255,.35), transparent), radial-gradient(420px 240px at 85% 100%, rgba(88,204,2,.22), transparent), radial-gradient(360px 200px at 70% 10%, rgba(28,176,246,.2), transparent)" }} />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2.4, repeat: Infinity }} className="inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#c9a6ff]">
                    <Sparkles className="size-3.5" /> Oyun Salonu Açık
                  </motion.div>
                  <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Oyna, Kap, <span className="text-gradient-jade">Öğren.</span>
                  </h1>
                  <p className="mt-3 max-w-md text-[15px] font-semibold text-white/60">
                    Beynin oyun sandıkça kelimeler cebe girer. Bugünün oyunu <span className="font-extrabold text-gold">{games[dailyIdx].emoji} {games[dailyIdx].title}</span> — elmaslar 2 kat! 💎
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-extrabold text-white backdrop-blur">
                      <Trophy className="size-4 text-gold" /> Haftalık lig XP'si sayılır
                    </span>
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-extrabold text-white backdrop-blur">
                      <Diamond className="size-4 fill-azure text-azure" /> Her oyun elmas bırakır
                    </span>
                  </div>
                </div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="hidden md:block">
                  <Mascot mood="joy" size={150} className="drop-shadow-[0_16px_40px_rgba(155,92,255,.5)]" />
                </motion.div>
              </div>
            </motion.section>

            {/* Oyun dolapları */}
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {games.map((g, i) => {
                const isDaily = g.id === dailyGame;
                return (
                  <motion.button
                    key={g.id}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActive(g.id)}
                    className={cn("group cursor-pointer overflow-hidden rounded-3xl border-2 bg-surface text-left shadow-card transition-shadow hover:shadow-pop", isDaily ? "border-gold/60 ring-4 ring-gold/20" : "border-line")}
                  >
                    <div className={cn("relative flex items-center justify-between overflow-hidden bg-gradient-to-br p-6", g.grad)}>
                      <div className="dot-grid absolute inset-0 opacity-15" />
                      <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4 }} className="relative text-6xl drop-shadow-lg">
                        {g.emoji}
                      </motion.span>
                      <div className="relative flex flex-col items-end gap-1.5">
                        {isDaily ? (
                          <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#4a3800] shadow-lg">
                            ⚡ Günün Oyunu · 2x 💎
                          </motion.span>
                        ) : (
                          <span className="rounded-xl bg-white/20 px-3 py-1.5 text-[11px] font-extrabold text-white backdrop-blur">{g.players} oyuncu</span>
                        )}
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map((s) => (
                            <Star key={s} className={cn("size-4", s < g.diff ? "fill-white text-white" : "text-white/30")} />
                          ))}
                        </span>
                      </div>
                      <span className="absolute -bottom-10 -right-10 size-36 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-ink">{g.title}</h2>
                        <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="flex size-9 items-center justify-center rounded-xl bg-primary text-primaryink shadow-[0_3px_0_var(--primary-strong)]">
                          <Play className="size-4.5 fill-current" />
                        </motion.span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-mut">{g.desc}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge tone="azure">
                          <Diamond className="size-3 fill-current" /> {g.gems}
                        </Badge>
                        <Badge tone={bestLabel(g.id) === "Henüz oynanmadı" ? "mut" : "gold"}>
                          <Trophy className="size-3" /> {bestLabel(g.id)}
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Şampiyonlar köşesi */}
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-7 rounded-3xl border-2 border-line bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Flame className="size-5 text-accent" /> Haftanın Şampiyonları
                </h2>
                <span className="text-xs font-extrabold uppercase tracking-wider text-mut">Pazar gece yarısı sıfırlanır</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {champions.map((c, i) => (
                  <motion.div key={c.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-bg p-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white shadow-card" style={{ background: `linear-gradient(135deg, hsl(${c.hue} 70% 50%), hsl(${c.hue + 40} 72% 38%))` }}>
                      {c.name.split(" ").map((x) => x[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-ink">{c.name}</p>
                      <p className="truncate text-[11px] font-bold text-mut">
                        {c.game} {c.score}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-linestrong p-4 text-center text-sm font-semibold text-mut">
              <Zap className="size-4.5 text-gold" /> Oyunlardan kazanılan XP, lig sıralamana ve günlük hedefine işlenir — eğlence de sayılır!
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key={active} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {active === "hunt" && <WordHunt onExit={() => setActive(null)} boost={dailyGame === "hunt"} />}
            {active === "memory" && <MemoryGame onExit={() => setActive(null)} boost={dailyGame === "memory"} />}
            {active === "race" && <SpeedRace onExit={() => setActive(null)} boost={dailyGame === "race"} />}
            {active === "boss" && <BossBattle onExit={() => setActive(null)} boost={dailyGame === "boss"} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
