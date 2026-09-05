"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, ChevronRight, Clapperboard, Diamond, Lock, MessageSquareQuote, Play, Star, X, Zap } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { episodes, type Episode, type StoryBeat } from "@/data/stories";
import { useApp } from "@/stores/app";
import { cn, fireConfetti, playTone } from "@/lib/utils";

type LogEntry =
  | { role: "char"; who: number; text: string; hint?: string }
  | { role: "user"; text: string }
  | { role: "narrator"; text: string; ok?: boolean }
  | { role: "scene"; text: string };

const castBios: Record<string, { bio: string; role: string }> = {
  Lina: { bio: "Kahvesiz güne başlayamayan maceraperest.", role: "Baş kahraman" },
  Mert: { bio: "Soğukkanlı problem çözücü, espri kasası.", role: "Baş kahraman" },
  Barista: { bio: "Köşe Kafe'nin güler yüzlü latte ustası.", role: "Yardımcı" },
  Görevli: { bio: "Kayıp eşyaların Sherlock Holmes'ü.", role: "Yardımcı" },
};

function CharAvatar({ ep, who, size = 40 }: { ep: Episode; who: number; size?: number }) {
  const c = ep.cast[who];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-black/10 shadow-card"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `linear-gradient(135deg, hsl(${c.hue} 70% 55%), hsl(${c.hue + 40} 72% 42%))` }}
    >
      {c.emoji}
    </span>
  );
}

