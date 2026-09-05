"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Play, X } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { getJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

type Song = {
  id: number;
  title: string;
  artist: string;
  language: string;
  difficulty: string;
  genre: string;
  emoji: string;
  youtubeId?: string | null;
  lyricsJson: { line: string; tr: string; words: { word: string; meaning: string }[] }[];
};

const GENRES = ["all", "pop", "rock", "klasik"] as const;

export default function MusicPage() {
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("all");
  const [active, setActive] = useState<Song | null>(null);
  const [mode, setMode] = useState<"lyrics" | "karaoke" | "fill">("lyrics");
  const [lineIdx, setLineIdx] = useState(0);
  const [popup, setPopup] = useState<{ word: string; meaning: string } | null>(null);
  const [blanks, setBlanks] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    getJson<{ songs: Song[] }>(`/api/content/songs${genre !== "all" ? `?genre=${genre}` : ""}`)
      .then((d) => setSongs(d.songs || []))
      .catch(() => setSongs([]));
  }, [genre]);

  useEffect(() => {
    if (mode !== "karaoke" || !active) return;
    const t = setInterval(() => setLineIdx((i) => (i + 1) % Math.max(1, active.lyricsJson.length)), 3500);
    return () => clearInterval(t);
  }, [mode, active]);

  const open = (s: Song) => {
    setActive(s);
    setMode("lyrics");
    setLineIdx(0);
    setBlanks({});
    setScore(0);
  };

  const fillTargets = useMemo(() => {
    if (!active) return [] as { line: number; word: string }[];
    return active.lyricsJson.slice(0, 4).map((l, i) => {
      const w = l.words?.[0]?.word || l.line.split(" ")[0];
      return { line: i, word: w };
    });
  }, [active]);

  const checkFill = () => {
    let s = 0;
    fillTargets.forEach((t) => {
      if ((blanks[t.line] || "").toLowerCase().trim() === t.word.toLowerCase()) s += 25;
    });
    setScore(s);
    if (s >= 75) fireConfetti();
    toast(s >= 75 ? `Harika! +${s} puan 🎵` : `Puanın: ${s}`, { type: s >= 75 ? "success" : "info" });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)]">
          <Music2 className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Müzikle Öğren</h1>
          <p className="text-sm font-semibold text-mut">Şarkı sözleriyle kelime ve ritim</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {GENRES.map((g) => (
          <button key={g} onClick={() => setGenre(g)} className={cn("shrink-0 cursor-pointer rounded-xl border-2 px-4 py-2 text-xs font-extrabold uppercase", genre === g ? "border-violet bg-violet text-white" : "border-line bg-surface text-mut")}>
            {g === "all" ? "Tümü" : g}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((s, i) => (
          <motion.button key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => open(s)} className="cursor-pointer rounded-3xl border-2 border-line bg-surface p-5 text-left shadow-card transition hover:-translate-y-1 hover:border-violet">
            <span className="text-4xl">{s.emoji}</span>
            <p className="mt-3 font-display text-base font-bold text-ink">{s.title}</p>
            <p className="text-xs font-semibold text-mut">{s.artist}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="violet">{s.difficulty}</Badge>
              <Badge tone="mut">{s.genre}</Badge>
              <Badge tone="azure">{s.language}</Badge>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border-2 border-line bg-surface shadow-pop">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-line bg-surface px-5 py-4">
                <div>
                  <p className="font-display text-lg font-bold text-ink">
                    {active.emoji} {active.title}
                  </p>
                  <p className="text-xs font-semibold text-mut">{active.artist}</p>
                </div>
                <button onClick={() => setActive(null)} className="cursor-pointer rounded-xl border-2 border-line p-2 text-mut hover:text-ink">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex gap-2 px-5 pt-4">
                {(["lyrics", "karaoke", "fill"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn("cursor-pointer rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase", mode === m ? "border-violet bg-violetsoft text-violet" : "border-line text-mut")}>
                    {m === "lyrics" ? "Sözler" : m === "karaoke" ? "Karaoke" : "Boşluk"}
                  </button>
                ))}
              </div>

              {mode !== "fill" && (
                <div className="space-y-2 p-5">
                  {active.youtubeId && mode === "karaoke" && (
                    <div className="mb-4 overflow-hidden rounded-2xl">
                      <iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${active.youtubeId}?rel=0`} title={active.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                  {active.lyricsJson.map((l, i) => (
                    <div key={i} className={cn("rounded-2xl border-2 p-3 transition", mode === "karaoke" && i === lineIdx ? "border-violet bg-violetsoft" : "border-line bg-bg")}>
                      <p className="text-sm font-extrabold text-ink">
                        {l.line.split(" ").map((w, wi) => {
                          const hit = l.words?.find((x) => x.word.toLowerCase() === w.replace(/[.,!?]/g, "").toLowerCase());
                          return (
                            <span key={wi}>
                              {hit ? (
                                <button onClick={() => setPopup(hit)} className="cursor-pointer rounded bg-goldsoft px-0.5 font-extrabold text-gold underline decoration-dotted">
                                  {w}
                                </button>
                              ) : (
                                w
                              )}{" "}
                            </span>
                          );
                        })}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-mut">{l.tr}</p>
                    </div>
                  ))}
                </div>
              )}

              {mode === "fill" && (
                <div className="space-y-3 p-5">
                  <p className="text-sm font-semibold text-mut">Boşlukları doldur, puan kazan!</p>
                  {fillTargets.map((t) => {
                    const line = active.lyricsJson[t.line];
                    return (
                      <div key={t.line} className="rounded-2xl border-2 border-line bg-bg p-3">
                        <p className="text-sm font-bold text-ink">
                          {line.line.replace(new RegExp(t.word, "i"), "______")}
                        </p>
                        <input
                          value={blanks[t.line] || ""}
                          onChange={(e) => setBlanks((b) => ({ ...b, [t.line]: e.target.value }))}
                          placeholder="Kelimeyi yaz..."
                          className="mt-2 h-10 w-full rounded-xl border-2 border-line bg-surface px-3 text-sm font-semibold outline-none focus:border-violet"
                        />
                      </div>
                    );
                  })}
                  <Button full onClick={checkFill}>
                    <Play className="size-4" /> Kontrol Et {score > 0 ? `(${score})` : ""}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4" onClick={() => setPopup(null)}>
            <div className="rounded-2xl border-2 border-line bg-surface p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-xl font-bold text-ink">{popup.word}</p>
              <p className="mt-1 text-sm font-semibold text-mut">{popup.meaning}</p>
              <Button size="sm" className="mt-3" onClick={() => setPopup(null)}>
                Kapat
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
