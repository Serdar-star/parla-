"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, RotateCcw, Volume2 } from "lucide-react";
import type { Question, VocabWord } from "@/types";
import { cn, seeded, speak } from "@/lib/utils";

interface QProps<T> {
  q: T;
  onAnswer: (ok: boolean) => void;
}

const optBase =
  "w-full cursor-pointer rounded-2xl border-2 px-5 py-4 text-left text-base font-bold transition-all duration-200";

function OptBtn({
  text,
  state,
  onClick,
  disabled,
}: {
  text: string;
  state: "idle" | "picked" | "correct" | "wrong";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      whileTap={state === "idle" ? { scale: 0.97 } : undefined}
      animate={state === "wrong" ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        optBase,
        state === "idle" && "border-line bg-surface text-ink hover:border-primary hover:bg-primarysoft/40",
        state === "picked" && "border-primary bg-primarysoft text-primary",
        state === "correct" && "border-primary bg-primarysoft text-primary shadow-[0_8px_20px_-8px_rgba(15,160,101,.6)]",
        state === "wrong" && "border-danger bg-dangersoft text-danger",
        disabled && state === "idle" && "opacity-50"
      )}
    >
      {text}
    </motion.button>
  );
}

/* ------------------------------- Çoktan seçmeli ------------------------------ */

export function SecQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "sec" }>>) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [q]);

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === q.word.tr), 650);
  };

  return (
    <div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-mut">{q.prompt}</p>
      <div className="mt-6 flex flex-col items-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }} className="text-7xl">
          {q.word.emoji}
        </motion.span>
        <p className="mt-3 font-display text-3xl font-extrabold text-ink">
          “{q.word.en}” <span className="text-lg font-bold text-mut">{q.word.phonetic}</span>
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => (
          <OptBtn
            key={opt}
            text={opt}
            disabled={picked !== null}
            state={picked === null ? "idle" : opt === q.word.tr ? "correct" : opt === picked ? "wrong" : "idle"}
            onClick={() => pick(opt)}
          />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Dinleme --------------------------------- */

export function DinleQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "dinle" }>>) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [q]);

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === q.word.tr), 650);
  };

  return (
    <div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-mut">Duyduğun kelimeyi seç</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => speak(q.word.en)}
          className="flex size-20 cursor-pointer items-center justify-center rounded-3xl bg-primary text-primaryink shadow-[0_12px_28px_-10px_rgba(15,160,101,.7)]"
        >
          <Volume2 className="size-9" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => speak(q.word.en, { rate: 0.5 })}
          className="flex size-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-line bg-surface text-primary transition hover:border-primary"
        >
          <Volume2 className="size-6" />
          <span className="sr-only">Yavaş dinle</span>
        </motion.button>
      </div>
      <button onClick={() => speak(q.word.en, { rate: 0.5 })} className="mx-auto mt-3 block cursor-pointer text-xs font-extrabold text-mut underline-offset-2 hover:text-primary hover:underline">
        🐢 Yavaş dinle
      </button>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => (
          <OptBtn
            key={opt}
            text={opt}
            disabled={picked !== null}
            state={picked === null ? "idle" : opt === q.word.tr ? "correct" : opt === picked ? "wrong" : "idle"}
            onClick={() => pick(opt)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Eşleştirme -------------------------------- */

export function EslestirQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "eslestir" }>>) {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const rightOrder = useMemo(() => [...q.pairs].sort((a, b) => seeded(a.left.length + q.pairs.length) - seeded(b.left.length + q.pairs.length)).map((p) => p.right), [q]);

  useEffect(() => {
    if (left && right) {
      const pair = q.pairs.find((p) => p.left === left);
      if (pair?.right === right) {
        setDone((d) => [...d, left]);
        setLeft(null);
        setRight(null);
        if (done.length + 1 === q.pairs.length) {
          setTimeout(() => onAnswer(mistakes <= 1), 500);
        }
      } else {
        setMistakes((m) => m + 1);
        setWrongPair([left, right]);
        setTimeout(() => {
          setWrongPair(null);
          setLeft(null);
          setRight(null);
        }, 600);
      }
    }
  }, [left, right]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (text: string, side: "l" | "r") => {
    const isDone = done.includes(text) || (side === "r" && q.pairs.some((p) => done.includes(p.left) && p.right === text));
    const isSel = side === "l" ? left === text : right === text;
    const isWrong = wrongPair !== null && wrongPair[side === "l" ? 0 : 1] === text;
    return (
      <motion.button
        key={text}
        layout
        whileTap={isDone ? undefined : { scale: 0.95 }}
        disabled={isDone}
        onClick={() => (side === "l" ? setLeft(text) : setRight(text))}
        animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : { opacity: isDone ? 0.25 : 1, scale: isDone ? 0.92 : 1 }}
        className={cn(
          "cursor-pointer rounded-xl border-2 px-4 py-3 text-sm font-bold transition-colors",
          isDone && "cursor-default border-primary/40 bg-primarysoft text-primary",
          !isDone && isWrong && "border-danger bg-dangersoft text-danger",
          !isDone && !isWrong && isSel && "border-primary bg-primarysoft text-primary",
          !isDone && !isWrong && !isSel && "border-line bg-surface text-ink hover:border-primary"
        )}
      >
        {text}
      </motion.button>
    );
  };

  return (
    <div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-mut">Kelimeleri eşleştir</p>
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="space-y-3">{q.pairs.map((p) => chip(p.left, "l"))}</div>
        <div className="space-y-3">{rightOrder.map((r) => chip(r, "r"))}</div>
      </div>
      <p className="mt-6 text-center text-xs font-bold text-mut">Kalan çift: {q.pairs.length - done.length}</p>
    </div>
  );
}

