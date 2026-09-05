"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Check, Clock3, Ear, Lock, MessageCircle, Play, Skull, Sparkles, Star, Zap } from "lucide-react";
import { Badge, Button, Modal, ProgressBar, Skeleton, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

type LessonStatus = "completed" | "active" | "locked";
interface LessonItem {
  id: number;
  unitNumber: number;
  lessonNumber: number;
  title: string;
  type: string;
  xpReward: number;
  estimatedMinutes: number;
  status: LessonStatus;
  stars: number;
}
interface UnitData {
  unit: number;
  name: string;
  subtitle: string;
  emoji: string;
  color: string;
  lessons: LessonItem[];
}
interface Progress {
  totalLessons: number;
  completedLessons: number;
  wordsLearned: number;
  pct: number;
}

const kindMeta: Record<string, { label: string; icon: typeof BookOpen }> = {
  ders: { label: "Ders", icon: BookOpen },
  dinleme: { label: "Dinleme", icon: Ear },
  konuşma: { label: "Konuşma", icon: MessageCircle },
  hikaye: { label: "Hikâye", icon: Sparkles },
  boss: { label: "Boss Savaşı", icon: Skull },
};

function LessonNode({ lesson, offset, onOpen }: { lesson: LessonItem; offset: number; onOpen: (l: LessonItem) => void }) {
  const done = lesson.status === "completed";
  const active = lesson.status === "active";
  const locked = lesson.status === "locked";
  const boss = lesson.type === "boss";
  const size = boss ? "size-24" : "size-20";

  return (
    <div className="relative z-10 flex flex-col items-center py-3.5">
      <div className="relative flex flex-col items-center sm:[transform:var(--off)]" style={{ ["--off" as string]: `translateX(${offset}px)` }}>
        {active && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 z-20">
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="relative whitespace-nowrap rounded-2xl border-2 border-line bg-surface px-5 py-2 font-display text-sm font-semibold uppercase tracking-wide text-primary shadow-card">
              Başla
              <span className="absolute -bottom-[9px] left-1/2 -ml-2 size-4 rotate-45 border-b-2 border-r-2 border-line bg-surface" />
            </motion.div>
          </motion.div>
        )}
        <motion.button
          whileHover={locked ? undefined : { scale: 1.08 }}
          whileTap={locked ? undefined : { scale: 0.93 }}
          onClick={() => !locked && onOpen(lesson)}
          className={cn(
            "relative flex items-center justify-center rounded-full transition-colors duration-200",
            size,
            done && !boss && "border-b-8 border-primarystrong bg-primary text-primaryink",
            done && boss && "border-b-8 border-[#6d3fd6] bg-gradient-to-b from-violet to-violet/80 text-white",
            active && !boss && "animate-ring border-b-8 border-primarystrong bg-primary text-primaryink",
            active && boss && "animate-ring border-b-8 border-[#6d3fd6] bg-gradient-to-b from-violet to-violet/80 text-white",
            locked && "cursor-not-allowed border-b-8 border-line border-b-linestrong bg-raise text-mut/40"
          )}
        >
          {boss && <span className="absolute -top-3.5 whitespace-nowrap rounded-full bg-violet px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg">Boss</span>}
          {done ? (
            <Check className={cn(boss ? "size-10" : "size-8")} strokeWidth={3.5} />
          ) : locked ? (
            <Lock className={cn(boss ? "size-9" : "size-7")} />
          ) : boss ? (
            <Skull className="size-10" />
          ) : (
            <motion.span animate={active ? { y: [0, -5, 0] } : {}} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              {lesson.type === "ders" ? <Play className="size-7 fill-current" /> : (() => {
                const Icon = kindMeta[lesson.type]?.icon ?? BookOpen;
                return <Icon className="size-7" />;
              })()}
            </motion.span>
          )}
        </motion.button>
        <p className={cn("mt-2.5 max-w-[150px] text-center text-xs font-extrabold", locked ? "text-mut/50" : "text-ink")}>{lesson.title}</p>
        <div className="mt-1 flex items-center gap-1">
          {done ? (
            [0, 1, 2].map((i) => <Star key={i} className={cn("size-3.5", i < lesson.stars ? "fill-gold text-gold" : "text-linestrong")} />)
          ) : locked ? (
            <span className="text-[10px] font-bold text-mut/50">🔒 kilitli</span>
          ) : (
            <span className="rounded-md bg-goldsoft px-1.5 py-0.5 text-[10px] font-extrabold text-gold">+{lesson.xpReward} XP</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [units, setUnits] = useState<UnitData[] | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LessonItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([getJson<{ units: UnitData[] }>("/api/lessons"), getJson<Progress>("/api/lessons/progress")]);
      setUnits(u.units);
      setProgress(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dersler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Dersler yüklenemedi 😕</h1>
        <p className="mt-2 text-sm font-semibold text-mut">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!units || !progress) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-32 rounded-[2rem]" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-96 rounded-[2.5rem]" />
        ))}
      </div>
    );
  }

  const selectedUnit = units.find((u) => u.lessons.some((l) => l.id === selected?.id));

  return (
    <div className="mx-auto max-w-3xl">
      {/* ═══════════════════════════ KURS BAŞLIĞI ══════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[2rem] border-2 border-line bg-surface p-6 shadow-pop sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl border-2 border-line bg-bg text-4xl shadow-card">🇬🇧</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-ink">İngilizce</h1>
                <Badge tone="primary">A1</Badge>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-mut">3 ünite · {progress.totalLessons} ders · {progress.wordsLearned} kelime</p>
            </div>
          </div>
          <div className="w-40">
            <div className="flex justify-between text-xs font-extrabold">
              <span className="text-mut">Kurs yolu</span>
              <span className="text-primary">%{progress.pct}</span>
            </div>
            <ProgressBar value={progress.pct} className="mt-1.5" />
            <p className="mt-1.5 text-[11px] font-bold text-mut">
              {progress.completedLessons}/{progress.totalLessons} ders tamamlandı
            </p>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ YOL ═══════════════════════════════════ */}
      {units.map((unit, ui) => (
        <motion.section key={unit.unit} initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: ui * 0.06 }}>
          <div className="relative mt-6 rounded-[2.5rem] px-4 pb-8 pt-6" style={{ background: `color-mix(in srgb, ${unit.color} 6%, transparent)` }}>
            <div className="relative z-10 mx-auto max-w-xl">
              <motion.div whileHover={{ y: -3 }} className="relative rounded-3xl border-2 border-black/10 p-5 sm:p-6" style={{ background: unit.color, boxShadow: `0 6px 0 color-mix(in srgb, ${unit.color} 55%, black)` }}>
                <div className="flex items-center gap-4">
                  <motion.span animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: ui * 0.5 }} className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">
                    {unit.emoji}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/75">
                      Ünite {unit.unit} · {unit.lessons.length} ders
                    </p>
                    <h2 className="truncate font-display text-lg font-semibold text-white drop-shadow-sm sm:text-xl">{unit.name}</h2>
                    <p className="truncate text-xs font-bold text-white/75">{unit.subtitle}</p>
                  </div>
                  <div className="w-20 text-right">
                    <p className="font-display text-lg font-bold text-white">
                      {unit.lessons.filter((l) => l.status === "completed").length}/{unit.lessons.length}
                    </p>
                    <p className="text-[9px] font-extrabold uppercase text-white/70">tamamlandı</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 mt-2 flex flex-col items-center">
              <div className="pointer-events-none absolute inset-y-2 left-1/2 w-1 -translate-x-1/2 rounded-full" style={{ backgroundImage: `repeating-linear-gradient(to bottom, color-mix(in srgb, ${unit.color} 45%, transparent) 0 10px, transparent 10px 22px)` }} />
              {unit.lessons.map((lesson, li) => (
                <LessonNode key={lesson.id} lesson={lesson} offset={[0, 64, 24, -64, -24][li % 5]} onOpen={setSelected} />
              ))}
            </div>
          </div>
        </motion.section>
      ))}

      {/* ═══════════════════════════ DETAY MODALI ══════════════════════════ */}
      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && selectedUnit && (
          <div>
            <div className="relative overflow-hidden p-7" style={{ background: selectedUnit.color }}>
              <div className="dot-grid absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/25 text-white">
                    {(() => {
                      const KIcon = kindMeta[selected.type]?.icon ?? BookOpen;
                      return <KIcon className="size-3" />;
                    })()}
                    {kindMeta[selected.type]?.label ?? "Ders"}
                  </Badge>
                  <span className="rounded-lg bg-white/25 px-2.5 py-1 text-xs font-extrabold text-white">{selectedUnit.name}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-white drop-shadow-sm">{selected.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-white/90">
                  <span className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
                    <Clock3 className="size-4" /> {selected.estimatedMinutes} dk
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
                    <Zap className="size-4" /> +{selected.xpReward} XP
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1">
                    {[0, 1, 2].map((i) => (
                      <Star key={i} className={cn("size-3.5", i < selected.stars ? "fill-gold text-gold" : "text-white/40")} />
                    ))}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-7">
              <div className="rounded-2xl bg-raise/60 p-3.5 text-xs font-semibold leading-relaxed text-mut">
                💡 <span className="font-extrabold text-ink">Piko'nun ipucu:</span> {selected.type === "konuşma" ? "Mikrofon sorularında yüksek sesle söyle — özgüvenin 2 kat artar!" : selected.type === "dinleme" ? "Önce normal hızda dinle, takılırsan yavaş modu dene." : selected.type === "boss" ? "Her doğru cevap boss'a hasar verir. Sakin ol, kelimeye odaklan!" : "Hatasız bitirirsen +20 bonus XP kaparsın!"}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setSelected(null)} className="flex-1">
                  Vazgeç
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    toast("Ders yükleniyor 🚀", { type: "info" });
                    router.push(`/lessons/${selected.id}`);
                  }}
                  className="flex-[2]"
                >
                  <Play className="size-5 fill-current" /> Derse Başla
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
