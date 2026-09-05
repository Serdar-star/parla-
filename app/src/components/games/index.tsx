"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Diamond, Flame, RotateCcw, Skull, Swords, Timer, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { vocabEn } from "@/data/mock";
import { postJson } from "@/lib/api";
import { cn, fireConfetti, playTone, shuffle } from "@/lib/utils";
import { useApp } from "@/stores/app";
import type { VocabWord } from "@/types";

/** Oyun sonucunu sunucuya raporla — XP, lig ve görevler işlenir. */
function reportGame(game: string, score: number, xp: number, won = true) {
  postJson("/api/games/complete", { game, score, xp, won }).catch(() => undefined);
}

function useTimer(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  return left;
}

function readBest(key: string): number | null {
  try {
    const v = localStorage.getItem(key);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

/** mode high: büyük skor iyi; low: küçük skor iyi. Yeni rekor mu döner. */
function submitBest(key: string, score: number, mode: "high" | "low"): boolean {
  const prev = readBest(key);
  const isBetter = prev === null || (mode === "high" ? score > prev : score < prev);
  if (isBetter) {
    try {
      localStorage.setItem(key, String(score));
    } catch {
      /* yok say */
    }
  }
  return isBetter;
}

function GameShell({ title, emoji, onExit, right, children }: { title: string; emoji: string; onExit: () => void; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onExit} className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 font-display text-sm font-semibold text-mut shadow-[0_3px_0_var(--line)] transition hover:text-ink active:translate-y-[3px] active:shadow-none">
          <ArrowLeft className="size-4.5" /> Oyunlar
        </button>
        <p className="font-display text-lg font-semibold text-ink">
          {emoji} {title}
        </p>
        <div className="min-w-20 text-right">{right}</div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ResultPanel({ medal, title, subtitle, children, onExit, onRetry }: { medal: string; title: string; subtitle?: string; children?: React.ReactNode; onExit: () => void; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="rounded-3xl border-2 border-line bg-surface p-9 text-center shadow-pop">
      <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 13 }} className="inline-block text-7xl drop-shadow-lg">
        {medal}
      </motion.span>
      <h2 className="mt-4 font-display text-3xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm font-semibold text-mut">{subtitle}</p>}
      {children}
      <div className="mt-7 flex justify-center gap-3">
        <Button variant="outline" onClick={onExit}>
          Oyunlara Dön
        </Button>
        <Button onClick={onRetry}>
          <RotateCcw className="size-4" /> Tekrar Oyna
        </Button>
      </div>
    </motion.div>
  );
}

function makeOptions(word: VocabWord, seed: number) {
  const others = shuffle(vocabEn.filter((v) => v.en !== word.en), seed).slice(0, 3);
  return shuffle([word.tr, ...others.map((o) => o.tr)], seed + 1);
}

/* ═══════════════════════════════ KELİME AVI ══════════════════════════════ */

