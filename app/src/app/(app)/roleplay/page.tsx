"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Lightbulb, Mic, Send, Swords, X } from "lucide-react";
import { Badge, Button, Card, ProgressRing, useToast } from "@/components/ui";
import { postJson } from "@/lib/api";
import { ROLEPLAY_CHARACTERS } from "@/lib/groq-client";
import { cn, fireConfetti } from "@/lib/utils";

type Char = {
  id: string;
  name: string;
  emoji: string;
  scenario: string;
  difficulty: number;
};

type Msg = { role: "user" | "ai"; content: string };

type Report = {
  score: number;
  grammar: number;
  vocabulary: number;
  communication: number;
  mistakes: string[];
  suggestions: string[];
};

const CHARS: Char[] = Object.values(ROLEPLAY_CHARACTERS);

export default function RoleplayPage() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Char | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const start = async (c: Char) => {
    setSelected(c);
    setMessages([]);
    setReport(null);
    setHints([]);
    setLoading(true);
    try {
      const data = await postJson<{ reply: string }>("/api/ai/roleplay", { character: c.id, action: "start" });
      setMessages([{ role: "ai", content: data.reply }]);
    } catch {
      setMessages([{ role: "ai", content: `Merhaba! Ben ${c.name} ${c.emoji}. ${c.scenario} senaryosuna hoş geldin!` }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !selected || typing) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: msg }];
    setMessages(history);
    setTyping(true);
    setShowHints(false);
    try {
      const data = await postJson<{ reply: string }>("/api/ai/roleplay", {
        character: selected.id,
        action: "message",
        message: msg,
        history: history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
      });
      setMessages((m) => [...m, { role: "ai", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", content: "Anladım! Devam edelim, bir şey daha söyle." }]);
    } finally {
      setTyping(false);
    }
  };

  const getHints = async () => {
    if (!selected) return;
    setShowHints(true);
    try {
      const data = await postJson<{ hints: string[] }>("/api/ai/roleplay", {
        character: selected.id,
        action: "hint",
        history: messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
      });
      setHints(data.hints || []);
    } catch {
      setHints(["Could you help me please?", "What do you recommend?", "Thank you so much!"]);
    }
  };

  const finish = async () => {
    if (!selected || messages.length < 2) {
      toast("En az birkaç mesajlaş sonra bitir", { type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const data = await postJson<{ report: Report }>("/api/ai/roleplay", {
        character: selected.id,
        action: "finish",
        history: messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
      });
      setReport(data.report);
      if (data.report.score >= 70) fireConfetti(true);
    } catch {
      setReport({
        score: 75,
        grammar: 70,
        vocabulary: 80,
        communication: 78,
        mistakes: ["I am agree → I agree", "more better → better", "I go yesterday → I went yesterday"],
        suggestions: ["Düzensiz fiilleri tekrar et", "Could you...? kalıbını kullan", "Her gün 5 dk roleplay yap"],
      });
      fireConfetti();
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelected(null);
    setMessages([]);
    setReport(null);
    setHints([]);
  };

  if (report) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] border-2 border-line bg-surface p-8 text-center shadow-pop">
          <p className="text-5xl">{report.score >= 80 ? "🏆" : report.score >= 60 ? "⭐" : "💪"}</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Performans Raporu</h1>
          <p className="mt-1 text-sm font-semibold text-mut">{selected?.name} ile konuşma tamamlandı</p>
          <div className="mt-6 flex justify-center">
            <ProgressRing value={report.score} size={140} stroke={12} color="var(--violet)">
              <p className="font-display text-3xl font-bold text-ink">{report.score}</p>
              <p className="text-[10px] font-extrabold uppercase text-mut">puan</p>
            </ProgressRing>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Gramer", v: report.grammar },
              { label: "Kelime", v: report.vocabulary },
              { label: "İletişim", v: report.communication },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-bg p-3">
                <p className="font-display text-xl font-bold text-ink">{s.v}</p>
                <p className="text-[10px] font-extrabold uppercase text-mut">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-left">
            <p className="text-xs font-extrabold uppercase tracking-widest text-danger">Yanlışlar</p>
            <ul className="mt-2 space-y-1.5">
              {report.mistakes.map((m, i) => (
                <li key={i} className="rounded-xl bg-dangersoft/50 px-3 py-2 text-sm font-semibold text-ink">
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 text-left">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Öneriler</p>
            <ul className="mt-2 space-y-1.5">
              {report.suggestions.map((s, i) => (
                <li key={i} className="rounded-xl bg-primarysoft/50 px-3 py-2 text-sm font-semibold text-ink">
                  💡 {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" full onClick={() => start(selected!)}>
              Tekrar Dene
            </Button>
            <Button full onClick={reset}>
              Başka Karakter
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-violet text-2xl shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)]">🎭</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">AI Roleplay</h1>
              <p className="text-sm font-semibold text-mut">10 karakterle gerçek hayat pratiği yap</p>
            </div>
          </div>
        </motion.div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHARS.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => start(c)}
              className="group cursor-pointer rounded-3xl border-2 border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-violet hover:shadow-[0_6px_0_color-mix(in_srgb,var(--violet)_30%,var(--line))]"
            >
              <span className="text-4xl">{c.emoji}</span>
              <p className="mt-3 font-display text-lg font-bold text-ink">{c.name}</p>
              <p className="mt-1 text-xs font-semibold text-mut">{c.scenario}</p>
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }, (_, j) => (
                  <span key={j} className={cn("text-sm", j < c.difficulty ? "text-gold" : "text-mut/30")}>
                    ★
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-3xl flex-col lg:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between rounded-3xl border-2 border-line bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.emoji}</span>
          <div>
            <p className="font-display text-base font-bold text-ink">{selected.name}</p>
            <p className="text-xs font-semibold text-mut">{selected.scenario}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={getHints}>
            <Lightbulb className="size-4" /> İpucu
          </Button>
          <Button size="sm" variant="danger" onClick={finish} loading={loading}>
            Bitir
          </Button>
          <button onClick={reset} className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-line text-mut hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-3xl border-2 border-line bg-surface/60 p-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", m.role === "user" && "justify-end")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold", m.role === "ai" ? "rounded-tl-md border-2 border-line bg-bg text-ink" : "rounded-tr-md bg-violet text-white")}>{m.content}</div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-1.5 rounded-2xl border-2 border-line bg-bg px-5 py-3 w-fit">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} className="size-2 rounded-full bg-violet" />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <AnimatePresence>
        {showHints && hints.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 rounded-2xl border-2 border-gold/40 bg-goldsoft p-3">
            <p className="text-xs font-extrabold text-gold">Bu durumda şunu söyleyebilirsin:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {hints.map((h) => (
                <button key={h} onClick={() => send(h)} className="cursor-pointer rounded-xl border-2 border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:border-gold">
                  {h}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-line bg-surface p-2.5 shadow-card focus-within:border-violet">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Karaktere cevap yaz..." className="h-11 flex-1 bg-transparent px-3 text-[15px] font-semibold text-ink outline-none" />
        <Button size="sm" onClick={() => send()} disabled={!input.trim() || typing}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
