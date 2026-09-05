"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Mic, Search, SearchX, Sparkles, Volume2, X } from "lucide-react";
import { Badge, Button, Modal, Skeleton, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson, postJson } from "@/lib/api";
import { cn, speak } from "@/lib/utils";

interface Word {
  id: number;
  word: string;
  translation: string;
  pronunciation: string;
  emoji: string;
  category: string;
  example: string;
  exampleTr: string;
  favorite: boolean;
  strength: number | null;
}

function catHue(cat: string) {
  const hues: Record<string, number> = { Selamlaşma: 140, İfadeler: 170, İnsanlar: 20, Meslekler: 260, Özellikler: 320, Zamirler: 190, Sayılar: 45, Meyveler: 10, Yiyecek: 30, Sebzeler: 90, İçecekler: 200, Restoran: 35, Renkler: 0, Hayvanlar: 120, Vücut: 15, Giyim: 280, Ev: 210, Zaman: 55, Hava: 195, Okul: 240, Spor: 145, Duygular: 330, Fiiller: 270, Şehir: 220, Seyahat: 185, Genel: 150 };
  return hues[cat] ?? 150;
}

export default function DictionaryPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Tümü");
  const [words, setWords] = useState<Word[] | null>(null);
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Word | null>(null);
  const [listening, setListening] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const d = await getJson<{ words: Word[] }>(`/api/dictionary/search?${params.toString()}`);
      setWords(d.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kelimeler yüklenemedi.");
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getJson<{ word: Word | null }>("/api/dictionary/word-of-day")
      .then((d) => setWordOfDay(d.word))
      .catch(() => undefined);
  }, []);

  const toggleFav = async (w: Word) => {
    try {
      const res = await postJson<{ favorite: boolean }>("/api/dictionary/favorite", { vocabularyId: w.id });
      setWords((prev) => prev?.map((x) => (x.id === w.id ? { ...x, favorite: res.favorite } : x)) ?? prev);
      setDetail((d) => (d && d.id === w.id ? { ...d, favorite: res.favorite } : d));
      toast(res.favorite ? "Favorilere eklendi ❤️" : "Favorilerden çıkarıldı", { type: res.favorite ? "success" : "info" });
    } catch {
      toast("İşlem başarısız", { type: "error" });
    }
  };

  const voiceSearch = () => {
    setListening(true);
    setTimeout(() => {
      setListening(false);
      setQuery("apple");
      toast("Sesli arama", { desc: '"apple" olarak algılandı.', type: "info" });
    }, 1400);
  };

  const categories = words ? ["Tümü", ...Array.from(new Set(words.map((w) => w.category)))] : ["Tümü"];
  const filtered = words ? (cat === "Tümü" ? words : words.filter((w) => w.category === cat)) : [];

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Sözlük yüklenemedi 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* ═══════════════════════════ ARAMA ═════════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative z-10 flex items-center gap-2 rounded-3xl border-2 border-line bg-surface p-2.5 shadow-pop">
          <Search className="ml-3 size-5.5 shrink-0 text-mut" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kelime ara — İngilizce ya da Türkçe..."
            className="h-12 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:font-medium placeholder:text-mut/60"
          />
          {query && (
            <button onClick={() => setQuery("")} className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-mut transition hover:bg-raise hover:text-ink" aria-label="Temizle">
              <X className="size-5" />
            </button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={voiceSearch} className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-violet text-white shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_55%,black)] transition hover:brightness-105" aria-label="Sesli ara">
            <Mic className="size-5" />
          </motion.button>
        </div>
        {listening && <p className="mt-2 animate-pulse text-center text-xs font-extrabold text-violet">Dinliyorum... 🎙️</p>}
      </motion.section>

      {/* ═══════════════════════════ GÜNÜN KELİMESİ ════════════════════════ */}
      {wordOfDay && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
          <motion.button whileHover={{ y: -4 }} onClick={() => setDetail(wordOfDay)} className="relative w-full cursor-pointer overflow-hidden rounded-3xl border-2 border-gold/40 bg-gradient-to-br from-goldsoft via-surface to-surface p-6 text-left shadow-pop">
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gold/20 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <Badge tone="gold">
                  <Sparkles className="size-3" /> Günün Kelimesi
                </Badge>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(wordOfDay.word);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && speak(wordOfDay.word)}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-gold text-[#4a3800] shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_55%,black)] transition hover:brightness-105"
                >
                  <Volume2 className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <motion.span animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="text-5xl drop-shadow">
                  {wordOfDay.emoji}
                </motion.span>
                <div>
                  <p className="font-display text-2xl font-bold text-ink">{wordOfDay.word}</p>
                  <p className="text-sm font-bold text-mut">{wordOfDay.pronunciation}</p>
                </div>
              </div>
              <p className="mt-3 font-display text-lg font-semibold text-gold">{wordOfDay.translation}</p>
              <p className="mt-1.5 text-xs font-semibold italic text-mut">“{wordOfDay.example}”</p>
            </div>
          </motion.button>
        </motion.section>
      )}

      {/* ═══════════════════════════ KATEGORİLER ═══════════════════════════ */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn("flex shrink-0 cursor-pointer items-center rounded-full border-2 px-4 py-2 text-xs font-extrabold transition-all", cat === c ? "border-transparent bg-azure text-white shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_55%,black)]" : "border-line bg-surface text-mut shadow-[0_2px_0_var(--line)] hover:border-azure hover:text-azure")}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-mut">
        {words ? filtered.length : "..."} sonuç {cat !== "Tümü" && `· ${cat}`}
      </p>

      {/* ═══════════════════════════ SONUÇLAR ══════════════════════════════ */}
      {!words ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 text-center">
          <SearchX className="mx-auto size-12 text-linestrong" />
          <p className="mt-3 font-display text-2xl font-bold text-ink">Piko bu kelimeyi raflarda bulamadı 🦜</p>
          <p className="mt-2 text-sm font-semibold text-mut">Farklı bir harf dene ya da kategoriyi genişlet.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setQuery(""); setCat("Tümü"); }}>
            Filtreleri Sıfırla
          </Button>
        </motion.div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.slice(0, 120).map((w, i) => {
              const hue = catHue(w.category);
              return (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                  whileHover={{ y: -5 }}
                  onClick={() => setDetail(w)}
                  className="group relative cursor-pointer rounded-3xl border-2 border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-pop"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-3xl opacity-60" style={{ background: `radial-gradient(300px 70px at 20% 0%, hsl(${hue} 70% 50% / 0.1), transparent)` }} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <motion.span whileHover={{ scale: 1.12, rotate: -6 }} className="flex size-14 items-center justify-center rounded-2xl text-3xl shadow-card" style={{ background: `color-mix(in srgb, hsl(${hue} 70% 50%) 15%, var(--raise))`, border: `2px solid hsl(${hue} 70% 50% / 0.35)` }}>
                        {w.emoji}
                      </motion.span>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-display text-xl font-bold text-ink">{w.word}</h3>
                          <span className="text-xs font-bold text-mut">{w.pronunciation}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone="azure">{w.translation}</Badge>
                          <Badge tone="mut" className="normal-case">{w.category}</Badge>
                          {w.strength !== null && <Badge tone={w.strength >= 3 ? "primary" : "gold"}>Güç {w.strength}/5</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.7 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFav(w);
                        }}
                        className={cn("relative flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 transition-all", w.favorite ? "border-danger/40 bg-dangersoft text-danger" : "border-line bg-bg text-mut hover:border-danger hover:text-danger")}
                        aria-label="Favorile"
                      >
                        <Heart className={cn("size-4.5", w.favorite && "fill-current")} />
                      </motion.button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(w.word);
                        }}
                        className="flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-bg text-mut transition-all hover:border-azure hover:text-azure"
                        aria-label="Dinle"
                      >
                        <Volume2 className="size-4.5" />
                      </button>
                    </div>
                  </div>
                  <div className="relative mt-4 rounded-2xl bg-bg p-3.5">
                    <p className="text-sm font-semibold italic text-ink">“{w.example}”</p>
                    <p className="mt-1 text-xs font-bold text-mut">{w.exampleTr}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════════════════════ DETAY MODALI ══════════════════════════ */}
      <Modal open={detail !== null} onClose={() => setDetail(null)} className="max-w-xl">
        {detail && (
          <div>
            <div className="relative overflow-hidden p-7" style={{ background: `linear-gradient(135deg, hsl(${catHue(detail.category)} 60% 32%), hsl(${catHue(detail.category) + 30} 62% 22%))` }}>
              <div className="dot-grid absolute inset-0 opacity-15" />
              <button onClick={() => setDetail(null)} className="absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25" aria-label="Kapat">
                <X className="size-5" />
              </button>
              <div className="relative flex items-center gap-5">
                <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 15 }} className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-5xl backdrop-blur-sm">
                  {detail.emoji}
                </motion.span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-white/20 text-white">{detail.category}</Badge>
                    {detail.strength !== null && <Badge className="bg-white/20 text-white">Hafıza gücü {detail.strength}/5</Badge>}
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-bold text-white">{detail.word}</h3>
                  <p className="text-sm font-bold text-white/75">{detail.pronunciation}</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => speak(detail.word)} className="ml-auto flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur transition hover:bg-white/30" aria-label="Dinle">
                  <Volume2 className="size-6" />
                </motion.button>
              </div>
            </div>
            <div className="p-7">
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-bold text-azure">{detail.translation}</p>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => void toggleFav(detail)} className={cn("flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition-all", detail.favorite ? "border-danger/40 bg-dangersoft text-danger" : "border-line bg-bg text-mut hover:border-danger hover:text-danger")}>
                  <Heart className={cn("size-4", detail.favorite && "fill-current")} /> {detail.favorite ? "Favoride" : "Favorile"}
                </motion.button>
              </div>
              <div className="mt-5 rounded-2xl border-l-4 border-azure bg-azuresoft/50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-azure">Örnek Cümle</p>
                <p className="mt-2 text-sm font-semibold italic text-ink">“{detail.example}”</p>
                <p className="mt-1 text-xs font-bold text-mut">{detail.exampleTr}</p>
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" full onClick={() => setDetail(null)}>
                  Kapat
                </Button>
                <Button full href="/review">
                  Bu Kelimeyle Pratik Yap
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