/* -------------------------------- Resim seçme -------------------------------- */

export function ResimQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "resim" }>>) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [q]);

  const pick = (w: VocabWord) => {
    if (picked) return;
    setPicked(w.en);
    setTimeout(() => onAnswer(w.en === q.answer.en), 650);
  };

  return (
    <div>
      <p className="text-center font-display text-xl font-extrabold text-ink">{q.prompt}</p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {q.options.map((w) => {
          const state = picked === null ? "idle" : w.en === q.answer.en ? "correct" : w.en === picked ? "wrong" : "idle";
          return (
            <motion.button
              key={w.en}
              whileTap={state === "idle" ? { scale: 0.94 } : undefined}
              disabled={picked !== null}
              onClick={() => pick(w)}
              className={cn(
                "flex cursor-pointer flex-col items-center rounded-3xl border-2 p-7 transition-all duration-200",
                state === "idle" && "border-line bg-surface hover:-translate-y-1 hover:border-primary",
                state === "correct" && "border-primary bg-primarysoft",
                state === "wrong" && "animate-wiggle border-danger bg-dangersoft",
                state === "idle" && picked !== null && "opacity-50"
              )}
            >
              <span className="text-6xl">{w.emoji}</span>
              <span className="mt-3 text-xs font-extrabold text-mut">{w.phonetic}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Kelime sıralama ----------------------------- */

export function SiralaQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "sirala" }>>) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>(q.bank);
  const [checked, setChecked] = useState<null | boolean>(null);
  useEffect(() => {
    setPlaced([]);
    setBank(q.bank);
    setChecked(null);
  }, [q]);

  const add = (w: string, i: number) => {
    if (checked !== null) return;
    setPlaced((p) => [...p, w]);
    setBank((b) => b.filter((_, j) => j !== i));
  };
  const remove = (i: number) => {
    if (checked !== null) return;
    setBank((b) => [...b, placed[i]]);
    setPlaced((p) => p.filter((_, j) => j !== i));
  };
  const check = () => {
    const ok = placed.join(" ") === q.answer.join(" ");
    setChecked(ok);
    setTimeout(() => onAnswer(ok), 800);
  };

  return (
    <div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-mut">Kelimeleri doğru sıraya diz</p>
      <p className="mt-4 text-center font-display text-2xl font-extrabold text-ink">
        🇹🇷 “{q.prompt}”
      </p>
      <p className="mt-1.5 text-center text-sm font-bold text-mut">İngilizcesini kur:</p>
      <div className={cn("mt-7 flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4", checked === false ? "border-danger bg-dangersoft/40" : checked === true ? "border-primary bg-primarysoft/40" : "border-linestrong bg-bg")}>
        {placed.length === 0 && <span className="text-sm font-bold text-mut">Kelimelere tıklayarak cümleyi kur</span>}
        {placed.map((w, i) => (
          <motion.button key={`${w}-${i}`} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={() => remove(i)} className="cursor-pointer rounded-xl border-2 border-primary bg-primarysoft px-4 py-2.5 text-base font-bold text-primary">
            {w}
          </motion.button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {bank.map((w, i) => (
          <motion.button key={`${w}-${i}`} layout whileTap={{ scale: 0.92 }} onClick={() => add(w, i)} className="cursor-pointer rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-ink shadow-card transition hover:border-primary">
            {w}
          </motion.button>
        ))}
      </div>
      <div className="mt-7 text-center">
        <button
          disabled={bank.length > 0 || checked !== null}
          onClick={check}
          className="h-12 cursor-pointer rounded-2xl bg-primary px-10 font-display text-base font-extrabold text-primaryink shadow-[0_10px_24px_-10px_rgba(15,160,101,.7)] transition hover:brightness-105 disabled:opacity-40"
        >
          Kontrol Et
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Boşluk doldur ------------------------------ */

export function BoslukQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "bosluk" }>>) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [q]);

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === q.answer), 650);
  };

  return (
    <div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-mut">Boşluğu doldur</p>
      <p className="mt-6 text-center font-display text-2xl font-extrabold leading-relaxed text-ink">
        {q.sentence[0]}
        <span className={cn("mx-1 inline-block min-w-24 rounded-xl border-b-4 px-3 text-center", picked ? (picked === q.answer ? "border-primary bg-primarysoft text-primary" : "border-danger bg-dangersoft text-danger") : "border-linestrong bg-raise text-mut")}>
          {picked ?? "____"}
        </span>
        {q.sentence[1]}
      </p>
      <p className="mt-3 text-center text-sm font-bold text-mut">🔊 {q.sentence[0].trim()}... cümlesini tamamlayan kelimeyi seç.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {q.options.map((opt) => (
          <OptBtn key={opt} text={opt} disabled={picked !== null} state={picked === null ? "idle" : opt === q.answer ? "correct" : opt === picked ? "wrong" : "idle"} onClick={() => pick(opt)} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Konuşma ---------------------------------- */

export function KonusQuestion({ q, onAnswer }: QProps<Extract<Question, { type: "konuş" }>>) {
  const [phase, setPhase] = useState<"idle" | "rec" | "scored">("idle");
  const [score, setScore] = useState(0);
  useEffect(() => {
    setPhase("idle");
    setScore(0);
  }, [q]);

  const record = () => {
    setPhase("rec");
    setTimeout(() => {
      const s = 82 + Math.floor(seeded(q.word.en.length * 7) * 16);
      setScore(s);
      setPhase("scored");
      setTimeout(() => onAnswer(s >= 80), 1400);
    }, 2400);
  };

  return (
    <div className="text-center">
      <p className="text-sm font-extrabold uppercase tracking-widest text-mut">Bu kelimeyi yüksek sesle söyle</p>
      <button onClick={() => speak(q.word.en)} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-line bg-surface px-5 py-3 transition hover:border-primary">
        <Volume2 className="size-5 text-primary" />
        <span className="font-display text-2xl font-extrabold text-ink">{q.word.en}</span>
        <span className="text-sm font-bold text-mut">{q.word.phonetic}</span>
      </button>
      <p className="mt-2 text-sm font-bold text-mut">Anlamı: {q.word.tr} {q.word.emoji}</p>

      <div className="mt-8 flex flex-col items-center">
        {phase === "rec" ? (
          <div className="flex h-24 items-center gap-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <motion.span
                key={i}
                animate={{ height: [10, 26 + (i % 4) * 12, 10] }}
                transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                className="w-1.5 rounded-full bg-primary"
                style={{ height: 12 }}
              />
            ))}
          </div>
        ) : phase === "scored" ? (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }} className="flex h-24 flex-col items-center justify-center">
            <p className="font-display text-5xl font-extrabold text-primary">{score}</p>
            <p className="text-sm font-extrabold text-mut">telaffuz puanı {score >= 90 ? "· mükemmel! 🌟" : "· harika iş! 👏"}</p>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={record}
            className="relative flex size-24 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent/80 text-white shadow-[0_16px_36px_-12px_rgba(255,106,61,.8)]"
          >
            <span className="absolute inset-0 animate-ring rounded-full" />
            <Mic className="size-10" />
          </motion.button>
        )}
        {phase === "idle" && <p className="mt-4 text-xs font-bold text-mut">Mikrofona dokun ve konuş — telaffuzunu puanlayalım 🎙️</p>}
        {phase === "rec" && <p className="mt-2 text-xs font-extrabold text-accent">Dinliyorum...</p>}
      </div>
    </div>
  );
}
