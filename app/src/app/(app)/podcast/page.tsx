"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { Badge, Button, Card, ProgressBar, useToast } from "@/components/ui";
import { getJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

type Podcast = {
  id: number;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  category: string;
  emoji: string;
  transcriptJson: { time: number; text: string; tr: string }[];
  questionsJson: { q: string; options: string[]; answer: number }[];
};

export default function PodcastPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Podcast[]>([]);
  const [active, setActive] = useState<Podcast | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<"player" | "quiz">("player");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    getJson<{ podcasts: Podcast[] }>("/api/content/podcasts")
      .then((d) => setList(d.podcasts || []))
      .catch(() => setList([]));
  }, []);

  useEffect(() => {
    if (!playing || !active) return;
    const t = setInterval(() => {
      setTime((x) => {
        if (x >= active.duration) {
          setPlaying(false);
          return active.duration;
        }
        return x + speed;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, active, speed]);

  const activeLine = useMemo(() => {
    if (!active) return -1;
    let idx = 0;
    active.transcriptJson.forEach((l, i) => {
      if (time >= l.time) idx = i;
    });
    return idx;
  }, [active, time]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const open = (p: Podcast) => {
    setActive(p);
    setTime(0);
    setPlaying(false);
    setTab("player");
    setAnswers({});
    setQuizDone(false);
  };

  const submitQuiz = () => {
    if (!active) return;
    let correct = 0;
    active.questionsJson.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setQuizDone(true);
    if (correct === active.questionsJson.length) {
      fireConfetti(true);
      toast(`Mükemmel! +30 XP 🎧`, { desc: `${correct}/${active.questionsJson.length} doğru` });
    } else {
      toast(`${correct}/${active.questionsJson.length} doğru`, { type: "info" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_3px_0_color-mix(in_srgb,var(--accent)_55%,black)]">
          <Headphones className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Podcast Kütüphanesi</h1>
          <p className="text-sm font-semibold text-mut">Dinle, takip et, quiz çöz</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((p, i) => (
          <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => open(p)} className="cursor-pointer rounded-3xl border-2 border-line bg-surface p-5 text-left shadow-card transition hover:-translate-y-1 hover:border-accent">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-ink">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold text-mut">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="accent">{fmt(p.duration)}</Badge>
                  <Badge tone="mut">{p.difficulty}</Badge>
                  <Badge tone="azure">{p.category}</Badge>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border-2 border-line bg-surface shadow-pop">
              <div className="flex items-center justify-between border-b-2 border-line px-5 py-4">
                <div>
                  <p className="font-display text-lg font-bold text-ink">
                    {active.emoji} {active.title}
                  </p>
                  <p className="text-xs font-semibold text-mut">{active.difficulty} · {active.category}</p>
                </div>
                <button onClick={() => setActive(null)} className="cursor-pointer rounded-xl border-2 border-line p-2 text-mut">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex gap-2 px-5 pt-4">
                <button onClick={() => setTab("player")} className={cn("cursor-pointer rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase", tab === "player" ? "border-accent bg-accentsoft text-accent" : "border-line text-mut")}>
                  Oynatıcı
                </button>
                <button onClick={() => setTab("quiz")} className={cn("cursor-pointer rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase", tab === "quiz" ? "border-accent bg-accentsoft text-accent" : "border-line text-mut")}>
                  Quiz
                </button>
              </div>

              {tab === "player" && (
                <div className="p-5">
                  {/* Fake waveform */}
                  <div className="mb-4 flex h-16 items-end justify-center gap-1 rounded-2xl bg-bg px-4 py-3">
                    {Array.from({ length: 40 }, (_, i) => (
                      <motion.span key={i} animate={playing ? { height: [8, 12 + (i % 7) * 5, 8] } : {}} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.03 }} className="w-1.5 rounded-full bg-accent" style={{ height: 8 + (i % 5) * 6 }} />
                    ))}
                  </div>
                  <ProgressBar value={(time / active.duration) * 100} barClassName="from-accent to-gold" />
                  <div className="mt-1 flex justify-between text-[10px] font-extrabold text-mut">
                    <span>{fmt(time)}</span>
                    <span>{fmt(active.duration)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button onClick={() => setTime((t) => Math.max(0, t - 10))} className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-bg text-ink">
                      <RotateCcw className="size-4" />
                    </button>
                    <button onClick={() => setPlaying((p) => !p)} className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_0_color-mix(in_srgb,var(--accent)_55%,black)]">
                      {playing ? <Pause className="size-6" /> : <Play className="size-6 fill-current" />}
                    </button>
                    <button onClick={() => setTime((t) => Math.min(active.duration, t + 10))} className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-bg text-ink">
                      <RotateCw className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex justify-center gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
                      <button key={s} onClick={() => setSpeed(s)} className={cn("cursor-pointer rounded-lg border-2 px-2.5 py-1 text-[10px] font-extrabold", speed === s ? "border-accent bg-accentsoft text-accent" : "border-line text-mut")}>
                        {s}x
                      </button>
                    ))}
                  </div>

                  <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-mut">Transkript</p>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                    {active.transcriptJson.map((l, i) => (
                      <div key={i} className={cn("rounded-xl border-2 p-3", i === activeLine ? "border-accent bg-accentsoft" : "border-line bg-bg")}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-ink">{l.text}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(l.text).catch(() => {});
                              toast("Kopyalandı 📋");
                            }}
                            className="shrink-0 cursor-pointer text-[10px] font-extrabold text-mut hover:text-ink"
                          >
                            Kopyala
                          </button>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-mut">{l.tr}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "quiz" && (
                <div className="space-y-4 p-5">
                  {active.questionsJson.map((q, qi) => (
                    <div key={qi} className="rounded-2xl border-2 border-line bg-bg p-4">
                      <p className="text-sm font-extrabold text-ink">
                        {qi + 1}. {q.q}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.options.map((opt, oi) => {
                          const sel = answers[qi] === oi;
                          const show = quizDone;
                          const ok = oi === q.answer;
                          return (
                            <button
                              key={oi}
                              disabled={quizDone}
                              onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                              className={cn(
                                "cursor-pointer rounded-xl border-2 px-3 py-2 text-xs font-bold",
                                !show && sel && "border-accent bg-accentsoft",
                                !show && !sel && "border-line bg-surface",
                                show && ok && "border-primary bg-primarysoft text-primarystrong",
                                show && sel && !ok && "border-danger bg-dangersoft text-danger"
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!quizDone && (
                    <Button full onClick={submitQuiz} disabled={Object.keys(answers).length < active.questionsJson.length}>
                      Quiz&apos;i Bitir
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
