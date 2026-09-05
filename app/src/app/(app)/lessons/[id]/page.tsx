"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock3, Crown, Diamond, Flame, Heart, PartyPopper, RotateCcw, Star, Target, X, Zap } from "lucide-react";
import { Button, Counter, Modal, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { BoslukQuestion, DinleQuestion, EslestirQuestion, KonusQuestion, ResimQuestion, SecQuestion, SiralaQuestion } from "@/components/lessons/questions";
import { getJson, postJson } from "@/lib/api";
import { useApp } from "@/stores/app";
import { cn, fireConfetti, playTone } from "@/lib/utils";
import type { Question } from "@/types";

interface LessonData {
  id: number;
  title: string;
  type: string;
  xpReward: number;
  estimatedMinutes: number;
  unitNumber: number;
  lessonNumber: number;
  content: Question[];
}

interface CompleteResult {
  stars: number;
  xpGained: number;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  streak: number;
  freezeUsed: boolean;
  wordsLearned: number;
  newAchievements: { id: number; name: string; icon: string; description: string }[];
}

const praise = ["Harikasın! 🎉", "Tam isabet! ⚡", "Muhteşem! 🌟", "Böyle devam! 🚀", "Süpersin! 🔥"];

function correctAnswerOf(q: Question): string {
  switch (q.type) {
    case "sec":
    case "dinle":
      return `“${q.word.en}” → ${q.word.tr}`;
    case "resim":
      return `${q.answer.emoji} ${q.answer.en} → ${q.answer.tr}`;
    case "bosluk":
      return `Doğru kelime: “${q.answer}”`;
    case "sirala":
      return q.answer.join(" ");
    case "eslestir":
      return "Eşleştirmeler tamamlandı";
    case "konuş":
      return `“${q.word.en}” ${q.word.phonetic}`;
  }
}

export default function LessonPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { settings, wallet, loseHeart } = useApp();
  const lessonId = params.id;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [phase, setPhase] = useState<"question" | "feedback" | "done" | "failed" | "nohearts">("question");
  const [lastOk, setLastOk] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  const [combo, setCombo] = useState(0);
  const [intro, setIntro] = useState(true);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [achPopup, setAchPopup] = useState<CompleteResult["newAchievements"][number] | null>(null);
  const start = useRef(Date.now());
  const hearts = wallet.isSuper ? 999 : wallet.hearts;

  const load = useCallback(async () => {
    try {
      const d = await getJson<LessonData>(`/api/lessons/${lessonId}`);
      setLesson(d);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Ders yüklenemedi.");
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const questions = useMemo(() => lesson?.content ?? [], [lesson]);
  const q = questions[Math.min(qi, Math.max(0, questions.length - 1))];

  const sfx = (k: "correct" | "wrong" | "win") => settings.sound && playTone(k);

  const handleAnswer = (ok: boolean) => {
    setLastOk(ok);
    if (ok) {
      setCorrect((c) => c + 1);
      setCombo((c) => {
        const n = c + 1;
        if (n === 5) fireConfetti();
        return n;
      });
      sfx("correct");
    } else {
      setWrong((w) => w + 1);
      setCombo(0);
      if (!wallet.isSuper) loseHeart();
      sfx("wrong");
    }
    setPhase("feedback");
  };

  const finishLesson = useCallback(async () => {
    if (!lesson) return;
    try {
      const res = await postJson<CompleteResult>(`/api/lessons/${lesson.id}/complete`, {
        correct,
        wrong,
        timeSpent: Math.round((Date.now() - start.current) / 1000),
      });
      setResult(res);
      setPhase("done");
      sfx("win");
      fireConfetti(true);
      if (res.newAchievements.length > 0) {
        setTimeout(() => setAchPopup(res.newAchievements[0]), 1200);
      }
    } catch {
      toast("Sonuç kaydedilemedi", { desc: "Puanın bu oturumda saklanamadı.", type: "error" });
      setPhase("done");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, correct, wrong]);

  const next = () => {
    if (!lastOk && !wallet.isSuper && wallet.hearts <= 0) {
      setPhase("nohearts");
      return;
    }
    if (qi + 1 >= questions.length) {
      void finishLesson();
      return;
    }
    setQi((i) => i + 1);
    setPhase("question");
  };

  const restart = () => {
    setQi(0);
    setCorrect(0);
    setWrong(0);
    setCombo(0);
    setResult(null);
    start.current = Date.now();
    setPhase("question");
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Ders açılamadı 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{loadError}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <Mascot mood="happy" size={110} />
        <p className="font-display font-semibold text-mut">Ders hazırlanıyor...</p>
      </div>
    );
  }

  /* ═══════════════════════════════ BİTİŞ ══════════════════════════════ */
  if (phase === "done" && result) {
    const elapsed = Math.round((Date.now() - start.current) / 1000);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-12">
        <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <Mascot mood="joy" size={150} />
          </motion.div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-center font-display text-3xl font-bold text-ink sm:text-4xl">
          Ders Tamamlandı!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-2 text-center text-sm font-semibold text-mut">
          {wrong === 0 ? "Kusursuz bir performans! +20 bonus XP 🌟" : "Harika iş — pratik mükemmelleştirir."}
        </motion.p>

        <div className="mt-7 flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.3, type: "spring", stiffness: 280, damping: 15 }}>
              <Star className={cn("size-14", i < result.stars ? "fill-gold text-gold drop-shadow-[0_6px_16px_rgba(255,200,0,.5)]" : "text-linestrong")} />
            </motion.span>
          ))}
        </div>

        {result.levelAfter > result.levelBefore && (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 15 }} className="mt-5 flex items-center gap-2.5 rounded-2xl border-2 border-gold/50 bg-goldsoft px-5 py-3 shadow-[0_4px_0_color-mix(in_srgb,var(--gold)_40%,transparent)]">
            <Crown className="size-6 fill-gold text-gold" />
            <p className="font-display text-lg font-bold text-ink">SEVİYE ATLADIN! Sv. {result.levelAfter}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
          <div className="rounded-2xl border-2 border-gold/40 bg-goldsoft p-4 text-center">
            <Zap className="mx-auto size-5 text-gold" />
            <p className="mt-1 font-display text-2xl font-bold text-gold">
              +<Counter to={result.xpGained} duration={1.2} />
            </p>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-mut">XP Kazandın</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/40 bg-primarysoft p-4 text-center">
            <Target className="mx-auto size-5 text-primary" />
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              {correct}/{questions.length}
            </p>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-mut">Doğru</p>
          </div>
          <div className="rounded-2xl border-2 border-line bg-surface p-4 text-center">
            <Clock3 className="mx-auto size-5 text-mut" />
            <p className="mt-1 font-display text-2xl font-bold text-ink">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </p>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-mut">Süre</p>
          </div>
        </motion.div>

        {result.wordsLearned > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-azure/40 bg-azuresoft px-4 py-2.5">
            <Diamond className="size-4.5 fill-azure text-azure" />
            <p className="text-sm font-bold text-azure">{result.wordsLearned} yeni kelime hafızana eklendi + tekrar planına alındı</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25 }} className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" onClick={restart} className="flex-1">
            <RotateCcw className="size-4.5" /> Tekrar Yap
          </Button>
          <Button size="lg" href="/lessons" className="flex-[1.6]">
            Devam Et <ChevronRight className="size-5" />
          </Button>
        </motion.div>

        {/* Rozet popup */}
        <AnimatePresence>
          {achPopup && (
            <Modal open onClose={() => setAchPopup(null)}>
              <div className="p-8 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 13 }} className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-gold bg-goldsoft text-5xl shadow-[0_6px_0_color-mix(in_srgb,var(--gold)_50%,transparent)]">
                  {achPopup.icon}
                </motion.span>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.25em] text-gold">Yeni Rozet!</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-ink">{achPopup.name}</h3>
                <p className="mt-1.5 text-sm font-semibold text-mut">{achPopup.description}</p>
                <Button full size="lg" className="mt-6" onClick={() => setAchPopup(null)}>
                  <PartyPopper className="size-5" /> Harika!
                </Button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ═══════════════════════════ CANLAR BİTTİ ═══════════════════════════ */
  if (phase === "nohearts") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Heart key={i} className="size-9 text-linestrong" />
          ))}
        </div>
        <Mascot mood="sad" size={130} className="mt-4" />
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-ink">Canların bitti!</h1>
        <p className="mt-2 max-w-sm text-center text-sm font-semibold text-mut">Üzülme, her hata bir öğrenme fırsatı. Mağazadan can doldur ya da Süper'e geç!</p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Button size="lg" full href="/premium">
            <Crown className="size-4.5" /> Süper'e Geç — Sınırsız Can
          </Button>
          <Button variant="outline" size="lg" full onClick={restart}>
            <RotateCcw className="size-4.5" /> Pratik Modunda Tekrar Dene
          </Button>
          <Button variant="ghost" full href="/lessons">
            Dersten Çık
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════ DERS ═══════════════════════════════ */
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AnimatePresence>
        {intro && (
          <motion.div exit={{ opacity: 0, scale: 1.06 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gradient-to-b from-primary to-primarystrong px-6">
            <div className="dot-grid absolute inset-0 opacity-15" />
            <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="relative">
              <Mascot mood="wave" size={170} className="drop-shadow-2xl" />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-center font-display text-4xl font-bold uppercase tracking-tight text-white drop-shadow-md sm:text-5xl">
              {lesson.title}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 text-center text-sm font-extrabold text-white/85">
              {questions.length} soru · +{lesson.xpReward} XP · Ünite {lesson.unitNumber} Ders {lesson.lessonNumber}
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-7 flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.25 }} className="size-2.5 rounded-full bg-white" />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-5">
        <button onClick={() => setExitOpen(true)} className="cursor-pointer rounded-xl p-2 text-mut transition hover:bg-raise hover:text-ink" aria-label="Dersi kapat">
          <X className="size-6" />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full border border-line/60 bg-raise">
          <motion.div animate={{ width: `${((qi + (phase === "feedback" ? 1 : 0)) / Math.max(1, questions.length)) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative h-full rounded-full bg-gradient-to-b from-[#7ce83c] to-primary">
            <div className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/30" />
          </motion.div>
        </div>
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div key={combo} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className={cn("flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 font-display text-sm font-bold", combo >= 5 ? "border-accent bg-accentsoft text-accent" : "border-gold/50 bg-goldsoft text-gold")}>
              <Flame className={cn("size-4", combo >= 5 ? "fill-accent" : "fill-gold")} /> x{combo}
            </motion.div>
          )}
        </AnimatePresence>
        {wallet.isSuper ? (
          <span className="flex items-center gap-1.5 rounded-xl border-2 border-gold/50 bg-goldsoft px-3 py-1.5 font-display text-sm font-bold text-gold">
            <Crown className="size-4 fill-current" /> ∞
          </span>
        ) : (
          <motion.div key={hearts} animate={{ scale: [1, 1.15, 1] }} className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Heart key={i} className={cn("size-5 transition-all", i < hearts ? "fill-danger text-danger" : "scale-90 text-linestrong")} />
            ))}
          </motion.div>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-44">
        <AnimatePresence mode="wait">
          <motion.div key={qi} initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {q && (
              <>
                {q.type === "sec" && <SecQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "dinle" && <DinleQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "eslestir" && <EslestirQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "resim" && <ResimQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "sirala" && <SiralaQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "bosluk" && <BoslukQuestion q={q} onAnswer={handleAnswer} />}
                {q.type === "konuş" && <KonusQuestion q={q} onAnswer={handleAnswer} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 34 }} className={cn("fixed inset-x-0 bottom-0 z-50 border-t-2 pb-[env(safe-area-inset-bottom)]", lastOk ? "border-primary/30 bg-primarysoft" : "border-danger/30 bg-dangersoft")}>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
              <motion.div initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 17 }} className="hidden shrink-0 sm:block">
                <Mascot mood={lastOk ? "joy" : "sad"} size={92} />
              </motion.div>
              <div className="flex flex-1 items-start gap-3.5">
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 320, damping: 15 }} className={cn("flex size-12 shrink-0 items-center justify-center rounded-full text-2xl", lastOk ? "bg-primary text-primaryink" : "bg-danger text-white")}>
                  {lastOk ? "✓" : "✕"}
                </motion.span>
                <div>
                  <p className={cn("font-display text-lg font-bold", lastOk ? "text-primarystrong" : "text-danger")}>{lastOk ? praise[(qi + correct) % praise.length] : "Doğru cevap buydu"}</p>
                  <p className={cn("mt-0.5 text-sm font-bold", lastOk ? "text-primarystrong/80" : "text-danger/80")}>{lastOk ? "+5 XP ⚡" : correctAnswerOf(q)}</p>
                </div>
              </div>
              <Button size="lg" onClick={next} variant={lastOk ? "primary" : "danger"} className="sm:w-48">
                Devam Et
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <div className="p-7 text-center">
          <Mascot mood="sad" size={100} className="mx-auto" />
          <h3 className="mt-2 font-display text-xl font-bold text-ink">Dersten çıkıyor musun?</h3>
          <p className="mt-2 text-sm font-semibold text-mut">Şimdi çıkarsan bu dersteki ilerlemen kaybolmaz ama XP kazanamazsın.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button size="lg" onClick={() => setExitOpen(false)}>
              Devam Et — Neredeyse Bitiyor 💪
            </Button>
            <Button variant="ghost" onClick={() => router.push("/lessons")}>
              Dersten Çık
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