export function WordHunt({ onExit, boost = false }: { onExit: () => void; boost?: boolean }) {
  const { settings, addGems } = useApp();
  const deck = useMemo(() => shuffle(vocabEn.slice(0, 18), 3), []);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [wrongShake, setWrongShake] = useState(0);
  const [pops, setPops] = useState<{ id: number; amount: number }[]>([]);
  const [result, setResult] = useState<{ gems: number; newBest: boolean; best: number | null } | null>(null);
  const left = useTimer(60, !over);

  useEffect(() => {
    if (left === 0 && !over) {
      setOver(true);
      const gems = Math.max(5, Math.floor(score / 10)) * (boost ? 2 : 1);
      addGems(gems);
      reportGame("hunt", score, Math.max(10, Math.min(30, Math.floor(score / 15))));
      const newBest = submitBest("parla-best-hunt", score, "high");
      setResult({ gems, newBest, best: readBest("parla-best-hunt") });
    }
  }, [left, over, score, boost, addGems]);

  const word = deck[idx % deck.length];
  const options = useMemo(() => makeOptions(word, idx + 5), [word, idx]);
  const mult = Math.min(4, 1 + Math.floor(streak / 3));

  const pick = (opt: string) => {
    if (picked || over) return;
    setPicked(opt);
    if (opt === word.tr) {
      if (settings.sound) playTone("correct");
      const gained = 10 * mult;
      setScore((s) => s + gained);
      setStreak((s) => s + 1);
      setPops((p) => [...p.slice(-2), { id: Date.now(), amount: gained }]);
    } else {
      if (settings.sound) playTone("wrong");
      setStreak(0);
      setWrongShake((w) => w + 1);
    }
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 420);
  };

  const rank = score >= 400 ? { medal: "💎", label: "Elmas Avcı" } : score >= 250 ? { medal: "🥇", label: "Usta Avcı" } : score >= 120 ? { medal: "🥈", label: "Yetenekli Avcı" } : { medal: "🥉", label: "Çaylak Avcı" };

  return (
    <GameShell
      title="Kelime Avı"
      emoji="🎯"
      onExit={onExit}
      right={
        <span className={cn("inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-display text-sm font-semibold", left <= 10 ? "animate-pulse border-danger/50 bg-dangersoft text-danger" : "border-line bg-surface text-ink shadow-[0_3px_0_var(--line)]")}>
          <Timer className="size-4" /> {left}s
        </span>
      }
    >
      {over && result ? (
        <ResultPanel medal={rank.medal} title={rank.label} subtitle={`Süre doldu — ${streak} cevabın sonunda topladın`} onExit={onExit} onRetry={() => window.location.reload()}>
          <p className="mt-3 font-display text-6xl font-bold text-primary">{score}</p>
          <p className="text-sm font-bold text-mut">puan</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {result.newBest && <span className="animate-pulse rounded-xl bg-goldsoft px-3 py-1.5 text-xs font-extrabold text-gold">🏅 YENİ REKOR!</span>}
            {!result.newBest && result.best !== null && <span className="rounded-xl bg-raise px-3 py-1.5 text-xs font-extrabold text-mut">Rekorun: {result.best}</span>}
            <span className="flex items-center gap-1.5 rounded-xl bg-azuresoft px-3 py-1.5 text-xs font-extrabold text-azure">
              <Diamond className="size-3.5 fill-current" /> +{result.gems} {boost && "(2x!)"}
            </span>
          </div>
        </ResultPanel>
      ) : (
        <div className="space-y-4">
          {/* süre barı */}
          <div className="h-3.5 overflow-hidden rounded-full border border-line/60 bg-raise">
            <motion.div animate={{ width: `${(left / 60) * 100}%` }} transition={{ duration: 1, ease: "linear" }} className={cn("h-full rounded-full", left <= 10 ? "bg-gradient-to-r from-danger to-accent" : "bg-gradient-to-r from-primary to-primarystrong")} />
          </div>

          <motion.div key={wrongShake} animate={wrongShake > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="relative rounded-3xl border-2 border-line bg-surface p-8 shadow-card">
            {/* uçan puanlar */}
            <AnimatePresence>
              {pops.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 0, y: 10, scale: 0.7 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -52, scale: 1.1 }}
                  transition={{ duration: 1.1 }}
                  onAnimationComplete={() => setPops((x) => x.filter((q) => q.id !== p.id))}
                  className="pointer-events-none absolute right-8 top-4 z-10 rounded-xl bg-gold px-3 py-1.5 font-display text-base font-bold text-[#4a3800] shadow-pop"
                >
                  +{p.amount}
                </motion.span>
              ))}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={cn("size-5.5", streak > 0 ? "fill-accent text-accent" : "text-linestrong")} />
                <span className="font-display text-sm font-semibold text-ink">Seri: {streak}</span>
              </div>
              <motion.span key={mult} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className={cn("rounded-xl border-2 px-2.5 py-1 font-display text-sm font-semibold", mult > 1 ? "border-gold/50 bg-goldsoft text-gold" : "border-line bg-raise text-mut")}>
                x{mult} çarpan
              </motion.span>
              <span className="rounded-xl border-2 border-primary/40 bg-primarysoft px-3 py-1 font-display text-sm font-semibold text-primarystrong">{score}</span>
            </div>
            <div className="mt-8 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={word.en} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.22 }}>
                  <span className="text-6xl">{word.emoji}</span>
                  <p className="mt-3 font-display text-4xl font-bold text-ink">{word.en}</p>
                  <p className="mt-1 text-sm font-bold text-mut">{word.phonetic}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {options.map((opt) => (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => pick(opt)}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 px-4 py-4 font-bold transition-all duration-150",
                    picked === null && "border-line bg-bg text-ink shadow-[0_3px_0_var(--line)] hover:border-primary hover:bg-primarysoft/40",
                    picked !== null && opt === word.tr && "border-primary bg-primarysoft text-primarystrong",
                    picked === opt && opt !== word.tr && "border-danger bg-dangersoft text-danger",
                    picked !== null && picked !== opt && opt !== word.tr && "border-line bg-bg text-mut opacity-50"
                  )}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </GameShell>
  );
}

