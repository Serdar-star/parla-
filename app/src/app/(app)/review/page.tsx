"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronRight, Frown, Meh, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { Badge, Button, Card, Counter, Skeleton, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson, postJson } from "@/lib/api";
import { cn, fireConfetti, playTone, speak } from "@/lib/utils";

type Grade = "again" | "hard" | "good";

interface ReviewCard {
  id: number;
  word: string;
  translation: string;
  pronunciation: string;
  emoji: string;
  category: string;
  example: string;
  exampleTr: string;
  strength: number;
  isNew: boolean;
}

const gradeMeta: Record<Grade, { label: string; next: string; icon: typeof Frown; btn: string; fly: string }> = {
  again: { label: "Tekrar", next: "10 dk sonra", icon: Frown, btn: "bg-danger text-white shadow-[0_5px_0_color-mix(in_srgb,var(--danger)_55%,black)]", fly: "⏰ 10 dk sonra yine gelecek" },
  hard: { label: "Zorlandım", next: "güçlenmeden tekrar", icon: Meh, btn: "bg-gold text-[#4a3800] shadow-[0_5px_0_color-mix(in_srgb,var(--gold)_55%,black)]", fly: "🔁 Birazdan yine deneriz" },
  good: { label: "Bildim!", next: "aralık uzadı", icon: Check, btn: "bg-primary text-primaryink shadow-[0_5px_0_var(--primary-strong)]", fly: "📈 Hafıza gücün arttı!" },
};