export default function StoriesPage() {
  const [active, setActive] = useState<Episode | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("parla-stories-done");
      if (raw) setDoneIds(JSON.parse(raw));
    } catch {
      /* yok say */
    }
  }, []);

  const markDone = (id: string) => {
    setDoneIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem("parla-stories-done", JSON.stringify(next));
      } catch {
        /* yok say */
      }
      return next;
    });
  };

  if (active) return <StoryPlayer episode={active} onExit={() => setActive(null)} onDone={markDone} />;

  const featured = episodes.find((e) => !e.locked && !doneIds.includes(e.id)) ?? episodes[0];
  const phraseCount = episodes.filter((e) => doneIds.includes(e.id)).reduce((a, e) => a + e.phrases.length, 0);
  const castList = episodes.flatMap((e) => e.cast).filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);

  return (
    <div className="mx-auto max-w-4xl">
      {/* başlık */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Hikayeler 🎬</h1>
          <p className="mt-2 text-sm font-semibold text-mut">Lina ve Mert'in sinematik maceraları — seçimlerin hikâyeyi değiştirir.</p>
        </div>
        <Badge tone="violet" className="normal-case tracking-normal">
          <MessageSquareQuote className="size-3.5" /> {phraseCount} replik toplandı
        </Badge>
      </motion.div>

      {/* öne çıkan bölüm — sinematik spot */}
      <motion.section initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-black/10 p-7 shadow-pop sm:p-10" style={{ background: `linear-gradient(120deg, hsl(${featured.hue} 72% 44%), hsl(${featured.hue + 38} 74% 34%))`, boxShadow: `0 8px 0 hsl(${featured.hue} 70% 26%)` }}>
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }} className="pointer-events-none absolute -right-10 -top-14 size-64 rounded-full bg-white/10 blur-3xl" />
          <motion.div animate={{ y: [0, 16, 0], rotate: [0, 4, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }} className="pointer-events-none absolute right-8 top-8 hidden text-8xl drop-shadow-2xl md:block">
            {featured.emoji}
          </motion.div>

          <div className="relative max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur">
                <Clapperboard className="size-3.5" /> Öne Çıkan Bölüm
              </span>
              {doneIds.includes(featured.id) && (
                <span className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1.5 text-[11px] font-extrabold text-white">
                  <Check className="size-3.5" /> Tamamlandı — tekrar izle
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl">{featured.title}</h2>
            <p className="mt-2 text-base font-semibold italic text-white/80">“{featured.tagline}”</p>
            <div className="mt-4 flex items-center gap-2">
              {featured.cast.map((c) => (
                <motion.span key={c.name} whileHover={{ y: -4 }} title={c.name} className="flex size-10 items-center justify-center rounded-full border-2 border-white/40 text-lg" style={{ background: `hsl(${c.hue} 70% 50%)` }}>
                  {c.emoji}
                </motion.span>
              ))}
              <span className="ml-1 text-xs font-extrabold text-white/70">· {featured.level} · {featured.minutes} · +{featured.xp} XP</span>
            </div>
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} className="mt-7">
              <button onClick={() => setActive(featured)} className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-7 py-4 font-display text-base font-semibold text-ink shadow-[0_5px_0_rgba(0,0,0,.25)] transition-all hover:brightness-105 active:translate-y-[5px] active:shadow-none">
                <Play className="size-5 fill-current" /> {doneIds.includes(featured.id) ? "Tekrar Oyna" : "Hikâyeye Gir"}
                <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* bölüm kartları */}
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        {episodes.map((ep, i) => (
          <motion.div key={ep.id} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {ep.locked ? (
              <div className="h-full rounded-3xl border-2 border-dashed border-linestrong bg-raise/40 p-6 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="text-5xl grayscale">{ep.emoji}</span>
                  <Badge tone="mut">Yakında</Badge>
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-mut">{ep.title}</h2>
                <p className="mt-1.5 text-sm font-semibold text-mut/80">{ep.desc}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-extrabold text-mut">
                  <Lock className="size-4" /> 2. bölümü bitirince açılır
                </p>
              </div>
            ) : (
              <motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} onClick={() => setActive(ep)} className="h-full w-full cursor-pointer rounded-3xl border-2 border-line bg-surface p-6 text-left shadow-card transition-shadow hover:shadow-pop">
                <div className="flex items-center justify-between">
                  <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4 }} className="text-5xl">
                    {ep.emoji}
                  </motion.span>
                  <div className="flex gap-2">
                    {doneIds.includes(ep.id) && (
                      <Badge tone="primary">
                        <Check className="size-3" /> Bitti
                      </Badge>
                    )}
                    <Badge tone="violet">{ep.level}</Badge>
                  </div>
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink">{ep.title}</h2>
                <p className="mt-1 text-xs font-bold italic text-mut">“{ep.tagline}”</p>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-mut">{ep.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ep.cast.slice(0, 3).map((c) => (
                      <span key={c.name} title={c.name} className="flex size-8 items-center justify-center rounded-full border-2 border-surface text-sm" style={{ background: `hsl(${c.hue} 70% 50%)` }}>
                        {c.emoji}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-primary">
                    <Zap className="size-4" /> +{ep.xp} XP <ChevronRight className="size-4" />
                  </span>
                </div>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {/* karakterler */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Karakterlerle Tanış 🎭</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {castList.map((c, i) => (
            <motion.div key={c.name} whileHover={{ y: -5, rotate: i % 2 ? 1.5 : -1.5 }} className="rounded-3xl border-2 border-line bg-surface p-5 text-center shadow-card">
              <motion.span whileHover={{ scale: 1.15 }} className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-black/10 text-3xl shadow-card" style={{ background: `linear-gradient(135deg, hsl(${c.hue} 70% 55%), hsl(${c.hue + 40} 72% 42%))` }}>
                {c.emoji}
              </motion.span>
              <p className="mt-3 font-display text-base font-semibold text-ink">{c.name}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-violet">{castBios[c.name]?.role}</p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-mut">{castBios[c.name]?.bio}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* haftalık şerit */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-7">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-violetsoft text-2xl">🎬</span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Her salı yeni bölüm!</p>
              <p className="text-xs font-semibold text-mut">Bitirdiğin her hikâye replik kartları, XP ve elmas bırakır.</p>
            </div>
          </div>
          <Button variant="soft" href="/ai-teacher">
            <BookOpen className="size-4.5" /> AI ile Pratik Yap
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════ OYNATICI ═══════════════════════════════ */

function StoryPlayer({ episode, onExit, onDone }: { episode: Episode; onExit: () => void; onDone: (id: string) => void }) {
  const { settings, addGems } = useApp();
  const { toast } = useToast();
  const [beatIdx, setBeatIdx] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [quizPicked, setQuizPicked] = useState<number | null>(null);
  const [bestCount, setBestCount] = useState(0);
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const gemsGiven = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const beat: StoryBeat | undefined = episode.beats[beatIdx];
  const sfx = (k: "correct" | "wrong" | "win") => settings.sound && playTone(k);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log, beatIdx, done, typing]);

  useEffect(() => {
    setHintShown(false);
    if (beat?.kind === "line") {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 850);
      return () => clearTimeout(t);
    }
  }, [beatIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done && !gemsGiven.current) {
      gemsGiven.current = true;
      addGems(15);
      onDone(episode.id);
      toast(`${episode.phrases.length} replik kartı kazandın 🎴`, { desc: "Hikâye koleksiyonuna eklendi." });
    }
  }, [done, addGems, onDone, episode.id, episode.phrases.length, toast]);

  const advance = (entry: LogEntry) => {
    const additions: LogEntry[] = [];
    if (beat?.kind === "line" && beat.scene) additions.push({ role: "scene", text: beat.scene });
    additions.push(entry);
    setLog((l) => [...l, ...additions]);
    setQuizPicked(null);
    if (beatIdx + 1 >= episode.beats.length) {
      setDone(true);
      sfx("win");
      fireConfetti(true);
    } else {
      setBeatIdx((i) => i + 1);
    }
  };

  const totalQuiz = episode.beats.filter((b) => b.kind === "quiz").length;
  const quizRight = log.filter((l) => l.role === "narrator" && l.text.startsWith("🧠 Doğru")).length + (beat?.kind === "quiz" && quizPicked !== null && quizPicked === beat.answer ? 1 : 0);

  /* ═══════════════════════════════ BİTİŞ ═════════════════════════════════ */
  if (done) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-10">
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="flex gap-2">
          {episode.cast.slice(0, 3).map((c, i) => (
            <motion.span key={c.name} animate={{ y: [0, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }} className="flex size-16 items-center justify-center rounded-full border-2 border-black/10 text-3xl shadow-pop" style={{ background: `hsl(${c.hue} 70% 50%)` }}>
              {c.emoji}
            </motion.span>
          ))}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-center font-display text-3xl font-bold text-ink">
          Perde Kapandı! 🎬
        </motion.h1>
        <p className="mt-2 text-center text-sm font-semibold text-mut">“{episode.title}” tamamlandı. Karakterlar seni alkışlıyor! 👏</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 grid w-full grid-cols-3 gap-3">
          <div className="rounded-2xl border-2 border-gold/40 bg-goldsoft p-4 text-center">
            <Zap className="mx-auto size-5 text-gold" />
            <p className="mt-1 font-display text-xl font-bold text-gold">+{episode.xp}</p>
            <p className="text-[10px] font-extrabold uppercase text-mut">XP</p>
          </div>
          <div className="rounded-2xl border-2 border-azure/40 bg-azuresoft p-4 text-center">
            <Diamond className="mx-auto size-5 fill-azure text-azure" />
            <p className="mt-1 font-display text-xl font-bold text-azure">+15</p>
            <p className="text-[10px] font-extrabold uppercase text-mut">Elmas</p>
          </div>
          <div className="rounded-2xl border-2 border-violet/40 bg-violetsoft p-4 text-center">
            <Star className="mx-auto size-5 fill-violet text-violet" />
            <p className="mt-1 font-display text-xl font-bold text-violet">{quizRight}/{totalQuiz}</p>
            <p className="text-[10px] font-extrabold uppercase text-mut">Anlama</p>
          </div>
        </motion.div>

        {/* replik kartları */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-5 w-full rounded-3xl border-2 border-line bg-surface p-6 shadow-card">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-mut">
            <MessageSquareQuote className="size-4 text-violet" /> Kazandığın Replik Kartları
          </p>
          <div className="mt-4 space-y-3">
            {episode.phrases.map((p, i) => (
              <motion.div
                key={p.en}
                initial={{ opacity: 0, x: -20, rotate: -2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ delay: 0.6 + i * 0.15, type: "spring", stiffness: 240, damping: 20 }}
                className="rounded-2xl border-2 border-violet/30 bg-gradient-to-r from-violetsoft to-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-[15px] font-semibold text-ink">“{p.en}”</p>
                  <Star className="size-4 shrink-0 fill-gold text-gold" />
                </div>
                <p className="mt-1 text-xs font-bold text-mut">{p.tr}</p>
                <span className="mt-2 inline-block rounded-lg bg-violetsoft px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-violet">{p.note}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" onClick={onExit} className="flex-1">
            <ArrowLeft className="size-4.5" /> Bölümler
          </Button>
          <Button size="lg" href="/dashboard" className="flex-[1.5]">
            Devam Et <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════ DİYALOG ═══════════════════════════════ */
  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-2xl flex-col lg:h-[calc(100vh-6rem)]">
      {/* üst bar — segment ilerleme */}
      <div className="flex items-center gap-4">
        <button onClick={onExit} className="cursor-pointer rounded-xl border-2 border-line bg-surface p-2 text-mut shadow-[0_3px_0_var(--line)] transition hover:text-ink active:translate-y-[3px] active:shadow-none" aria-label="Çık">
          <X className="size-5" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {episode.beats.map((_, i) => (
            <span key={i} className={cn("h-2.5 flex-1 rounded-full transition-colors duration-300", i < beatIdx ? "bg-violet" : i === beatIdx ? "bg-violet/50" : "bg-raise")} />
          ))}
        </div>
        <Badge tone="violet">
          {episode.emoji} {episode.level}
        </Badge>
      </div>

      {/* sohbet sahnesi */}
      <div className="relative mt-4 flex-1 overflow-hidden rounded-3xl border-2 border-line bg-surface/60">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44" style={{ background: `radial-gradient(560px 190px at 50% -40px, hsl(${episode.hue} 70% 50% / 0.14), transparent)` }} />
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <div className="text-center">
            <span className="rounded-full bg-raise px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-mut">
              🎬 {episode.title}
            </span>
          </div>
          <AnimatePresence initial={false}>
            {log.map((entry, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {entry.role === "scene" ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="my-3 flex items-center justify-center gap-3">
                    <span className="h-0.5 w-10 rounded-full bg-violet/40" />
                    <span className="rounded-full bg-ink px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-bg shadow-pop">{entry.text}</span>
                    <span className="h-0.5 w-10 rounded-full bg-violet/40" />
                  </motion.div>
                ) : (
                  <div className={cn("flex gap-2.5", entry.role === "user" && "flex-row-reverse")}>
                    {entry.role === "char" && <CharAvatar ep={episode} who={entry.who} size={38} />}
                    <div className={cn("max-w-[80%]", entry.role === "user" && "text-right")}>
                      {entry.role === "char" && <p className="mb-1 ml-1 text-[11px] font-extrabold uppercase tracking-wide text-mut">{episode.cast[entry.who].name}</p>}
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-3 text-[15px] font-semibold leading-relaxed",
                          entry.role === "char" && "rounded-tl-md border-2 border-line bg-bg text-ink",
                          entry.role === "user" && "rounded-tr-md bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)]",
                          entry.role === "narrator" && (entry.ok ? "border-2 border-primary/40 bg-primarysoft text-primarystrong" : "border-2 border-gold/40 bg-goldsoft text-ink")
                        )}
                      >
                        {entry.role === "narrator" && entry.ok && <span className="mb-1.5 block rounded-lg bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">⭐ En iyi cevap!</span>}
                        {entry.text}
                      </div>
                      {entry.role === "char" && entry.hint && <p className="mt-1 ml-1 text-xs font-semibold italic text-mut">💬 {entry.hint}</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* aktif beat */}
          {beat?.kind === "line" && typing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
              <CharAvatar ep={episode} who={beat.who} size={38} />
              <div>
                <p className="mb-1 ml-1 text-[11px] font-extrabold uppercase tracking-wide text-mut">{episode.cast[beat.who].name} yazıyor…</p>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border-2 border-line bg-bg px-5 py-4">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.18 }} className="size-2 rounded-full bg-violet" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {beat?.kind === "line" && !typing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
              <CharAvatar ep={episode} who={beat.who} size={38} />
              <div className="max-w-[80%]">
                <p className="mb-1 ml-1 text-[11px] font-extrabold uppercase tracking-wide text-mut">{episode.cast[beat.who].name}</p>
                <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="inline-block rounded-2xl rounded-tl-md border-2 border-violet/40 bg-violetsoft px-4 py-3 text-[15px] font-semibold leading-relaxed text-ink">
                  {beat.text}
                </motion.div>
                {beat.hint && (
                  <button onClick={() => setHintShown((h) => !h)} className="mt-1.5 ml-1 block cursor-pointer rounded-lg bg-raise px-2.5 py-1 text-xs font-bold text-mut transition hover:bg-violetsoft hover:text-violet">
                    {hintShown ? `💬 ${beat.hint} (gizle)` : "💬 Çeviriyi göster"}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {beat?.kind === "choice" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-violet/30 bg-violetsoft/60 p-4">
              <p className="text-sm font-extrabold text-violet">🎭 {beat.prompt}</p>
            </motion.div>
          )}

          {beat?.kind === "quiz" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-gold/40 bg-goldsoft/60 p-4">
              <p className="text-sm font-extrabold text-ink">🧠 {beat.question}</p>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* etkileşim alanı */}
      <div className="mt-4 pb-1">
        <AnimatePresence mode="wait">
          {beat?.kind === "line" && !typing && (
            <motion.div key={`line-${beatIdx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button size="lg" full variant="primary" onClick={() => advance({ role: "char", who: beat.who, text: beat.text, hint: beat.hint })}>
                Devam Et <ChevronRight className="size-5" />
              </Button>
            </motion.div>
          )}
          {beat?.kind === "line" && typing && (
            <motion.div key={`wait-${beatIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-14 rounded-2xl border-2 border-dashed border-line bg-surface/50" />
            </motion.div>
          )}

          {beat?.kind === "choice" && (
            <motion.div key={`choice-${beatIdx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
              {beat.options.map((opt) => (
                <motion.button
                  key={opt.text}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (opt.best) sfx("correct");
                    setBestCount((c) => c + (opt.best ? 1 : 0));
                    advance({ role: "user", text: opt.text });
                    setTimeout(() => setLog((l) => [...l, { role: "narrator", text: opt.reaction, ok: opt.best }]), 500);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3.5 text-left text-[15px] font-semibold text-ink shadow-[0_3px_0_var(--line)] transition-all hover:border-violet hover:bg-violetsoft/50"
                >
                  <span className="flex-1">{opt.text}</span>
                  <ChevronRight className="size-4.5 shrink-0 text-mut" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {beat?.kind === "quiz" && (
            <motion.div key={`quiz-${beatIdx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {beat.options.map((opt, i) => {
                  const picked = quizPicked !== null;
                  const state = !picked ? "idle" : i === beat.answer ? "correct" : i === quizPicked ? "wrong" : "idle";
                  return (
                    <motion.button
                      key={opt}
                      whileTap={state === "idle" ? { scale: 0.96 } : undefined}
                      disabled={picked}
                      onClick={() => {
                        setQuizPicked(i);
                        sfx(i === beat.answer ? "correct" : "wrong");
                      }}
                      className={cn(
                        "cursor-pointer rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-bold transition-all",
                        state === "idle" && "border-line bg-surface text-ink shadow-[0_3px_0_var(--line)] hover:border-gold hover:bg-goldsoft/40",
                        state === "correct" && "border-primary bg-primarysoft text-primarystrong",
                        state === "wrong" && "animate-wiggle border-danger bg-dangersoft text-danger",
                        state === "idle" && picked && "opacity-50"
                      )}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {quizPicked !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-2xl border-2 p-4", quizPicked === beat.answer ? "border-primary/40 bg-primarysoft" : "border-danger/40 bg-dangersoft")}>
                    <p className={cn("flex items-center gap-2 font-display text-sm font-semibold", quizPicked === beat.answer ? "text-primarystrong" : "text-danger")}>
                      {quizPicked === beat.answer ? <Check className="size-4.5" /> : <X className="size-4.5" />}
                      {quizPicked === beat.answer ? "Doğru!" : `Doğru cevap: ${beat.options[beat.answer]}`}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-ink/80">{beat.explain}</p>
                    <Button
                      size="lg"
                      full
                      className="mt-3"
                      variant={quizPicked === beat.answer ? "primary" : "danger"}
                      onClick={() => {
                        const ok = quizPicked === beat.answer;
                        advance({ role: "narrator", text: ok ? `🧠 Doğru! ${beat.explain}` : `🧠 Cevap: “${beat.options[beat.answer]}” — ${beat.explain}`, ok });
                      }}
                    >
                      Devam Et
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