/* ═════════════════════════════ HAFIZA KARTLARI ═══════════════════════════ */

export function MemoryGame({ onExit, boost = false }: { onExit: () => void; boost?: boolean }) {
  const { settings, addGems } = useApp();
  const pairs = useMemo(() => shuffle(vocabEn.slice(2, 10), 7).map((w) => ({ id: w.en, en: w.en, tr: w.tr })), []);
  const cards = useMemo(() => shuffle(pairs.flatMap((p) => [{ key: `${p.id}-en`, id: p.id, label: p.en }, { key: `${p.id}-tr`, id: p.id, label: p.tr }]), 11), [pairs]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [sec, setSec] = useState(0);
  const [lock, setLock] = useState(false);
  const [result, setResult] = useState<{ gems: number; newBest: boolean; best: number | null } | null>(null);
  const won = matched.length === pairs.length;

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [won]);

  useEffect(() => {
    if (won && !result) {
      const gems = 20 * (boost ? 2 : 1);
      addGems(gems);
      fireConfetti(true);
      reportGame("memory", moves, Math.max(10, Math.min(30, 40 - Math.floor(moves / 2))));
      const newBest = submitBest("parla-best-memory", moves, "low");
      setResult({ gems, newBest, best: readBest("parla-best-memory") });
    }
  }, [won, result, moves, boost, addGems]);

  const flip = (i: number) => {
    if (lock || flipped.includes(i) || matched.includes(cards[i].id) || won) return;
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nf.map((x) => cards[x]);
      if (a.id === b.id) {
        if (settings.sound) playTone("correct");
        setMatched((m) => [...m, a.id]);
        setFlipped([]);
      } else {
        if (settings.sound) playTone("wrong");
        setLock(true);
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 750);
      }
    }
  };

  const stars = moves <= 12 ? 3 : moves <= 18 ? 2 : 1;

  return (
    <GameShell
      title="Hafıza Kartları"
      emoji="🃏"
      onExit={onExit}
      right={
        <div className="flex items-center gap-2 font-display text-sm font-semibold">
          <span className="rounded-xl border-2 border-gold/40 bg-goldsoft px-3 py-1.5 text-gold shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_35%,transparent)]">{moves} hamle</span>
          <span className="rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-mut shadow-[0_3px_0_var(--line)]">
            {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
          </span>
        </div>
      }
    >
      <div className="rounded-3xl border-2 border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          {cards.map((c, i) => {
            const isUp = flipped.includes(i) || matched.includes(c.id);
            const isMatched = matched.includes(c.id);
            return (
              <button key={c.key} onClick={() => flip(i)} className="card-3d aspect-[3/4] cursor-pointer" aria-label="hafıza kartı">
                <motion.div animate={{ rotateY: isUp ? 180 : 0 }} transition={{ duration: 0.4 }} className={cn("preserve-3d relative size-full", isMatched && "opacity-0 transition-opacity duration-500 delay-300")}>
                  <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-primarystrong bg-gradient-to-b from-primary to-primarystrong font-display text-3xl font-bold text-white shadow-card">
                    ?
                  </div>
                  <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-violet bg-gradient-to-b from-violetsoft to-surface p-1.5 text-center" style={{ transform: "rotateY(180deg)" }}>
                    <span className="text-[13px] font-extrabold leading-tight text-ink sm:text-sm">{c.label}</span>
                  </div>
                </motion.div>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs font-bold text-mut">Hedef: 12 hamlede bitir, 3 yıldızı kap ⭐⭐⭐</p>
      </div>

      <AnimatePresence>
        {won && result && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            <ResultPanel medal={stars === 3 ? "🌟" : stars === 2 ? "🎉" : "💪"} title="Tüm çiftleri buldun!" subtitle={`${moves} hamle · ${Math.floor(sec / 60)} dk ${sec % 60} sn · ${"⭐".repeat(stars)}`} onExit={onExit} onRetry={() => window.location.reload()}>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {result.newBest && <span className="animate-pulse rounded-xl bg-goldsoft px-3 py-1.5 text-xs font-extrabold text-gold">🏅 YENİ REKOR!</span>}
                {!result.newBest && result.best !== null && <span className="rounded-xl bg-raise px-3 py-1.5 text-xs font-extrabold text-mut">Rekorun: {result.best} hamle</span>}
                <span className="flex items-center gap-1.5 rounded-xl bg-azuresoft px-3 py-1.5 text-xs font-extrabold text-azure">
                  <Diamond className="size-3.5 fill-current" /> +{result.gems} {boost && "(2x!)"}
                </span>
              </div>
            </ResultPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}

/* ═══════════════════════════════ HIZ YARIŞI ══════════════════════════════ */

export function SpeedRace({ onExit, boost = false }: { onExit: () => void; boost?: boolean }) {
  const { settings, addGems } = useApp();
  const deck = useMemo(() => shuffle(vocabEn, 13), []);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<{ gems: number; newBest: boolean; best: number | null } | null>(null);
  const left = useTimer(30, !over);

  useEffect(() => {
    if (left === 0 && !over) {
      setOver(true);
      const gems = Math.max(5, Math.floor(score / 8)) * (boost ? 2 : 1);
      addGems(gems);
      reportGame("race", score, Math.max(10, Math.min(30, Math.floor(score / 10))));
      const newBest = submitBest("parla-best-race", score, "high");
      setResult({ gems, newBest, best: readBest("parla-best-race") });
    }
  }, [left, over, score, boost, addGems]);

  const word = deck[idx % deck.length];
  const options = useMemo(() => makeOptions(word, idx * 3 + 2), [word, idx]);

  const pick = (opt: string) => {
    if (over) return;
    if (opt === word.tr) {
      if (settings.sound) playTone("click");
      setScore((s) => s + 5);
      setCombo((c) => c + 1);
    } else {
      if (settings.sound) playTone("wrong");
      setCombo(0);
    }
    setIdx((i) => i + 1);
  };

  const rank = score >= 200 ? { medal: "🏎️", label: "Formula 1 Şampiyonu" } : score >= 130 ? { medal: "🥇", label: "Pist Ustası" } : score >= 70 ? { medal: "🥈", label: "Hızlı Pilot" } : { medal: "🥉", label: "Stajyer Sürücü" };

  return (
    <GameShell
      title="Hız Yarışı"
      emoji="🏎️"
      onExit={onExit}
      right={
        <span className={cn("inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-display text-sm font-semibold", left <= 5 ? "animate-pulse border-danger/50 bg-dangersoft text-danger" : "border-line bg-surface text-ink shadow-[0_3px_0_var(--line)]")}>
          <Timer className="size-4" /> {left}s
        </span>
      }
    >
      {over && result ? (
        <ResultPanel medal={rank.medal} title={rank.label} subtitle="Damalı bayrak sallandı!" onExit={onExit} onRetry={() => window.location.reload()}>
          <p className="mt-3 font-display text-6xl font-bold text-primary">{score}</p>
          <p className="text-sm font-bold text-mut">puan</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {result.newBest && <span className="animate-pulse rounded-xl bg-goldsoft px-3 py-1.5 text-xs font-extrabold text-gold">🏅 YENİ REKOR!</span>}
            {!result.newBest && result.best !== null && <span className="rounded-xl bg-raise px-3 py-1.5 text-xs font-extrabold text-mut">Rekorun: {result.best}</span>}
            <span className="flex items-center gap-1.5 rounded-xl bg-azuresoft px-3 py-1.5 text-xs font-extrabold text-azure">
              <Diamond className="size-3.5 fill-current" /> +{result.gems} {boost && "(2x!)"}
            </span>
          </div>
        </ResultPanel>
      ) : (
        <div className="space-y-4">
          <div className="h-3.5 overflow-hidden rounded-full border border-line/60 bg-raise">
            <motion.div animate={{ width: `${(left / 30) * 100}%` }} transition={{ duration: 1, ease: "linear" }} className={cn("h-full rounded-full", left <= 5 ? "bg-gradient-to-r from-danger to-accent" : "bg-gradient-to-r from-gold to-accent")} />
          </div>
          <div className="rounded-3xl border-2 border-line bg-surface p-8 shadow-card">
            <div className="flex items-center justify-between">
              <span className="rounded-xl border-2 border-primary/40 bg-primarysoft px-3 py-1.5 font-display text-sm font-semibold text-primarystrong">{score} puan</span>
              <motion.div key={combo} initial={{ scale: combo > 0 ? 1.3 : 1 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                <Zap className={cn("size-5", combo >= 3 ? "fill-gold text-gold" : "text-linestrong")} />
                <span className="font-display text-sm font-semibold text-ink">Combo x{combo}</span>
              </motion.div>
            </div>
            <div className="mt-7 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.15 }}>
                  <span className="text-5xl">{word.emoji}</span>
                  <p className="mt-2 font-display text-3xl font-bold text-ink">{word.en}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {options.map((opt) => (
                <button key={opt} onClick={() => pick(opt)} className="cursor-pointer rounded-2xl border-2 border-line bg-bg px-4 py-3.5 font-bold text-ink shadow-[0_3px_0_var(--line)] transition hover:border-gold hover:bg-goldsoft/40 active:translate-y-[3px] active:shadow-none">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}

/* ═══════════════════════════════ BOSS SAVAŞI ═════════════════════════════ */

export function BossBattle({ onExit, boost = false }: { onExit: () => void; boost?: boolean }) {
  const { settings, addGems } = useApp();
  const deck = useMemo(() => shuffle(vocabEn.slice(6), 17), []);
  const [idx, setIdx] = useState(0);
  const [bossHp, setBossHp] = useState(100);
  const [hearts, setHearts] = useState(3);
  const [picked, setPicked] = useState<string | null>(null);
  const [hit, setHit] = useState(false);
  const [shake, setShake] = useState(false);
  const [dmg, setDmg] = useState<{ id: number }[]>([]);
  const [result, setResult] = useState<{ won: boolean; gems: number; wins: number } | null>(null);
  const won = bossHp <= 0;
  const lost = hearts <= 0;

  useEffect(() => {
    if ((won || lost) && !result) {
      if (won) {
        fireConfetti(true);
        const gems = 25 * (boost ? 2 : 1);
        addGems(gems);
        reportGame("boss", 100, 30, true);
        let wins = 0;
        try {
          wins = Number(localStorage.getItem("parla-boss-wins") ?? "0") + 1;
          localStorage.setItem("parla-boss-wins", String(wins));
        } catch {
          wins = 1;
        }
        setResult({ won: true, gems, wins });
      } else {
        reportGame("boss", 0, 5, false);
        setResult({ won: false, gems: 0, wins: Number(readBest("parla-boss-wins") ?? 0) });
      }
    }
  }, [won, lost, result, boost, addGems]);

  const word = deck[idx % deck.length];
  const options = useMemo(() => makeOptions(word, idx + 9), [word, idx]);

  const pick = (opt: string) => {
    if (picked || won || lost) return;
    setPicked(opt);
    if (opt === word.tr) {
      if (settings.sound) playTone("correct");
      setHit(true);
      setDmg((d) => [...d.slice(-1), { id: Date.now() }]);
      setTimeout(() => setHit(false), 500);
      setBossHp((hp) => Math.max(0, hp - 20));
    } else {
      if (settings.sound) playTone("wrong");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setHearts((h) => h - 1);
    }
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 650);
  };

  return (
    <GameShell
      title="Boss Savaşı"
      emoji="🐉"
      onExit={onExit}
      right={
        <span className="inline-flex items-center gap-1 rounded-xl border-2 border-danger/40 bg-dangersoft px-3 py-1.5 font-display text-sm font-semibold text-danger">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={cn("text-base", i < hearts ? "" : "opacity-25 grayscale")}>❤️</span>
          ))}
        </span>
      }
    >
      {/* Boss sahnesi */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-violet/40 bg-gradient-to-b from-[#1d1230] to-[#2b1745] p-8 text-center shadow-pop">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(400px 200px at 50% 0%, rgba(167,139,250,.5), transparent)" }} />
        <div className="dot-grid absolute inset-0 opacity-10" />
        <div className="relative">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-violet/80">Karanlık Kelime Lordu</p>
          <motion.div animate={hit ? { x: [-10, 10, -8, 8, 0], scale: [1, 1.06, 1] } : { y: [0, -8, 0] }} transition={hit ? { duration: 0.45 } : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="relative mt-3 inline-block">
            <span className={cn("relative flex size-28 items-center justify-center rounded-[2rem] border-4 text-6xl shadow-[0_0_60px_-10px_rgba(167,139,250,.8)]", hit ? "border-danger bg-danger/30" : "border-violet bg-violet/20")}>
              <Skull className="size-14 text-white" />
              {hit && <motion.span initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} className="absolute inset-0 rounded-[2rem] border-4 border-danger" />}
            </span>
            {/* hasar sayıları */}
            <AnimatePresence>
              {dmg.map((d) => (
                <motion.span
                  key={d.id}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -64, scale: 1.15 }}
                  transition={{ duration: 0.9 }}
                  onAnimationComplete={() => setDmg((x) => x.filter((q) => q.id !== d.id))}
                  className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-display text-3xl font-bold text-danger drop-shadow-[0_2px_8px_rgba(255,95,95,.6)]"
                >
                  -20
                </motion.span>
              ))}
            </AnimatePresence>
          </motion.div>
          <div className="mx-auto mt-4 max-w-sm">
            <div className="flex justify-between text-xs font-extrabold text-white/80">
              <span>BOSS HP</span>
              <span>{bossHp}/100</span>
            </div>
            <div className="mt-1.5 h-4.5 overflow-hidden rounded-full border-2 border-white/20 bg-white/15">
              <motion.div animate={{ width: `${bossHp}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} className="h-full rounded-full bg-gradient-to-r from-danger to-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Soru / sonuç alanı */}
      <motion.div animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : {}} className={cn("mt-5 rounded-3xl border-2 bg-surface p-6 shadow-card", shake ? "border-danger" : "border-line")}>
        {result ? (
          <div className="py-4 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 14 }} className="inline-block text-6xl">
              {result.won ? "🏆" : "💀"}
            </motion.span>
            <h3 className="mt-3 font-display text-2xl font-bold text-ink">{result.won ? "Zafer senin!" : "Boss bu sefer kazandı..."}</h3>
            <p className="mt-1.5 text-sm font-semibold text-mut">
              {result.won ? "Kelimelerin gücü adına, muhteşem savaştın!" : "Canların bitti. Kelime hazneni güçlendirip geri dön!"}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {result.won && (
                <span className="flex items-center gap-1.5 rounded-xl bg-azuresoft px-3 py-1.5 text-xs font-extrabold text-azure">
                  <Diamond className="size-3.5 fill-current" /> +{result.gems} {boost && "(2x!)"}
                </span>
              )}
              <span className="rounded-xl bg-violetsoft px-3 py-1.5 text-xs font-extrabold text-violet">Toplam zafer: {result.wins} 🐉</span>
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={onExit}>
                Oyunlara Dön
              </Button>
              <Button onClick={() => window.location.reload()}>
                <Swords className="size-4" /> Yeniden Savaş
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-mut">Saldırı için doğru anlamı seç:</p>
              <span className="flex items-center gap-1 rounded-lg bg-violetsoft px-2 py-1 text-xs font-extrabold text-violet">
                <Swords className="size-4" /> -20 HP
              </span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-4xl">{word.emoji}</span>
              <p className="font-display text-2xl font-bold text-ink">{word.en}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 px-4 py-3.5 font-bold transition-all",
                    picked === null && "border-line bg-bg text-ink shadow-[0_3px_0_var(--line)] hover:border-violet hover:bg-violetsoft",
                    picked !== null && opt === word.tr && "border-primary bg-primarysoft text-primarystrong",
                    picked === opt && opt !== word.tr && "border-danger bg-dangersoft text-danger",
                    picked !== null && picked !== opt && opt !== word.tr && "border-line bg-bg opacity-50"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </GameShell>
  );
}
