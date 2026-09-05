"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Volume2, X } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { getJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

type Article = {
  id: number;
  title: string;
  emoji: string;
  category: string;
  readingTime: number;
  difficulty: string;
  simpleContent: string;
  mediumContent: string;
  originalContent: string;
  questionsJson: { q: string; options: string[]; answer: number }[];
};

const CATS = ["all", "world", "sports", "technology", "science", "culture"] as const;
const LEVELS = ["simple", "medium", "original"] as const;

export default function NewsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Article[]>([]);
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [active, setActive] = useState<Article | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("simple");
  const [wordPopup, setWordPopup] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    getJson<{ articles: Article[] }>(`/api/content/news${cat !== "all" ? `?category=${cat}` : ""}`)
      .then((d) => setList(d.articles || []))
      .catch(() => setList([]));
  }, [cat]);

  const content = active
    ? level === "simple"
      ? active.simpleContent
      : level === "medium"
        ? active.mediumContent
        : active.originalContent
    : "";

  const speak = () => {
    if (!content || typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(content);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const open = (a: Article) => {
    setActive(a);
    setLevel("simple");
    setAnswers({});
    setQuizDone(false);
  };

  const submitQuiz = () => {
    if (!active) return;
    let c = 0;
    active.questionsJson.forEach((q, i) => {
      if (answers[i] === q.answer) c++;
    });
    setQuizDone(true);
    if (c === active.questionsJson.length) {
      fireConfetti();
      toast(`Tüm sorular doğru! +25 XP 📰`);
    } else toast(`${c}/${active.questionsJson.length} doğru`, { type: "info" });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_3px_0_var(--primary-strong)]">
          <Newspaper className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Haberler</h1>
          <p className="text-sm font-semibold text-mut">3 seviyede oku, kelime öğren, quiz çöz</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 cursor-pointer rounded-xl border-2 px-4 py-2 text-xs font-extrabold uppercase", cat === c ? "border-primary bg-primary text-white" : "border-line bg-surface text-mut")}>
            {c === "all" ? "Tümü" : c}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => (
          <motion.button key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => open(a)} className="cursor-pointer rounded-3xl border-2 border-line bg-surface p-5 text-left shadow-card transition hover:-translate-y-1 hover:border-primary">
            <span className="text-4xl">{a.emoji}</span>
            <p className="mt-3 font-display text-base font-bold leading-snug text-ink">{a.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary">{a.category}</Badge>
              <Badge tone="mut">{a.readingTime} dk</Badge>
              <Badge tone="gold">{a.difficulty}</Badge>
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
                  <p className="text-xs font-semibold text-mut">
                    {active.category} · {active.readingTime} dk
                  </p>
                </div>
                <button onClick={() => setActive(null)} className="cursor-pointer rounded-xl border-2 border-line p-2 text-mut">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)} className={cn("cursor-pointer rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase", level === l ? "border-primary bg-primarysoft text-primarystrong" : "border-line text-mut")}>
                    {l === "simple" ? "Basit A1-A2" : l === "medium" ? "Orta B1-B2" : "Orijinal C1-C2"}
                  </button>
                ))}
                <Button size="sm" variant="outline" onClick={speak}>
                  <Volume2 className="size-4" /> Sesli Oku
                </Button>
              </div>

              <div className="p-5">
                <p className="text-[15px] font-semibold leading-relaxed text-ink">
                  {content.split(" ").map((w, i) => (
                    <button
                      key={i}
                      onClick={() => setWordPopup(w.replace(/[.,!?;:]/g, ""))}
                      className="cursor-pointer rounded px-0.5 hover:bg-goldsoft hover:text-gold"
                    >
                      {w}{" "}
                    </button>
                  ))}
                </p>
              </div>

              <div className="border-t-2 border-line p-5">
                <p className="font-display text-base font-bold text-ink">Anlama Soruları</p>
                <div className="mt-3 space-y-3">
                  {active.questionsJson.map((q, qi) => (
                    <div key={qi} className="rounded-2xl bg-bg p-3">
                      <p className="text-sm font-extrabold text-ink">
                        {qi + 1}. {q.q}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
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
                                "cursor-pointer rounded-xl border-2 px-3 py-1.5 text-xs font-bold",
                                !show && sel && "border-primary bg-primarysoft",
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
                </div>
                {!quizDone && (
                  <Button full className="mt-4" onClick={submitQuiz} disabled={Object.keys(answers).length < active.questionsJson.length}>
                    Cevapları Kontrol Et
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wordPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4" onClick={() => setWordPopup(null)}>
            <div className="rounded-2xl border-2 border-line bg-surface p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-xl font-bold text-ink">{wordPopup}</p>
              <p className="mt-1 text-sm font-semibold text-mut">Kelimeye tıklayarak anlamını öğren. Sözlükte ara: /dictionary</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" href={`/dictionary?q=${encodeURIComponent(wordPopup)}`}>
                  Sözlükte Aç
                </Button>
                <Button size="sm" variant="outline" onClick={() => setWordPopup(null)}>
                  Kapat
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