export default function ReviewPage() {
  const { toast } = useToast();
  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"intro" | "session" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState<Grade[]>([]);
  const [fly, setFly] = useState<{ id: number; label: string } | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const flyId = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await getJson<{ count: number; cards: ReviewCard[] }>("/api/review");
      setCards(d.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kelimeler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const card = cards?.[idx];
  const done = scores.filter((s) => s === "good").length;
  const hard = scores.filter((s) => s === "hard").length;
  const again = scores.filter((s) => s === "again").length;

  const grade = async (g: Grade) => {
    if (!card) return;
    playTone(g === "again" ? "wrong" : "correct");
    flyId.current += 1;
    setFly({ id: flyId.current, label: gradeMeta[g].fly });
    setTimeout(() => setFly(null), 1400);

    try {
      const res = await postJson<{ xpGained: number }>(`/api/review/${card.id}`, { grade: g });
      setTotalXp((x) => x + res.xpGained);
    } catch {
      /* sessiz geç */
    }

    const nextScores = [...scores, g];
    setScores(nextScores);
    if (idx + 1 >= (cards?.length ?? 0)) {
      setMode("result");
      if (nextScores.filter((s) => s === "good").length >= (cards?.length ?? 1) * 0.6) fireConfetti(true);
      return;
    }
    setFlipped(false);
    setTimeout(() => setIdx((i) => i + 1), flipped ? 280 : 60);
  };

  const startAll = () => {
    setIdx(0);
    setScores([]);
    setFlipped(false);
    setTotalXp(0);
    setMode("session");
  };

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Tekrar listesi yüklenemedi 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!cards) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-72 rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════ SONUÇ ══════════════════════════════ */
  if (mode === "result") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center py-8">
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
          <Mascot mood={done >= (cards.length || 1) * 0.6 ? "joy" : "happy"} size={150} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-3 text-center font-display text-3xl font-bold text-ink sm:text-4xl">
          Hafıza seansı tamamlandı!
        </motion.h1>
        <p className="mt-2 text-center text-sm font-semibold text-mut">{cards.length} kelimeyi işledin — Ebbinghaus ağladı, sen kazandın. 🧠</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-gold/40 bg-goldsoft px-5 py-3 shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_40%,transparent)]">
            <Sparkles className="size-5 text-gold" />
            <p className="font-display text-lg font-semibold text-gold">
              +<Counter to={totalXp} duration={1} /> XP
            </p>
          </div>
        </motion.div>

        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          {[
            { label: "Bildim", value: done, cls: "border-primary/40 bg-primarysoft text-primarystrong" },
            { label: "Zorlandım", value: hard, cls: "border-gold/40 bg-goldsoft text-gold" },
            { label: "Tekrar", value: again, cls: "border-danger/40 bg-dangersoft text-danger" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className={cn("rounded-3xl border-2 p-5 text-center", s.cls)}>
              <p className="font-display text-4xl font-bold">
                <Counter to={s.value} duration={1.1} />
              </p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" onClick={() => { void load(); setMode("intro"); }} className="flex-1">
            <RotateCcw className="size-4.5" /> Listeyi Yenile
          </Button>
          <Button size="lg" href="/dashboard" className="flex-[1.5]">
            Bitir <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════ GİRİŞ ══════════════════════════════ */
  if (mode === "intro") {
    return (
      <div className="mx-auto max-w-4xl">
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-line bg-surface p-8 shadow-pop sm:p-10">
          <motion.div animate={{ y: [0, -22, 0] }} transition={{ duration: 9, repeat: Infinity }} className="pointer-events-none absolute -right-14 -top-16 size-64 rounded-full bg-violet/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-violet/40 bg-violetsoft px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-violet">
                <Brain className="size-3.5" /> Hafıza Laboratuvarı
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink">
                Unutmak üzere olduklarını <span className="text-violet">tam zamanında</span> yakala.
              </h1>
              <p className="mt-3 text-[15px] font-semibold leading-relaxed text-mut">
                Aralıklı tekrar motoru, bugün {cards.length} kelimeyi karşına çıkardı. Dürüstçe puanla, aralıklar otomatik ayarlansın.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Badge tone="violet">Bildim → 1 gün</Badge>
                <Badge tone="gold">Zor → 4 saat</Badge>
                <Badge tone="danger">Tekrar → 10 dk</Badge>
              </div>
            </div>
            <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 2.8, repeat: Infinity }} className="hidden md:block">
              <Mascot mood="happy" size={150} className="drop-shadow-xl" />
            </motion.div>
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
          {cards.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-5xl">🌱</p>
              <h2 className="mt-4 font-display text-xl font-bold text-ink">Henüz tekrar edilecek kelime yok</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-mut">Önce bir ders bitir — öğrendiğin kelimeler otomatik olarak tekrar planına eklenecek.</p>
              <Button className="mt-5" href="/lessons">
                Derse Git <ChevronRight className="size-4.5" />
              </Button>
            </Card>
          ) : (
            <Button size="xl" full onClick={startAll}>
              Seansı Başlat ({cards.length} kelime) <ChevronRight className="size-5" />
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════ SEANS ══════════════════════════════ */
  if (!card) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col">
      <div className="flex items-center gap-4">
        <button onClick={() => setMode("intro")} className="cursor-pointer rounded-xl border-2 border-line bg-surface p-2.5 text-mut shadow-[0_3px_0_var(--line)] transition hover:text-ink" aria-label="Kapat">
          <RotateCcw className="size-4.5" />
        </button>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-line/60 bg-raise">
          <motion.div animate={{ width: `${(idx / Math.max(1, cards.length)) * 100}%` }} transition={{ duration: 0.5 }} className="relative h-full rounded-full bg-gradient-to-b from-[#c49bff] to-violet">
            <div className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/30" />
          </motion.div>
        </div>
        <span className="font-display text-sm font-bold text-mut">
          {idx + 1}/{cards.length}
        </span>
      </div>

      <div className="card-3d relative mx-auto mt-8 w-full" style={{ minHeight: 360 }}>
        <AnimatePresence>
          {fly && (
            <motion.span key={fly.id} initial={{ opacity: 0, y: 16, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], y: -44, scale: 1 }} transition={{ duration: 1.35, ease: "easeOut" }} className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-violet/40 bg-surface px-4 py-2 font-display text-sm font-semibold text-violet shadow-pop">
              {fly.label}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setFlipped((f) => !f)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="preserve-3d relative block h-[360px] w-full cursor-pointer"
        >
          {/* Ön yüz */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2.2rem] border-2 border-line bg-surface p-8 shadow-pop">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-violetsoft/70 to-transparent" />
            <div className="relative flex w-full items-center justify-between">
              <Badge tone="violet">{card.category}</Badge>
              {card.isNew ? <Badge tone="primary">YENİ</Badge> : <Badge tone="mut">Güç {card.strength}/5</Badge>}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-[38%] size-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-2xl" />
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="relative mt-6 text-7xl drop-shadow-sm">
              {card.emoji}
            </motion.span>
            <p className="mt-4 font-display text-4xl font-bold text-ink">{card.word}</p>
            <p className="mt-1 text-sm font-bold text-mut">{card.pronunciation}</p>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                speak(card.word);
              }}
              onKeyDown={(e) => e.key === "Enter" && speak(card.word)}
              className="mt-4 flex size-11 cursor-pointer items-center justify-center rounded-full bg-violetsoft text-violet transition hover:scale-110"
            >
              <Volume2 className="size-5" />
            </span>
            <p className="absolute bottom-5 text-[11px] font-extrabold uppercase tracking-widest text-mut/70">Hatırlamaya çalış, sonra çevir 👆</p>
          </div>
          {/* Arka yüz */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-[2.2rem] border-2 border-violet bg-gradient-to-br from-violetsoft via-surface to-surface p-8 shadow-pop" style={{ transform: "rotateY(180deg)" }}>
            <Badge tone="violet">✨ Hatırladın mı?</Badge>
            <p className="mt-6 font-display text-5xl font-bold text-violet">{card.translation}</p>
            <p className="mt-2 text-sm font-bold text-mut">{card.word}</p>
            <div className="mt-5 max-w-sm rounded-2xl border-2 border-line bg-surface/80 p-3.5 text-center">
              <p className="text-sm font-semibold italic text-ink">“{card.example}”</p>
              <p className="mt-1 text-xs font-bold text-mut">{card.exampleTr}</p>
            </div>
          </div>
        </motion.button>
      </div>

      <div className={cn("mt-8 grid grid-cols-3 gap-3 transition-all duration-300", !flipped && "pointer-events-none opacity-35")}>
        {(Object.keys(gradeMeta) as Grade[]).map((g) => {
          const m = gradeMeta[g];
          return (
            <motion.button key={g} whileTap={{ scale: 0.92 }} onClick={() => void grade(g)} className={cn("cursor-pointer rounded-2xl py-4 font-display text-sm font-semibold transition hover:brightness-105 sm:text-base", m.btn)}>
              <m.icon className="mx-auto mb-1 size-5.5" />
              {m.label}
              <span className="mt-0.5 block text-[10px] font-bold opacity-80">{m.next}</span>
            </motion.button>
          );
        })}
      </div>
      {!flipped && <p className="mt-4 text-center text-xs font-bold text-mut">Önce kartı çevir — dürüst puanlama, süper hafıza 🧠</p>}
    </div>
  );
}
