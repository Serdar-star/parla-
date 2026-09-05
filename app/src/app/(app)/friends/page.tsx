"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Diamond, Flame, Gamepad2, Heart, Sparkles, Swords, Trophy, UserPlus, Zap } from "lucide-react";
import { Avatar, Badge, Button, Card, Modal, ProgressBar, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { duoQuests, friends, friendFeed, suggestedLearners, user } from "@/data/mock";
import { useApp } from "@/stores/app";
import { useCountdown } from "@/hooks/use-countdown";
import { cn, fireConfetti, pad } from "@/lib/utils";
import type { Friend } from "@/data/mock";

const duelTypes = [
  { id: "xp", label: "XP Yarışı", icon: Zap, desc: "Hafta sonuna kadar kim daha çok XP toplar" },
  { id: "hunt", label: "Kelime Avı Skoru", icon: Gamepad2, desc: "Tek tur, en yüksek puan kazanır" },
  { id: "streak", label: "Seri Düellosu", icon: Flame, desc: "7 gün boyunca serisini ilk bozan kaybeder" },
];

const stakes = [10, 50, 100];

export default function FriendsPage() {
  const { toast } = useToast();
  const { wallet, spendGems } = useApp();
  const [challenged, setChallenged] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [gifted, setGifted] = useState<string[]>([]);
  const [claps, setClaps] = useState<Record<string, number>>({});
  const [clapped, setClapped] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [challengeWith, setChallengeWith] = useState<Friend | null>(null);
  const [duelType, setDuelType] = useState(duelTypes[0].id);
  const [stake, setStake] = useState(50);
  const [striking, setStriking] = useState(false);
  const [xpBoost, setXpBoost] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("parla-gifts");
      if (raw) setGifted(JSON.parse(raw));
    } catch {
      /* yok say */
    }
  }, []);

  const getDuelEnd = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  }, []);
  const { days, hours } = useCountdown(getDuelEnd);

  const sendGift = (f: Friend) => {
    if (gifted.includes(f.handle)) return;
    const next = [...gifted, f.handle];
    setGifted(next);
    try {
      localStorage.setItem("parla-gifts", JSON.stringify(next));
    } catch {
      /* yok say */
    }
    fireConfetti();
    toast(`${f.name} oyuncusuna kalp gönderdin ❤️`, { desc: "Enerji paketi yolda — yarın tekrar gönderebilirsin." });
  };

  const clap = (id: string) => {
    if (clapped.includes(id)) return;
    setClapped((c) => [...c, id]);
    setClaps((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  };

  const attack = () => {
    if (striking) return;
    setStriking(true);
    setXpBoost((x) => x + 15);
    setTimeout(() => setStriking(false), 900);
    toast("XP atağı başlatıldı ⚡ +15 XP", { desc: "Zeynep'in haberi yok... henüz. 😈" });
  };

  const sendChallenge = () => {
    if (!challengeWith) return;
    if (!spendGems(stake)) {
      toast("Yetersiz elmas 💎", { desc: `${stake} elmas gerekiyor — oyunlardan topla!`, type: "warning" });
      return;
    }
    setChallenged((c) => (c.includes(challengeWith.name) ? c : [...c, challengeWith.name]));
    fireConfetti();
    const dt = duelTypes.find((d) => d.id === duelType);
    toast(`${challengeWith.name} oyuncusuna meydan okundu ⚔️`, { desc: `${dt?.label} · Bahis: ${stake} 💎 · Kazanan hepsini alır!` });
    setChallengeWith(null);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText("https://parla.app/davet/ahmetyilmaz");
      toast("Davet linki kopyalandı 📋", { desc: "Her gelen arkadaş 50 💎 kazandırır!" });
    } catch {
      toast("Davet linki hazır 🔗", { desc: "parla.app/davet/ahmetyilmaz", type: "info" });
    }
  };

  const yourXp = user.weeklyXp + xpBoost;
  const zeynepXp = 4500;
  const duelTotal = yourXp + zeynepXp;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ═══════════════════════════ SQUAD HERO ═══════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-line bg-surface p-7 shadow-pop sm:p-9">
        <motion.div animate={{ y: [0, -22, 0], x: [0, 14, 0] }} transition={{ duration: 10, repeat: Infinity }} className="pointer-events-none absolute -right-14 -top-16 size-64 rounded-full bg-accent/15 blur-3xl" />
        <motion.div animate={{ y: [0, 18, 0] }} transition={{ duration: 12, repeat: Infinity, delay: 1 }} className="pointer-events-none absolute -left-16 -bottom-10 size-56 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border-2 border-accent/40 bg-accentsoft px-3.5 py-1.5 text-xs font-extrabold text-accent">⚡ Takım Enerjisi</span>
              <span className="flex items-center gap-1.5 rounded-full border-2 border-line bg-bg px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-[0_2px_0_var(--line)]">
                <span className="size-2 rounded-full bg-primary" /> {friends.filter((f) => f.online).length} arkadaş çevrimiçi
              </span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Yalnız öğrenirsin, <span className="text-accent">birlikte uçarsın.</span>
            </h1>
            <p className="mt-2.5 max-w-md text-[15px] font-semibold leading-relaxed text-mut">
              Takımın bu hafta <span className="font-extrabold text-accent">19.250 XP</span> topladı. Ortak hedefe {Math.max(0, 25000 - 19250).toLocaleString("tr-TR")} XP kaldı — ödül hep beraber!
            </p>
            <div className="mt-5 flex max-w-md items-center gap-3">
              <ProgressBar value={(19250 / 25000) * 100} className="h-4 flex-1" barClassName="from-accent to-gold" />
              <span className="font-display text-sm font-bold text-accent">19.2K/25K</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex -space-x-3">
              {friends.slice(0, 5).map((f, i) => (
                <motion.div key={f.handle} initial={{ scale: 0, y: 14 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.1, type: "spring", stiffness: 300, damping: 16 }}>
                  <Avatar name={f.name} hue={f.hue} size={52} className="ring-4 ring-surface" />
                </motion.div>
              ))}
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} className="flex size-[52px] items-center justify-center rounded-full border-2 border-dashed border-linestrong bg-raise font-display text-xs font-bold text-mut ring-4 ring-surface">
                +3
              </motion.span>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4.5" /> Arkadaş Davet Et
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ══════════════════════════ SOL KOLON ══════════════════════════ */}
        <div className="space-y-6">
          {/* ------------------------------ DÜELLO ARENASI ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-surface p-6 shadow-card">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(400px 160px at 50% 0%, color-mix(in srgb, var(--danger) 10%, transparent), transparent)" }} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    <Swords className="size-5 text-danger" /> Haftanın Düellosu
                  </h2>
                  <span className="flex items-center gap-1.5 rounded-xl border-2 border-line bg-bg px-3 py-1.5 font-display text-xs font-bold text-mut shadow-[0_2px_0_var(--line)]">
                    ⏳ {days}g {pad(hours)}s
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* Sen */}
                  <motion.div animate={striking ? { scale: [1, 1.06, 1] } : {}} className="text-center">
                    <Avatar name={user.name} hue={150} size={72} className="mx-auto ring-4 ring-primary/30" />
                    <p className="mt-2 font-display text-sm font-bold text-ink">Sen</p>
                    <motion.p key={yourXp} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-xl font-bold text-primary">
                      {yourXp.toLocaleString("tr-TR")}
                    </motion.p>
                    <p className="text-[10px] font-extrabold uppercase text-mut">haftalık XP</p>
                  </motion.div>

                  {/* VS */}
                  <div className="relative flex flex-col items-center">
                    <AnimatePresence>
                      {striking && (
                        <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.6, 1.6, 2], rotate: [0, 12, -8, 20] }} transition={{ duration: 0.85 }} className="pointer-events-none absolute -top-9 z-10 text-4xl">
                          ⚡
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.span animate={{ scale: striking ? [1, 1.4, 1] : [1, 1.08, 1] }} transition={{ duration: striking ? 0.4 : 1.6, repeat: striking ? 0 : Infinity }} className="flex size-14 items-center justify-center rounded-full border-2 border-danger/40 bg-dangersoft font-display text-lg font-bold text-danger shadow-card">
                      VS
                    </motion.span>
                  </div>

                  {/* Zeynep */}
                  <motion.div animate={striking ? { x: [0, 6, -4, 3, 0] } : {}} className="text-center">
                    <Avatar name="Zeynep K." hue={340} size={72} className="mx-auto ring-4 ring-danger/25" />
                    <p className="mt-2 font-display text-sm font-bold text-ink">Zeynep K.</p>
                    <p className="font-display text-xl font-bold text-danger">{zeynepXp.toLocaleString("tr-TR")}</p>
                    <p className="text-[10px] font-extrabold uppercase text-mut">haftalık XP</p>
                  </motion.div>
                </div>

                {/* çekişme barı */}
                <div className="mt-5 h-4.5 overflow-hidden rounded-full border border-line/60 bg-raise">
                  <motion.div animate={{ width: `${(yourXp / duelTotal) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className="flex h-full items-center rounded-full bg-gradient-to-r from-primary to-primarystrong px-2">
                    <span className="ml-auto text-[9px] font-extrabold text-white">FARK: {Math.abs(zeynepXp - yourXp).toLocaleString("tr-TR")}</span>
                  </motion.div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-mut">
                    {zeynepXp - yourXp > 0 ? `${(zeynepXp - yourXp).toLocaleString("tr-TR")} XP geridesin — 2 günün var, atak zamanı! 🔥` : "Öndesin! Farkı koru. 👑"}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={attack}
                    disabled={striking}
                    className="flex cursor-pointer items-center gap-2 rounded-2xl bg-danger px-5 py-3 font-display text-sm font-bold uppercase text-white shadow-[0_4px_0_color-mix(in_srgb,var(--danger)_55%,black)] transition hover:brightness-105 active:translate-y-[4px] active:shadow-none disabled:opacity-60"
                  >
                    <Zap className="size-4.5" /> {striking ? "Atak!" : "XP Atağı Başlat"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ------------------------------ ARKADAŞ LİSTESİ ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b-2 border-line px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-ink">Arkadaşların ({friends.length})</h2>
                <Badge tone="primary">{friends.filter((f) => f.online).length} çevrimiçi</Badge>
              </div>
              {friends.map((f, i) => (
                <motion.div key={f.handle} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.05 }} className="flex items-center gap-3.5 border-b-2 border-line/60 px-6 py-4 last:border-0">
                  <div className="relative">
                    <Avatar name={f.name} hue={f.hue} size={48} />
                    {f.online && (
                      <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{f.name}</p>
                    <p className="flex items-center gap-2 text-xs font-bold text-mut">
                      <span className="flex items-center gap-0.5">
                        <Flame className="size-3.5 text-accent" /> {f.streak} gün
                      </span>
                      · {f.learning}
                      <span className="hidden sm:inline">· {f.weeklyXp.toLocaleString("tr-TR")} XP/bu hafta</span>
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => sendGift(f)}
                    title={gifted.includes(f.handle) ? "Bugün zaten gönderdin" : "Enerji gönder ❤️"}
                    className={cn(
                      "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 transition-all",
                      gifted.includes(f.handle) ? "cursor-default border-primary/40 bg-primarysoft text-primary" : "border-line bg-bg text-mut shadow-[0_2px_0_var(--line)] hover:border-danger hover:text-danger"
                    )}
                  >
                    {gifted.includes(f.handle) ? <Check className="size-4.5" /> : <Heart className="size-4.5" />}
                  </motion.button>
                  <Button size="sm" variant={challenged.includes(f.name) ? "soft" : "outline"} onClick={() => setChallengeWith(f)}>
                    {challenged.includes(f.name) ? <Check className="size-3.5" /> : <Swords className="size-3.5" />}
                    {challenged.includes(f.name) ? "Gönderildi" : "Düello"}
                  </Button>
                </motion.div>
              ))}
            </Card>
          </motion.div>

          {/* ------------------------------ AKTİVİTE AKIŞI ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Arkadaş Aktiviteleri</h2>
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="size-2.5 rounded-full bg-primary" />
              </div>
              <div className="mt-4 space-y-3">
                {friendFeed.map((a, i) => {
                  const count = a.claps + (claps[a.id] ?? 0);
                  const didClap = clapped.includes(a.id);
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="flex items-center gap-3 rounded-2xl bg-bg p-3.5">
                      <Avatar name={a.name} hue={a.hue} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-snug text-ink">
                          <span className="font-extrabold">{a.name}</span> {a.text} {a.icon}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-mut">{a.time}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => clap(a.id)}
                        className={cn(
                          "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition-all",
                          didClap ? "border-accent/50 bg-accentsoft text-accent" : "border-line bg-surface text-mut shadow-[0_2px_0_var(--line)] hover:border-accent hover:text-accent"
                        )}
                      >
                        <motion.span key={count} initial={{ scale: didClap ? 1.5 : 1 }} animate={{ scale: 1 }}>👏 {count}</motion.span>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ══════════════════════════ SAĞ KOLON ══════════════════════════ */}
        <div className="space-y-6">
          {/* ------------------------------ DUO GÖREVLERİ ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <Sparkles className="size-5 text-violet" /> Duo Görevleri
              </h2>
              <p className="mt-1 text-xs font-semibold text-mut">İkili görevler, tek başına yapılamaz. Takım işi! 🤝</p>
              <div className="mt-4 space-y-4">
                {duoQuests.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.1 }} className="rounded-2xl border-2 border-line bg-bg p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <Avatar name={user.name} hue={150} size={32} className="ring-2 ring-bg" />
                        <Avatar name={q.partner} hue={q.hue} size={32} className="ring-2 ring-bg" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-ink">{q.title}</p>
                        <p className="text-[11px] font-bold text-mut">
                          {q.partner} ile · {q.daysLeft} gün kaldı
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={(q.progress / q.target) * 100} className="h-3 flex-1" barClassName="from-violet to-violet" />
                      <span className="font-display text-xs font-bold text-mut">
                        {q.progress}/{q.target}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-violet">Ödül: {q.reward}</span>
                      {q.progress / q.target >= 0.6 && <Badge tone="violet">Az kaldı! 🔥</Badge>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ------------------------------ DAVET / ÖDÜLLER ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <div className="overflow-hidden rounded-3xl border-2 border-gold/40 bg-gradient-to-b from-goldsoft to-surface p-6 shadow-[0_4px_0_color-mix(in_srgb,var(--gold)_40%,transparent)]">
              <div className="flex items-center gap-3">
                <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-4xl">
                  🎁
                </motion.span>
                <div>
                  <p className="font-display text-base font-semibold text-ink">Davet Et, Birlikte Kazanın</p>
                  <p className="text-xs font-semibold text-mut">Her arkadaş = karşılıklı 50 💎</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { goal: "1 arkadaş", reward: "+50 💎", done: false },
                  { goal: "3 arkadaş", reward: "Gizemli Sandık 🎁", done: false },
                  { goal: "5 arkadaş", reward: "“Sosyal Kelebek” rozeti 🦋", done: false },
                ].map((r, i) => (
                  <div key={r.goal} className={cn("flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5", r.done ? "border-primary/40 bg-primarysoft" : "border-line bg-surface")}>
                    <span className="text-xs font-extrabold text-ink">{r.goal}</span>
                    <span className="text-xs font-extrabold text-gold">{r.reward}</span>
                  </div>
                ))}
              </div>
              <Button full variant="gold" className="mt-4" onClick={() => setInviteOpen(true)}>
                <Copy className="size-4" /> Davet Linkini Al
              </Button>
            </div>
          </motion.div>

          {/* ------------------------------ ÖNERİLER ------------------------------ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold text-ink">Tanıyabileceğin Öğrenenler</h2>
              <div className="mt-4 space-y-4">
                {suggestedLearners.map((s) => (
                  <div key={s.handle} className="flex items-center gap-3">
                    <Avatar name={s.name} hue={s.hue} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ink">{s.name}</p>
                      <p className="truncate text-[11px] font-bold text-mut">{s.desc}</p>
                    </div>
                    <Button size="sm" variant={following.includes(s.name) ? "soft" : "primary"} onClick={() => { setFollowing((f) => [...f, s.name]); toast(`${s.name} takip ediliyor 🎉`, { desc: "Aktiviteleri akışında görünecek." }); }}>
                      {following.includes(s.name) ? <Check className="size-3.5" /> : <UserPlus className="size-3.5" />}
                      {following.includes(s.name) ? "Takipte" : "Takip Et"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Piko notu */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-linestrong p-4">
            <Mascot mood="happy" size={64} className="shrink-0" />
            <p className="text-xs font-semibold leading-relaxed text-mut">
              Piko'nun notu: Düello kazananlar <span className="font-extrabold text-ink">%32 daha uzun</span> seri yapıyor. Meydan okumaktan korkma! 🦜
            </p>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════ DÜELLO MODALI ═════════════════════════ */}
      <Modal open={challengeWith !== null} onClose={() => setChallengeWith(null)}>
        {challengeWith && (
          <div>
            <div className="relative overflow-hidden bg-gradient-to-r from-danger to-accent p-6">
              <div className="dot-grid absolute inset-0 opacity-20" />
              <div className="relative flex items-center gap-4">
                <div className="flex -space-x-3">
                  <Avatar name={user.name} hue={150} size={52} className="ring-4 ring-white/30" />
                  <Avatar name={challengeWith.name} hue={challengeWith.hue} size={52} className="ring-4 ring-white/30" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">Düello Kuruluyor</p>
                  <h3 className="font-display text-xl font-bold text-white">
                    Sen vs {challengeWith.name} ⚔️
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-extrabold uppercase tracking-widest text-mut">Düello türü</p>
              <div className="mt-3 space-y-2.5">
                {duelTypes.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuelType(d.id)}
                    className={cn("flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all", duelType === d.id ? "border-danger bg-dangersoft/60 shadow-[0_3px_0_color-mix(in_srgb,var(--danger)_30%,var(--line))]" : "border-line bg-bg hover:border-linestrong")}
                  >
                    <span className={cn("flex size-11 items-center justify-center rounded-xl", duelType === d.id ? "bg-danger text-white" : "bg-raise text-mut")}>
                      <d.icon className="size-5.5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-extrabold text-ink">{d.label}</span>
                      <span className="block text-xs font-semibold text-mut">{d.desc}</span>
                    </span>
                    {duelType === d.id && <Check className="size-5 text-danger" />}
                  </button>
                ))}
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-mut">Bahis (kazanan hepsini alır)</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {stakes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStake(s)}
                    className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 py-3.5 transition-all", stake === s ? "border-azure bg-azuresoft shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                  >
                    <span className="flex items-center gap-1 font-display text-base font-bold text-azure">
                      <Diamond className="size-4 fill-current" /> {s}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase text-mut">elmas</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-right text-xs font-bold text-mut">
                Cüzdanın: <span className="text-azure">{wallet.gems} 💎</span>
              </p>

              <div className="mt-5 flex gap-3">
                <Button variant="outline" size="lg" full onClick={() => setChallengeWith(null)}>
                  Vazgeç
                </Button>
                <Button size="lg" full variant="danger" onClick={sendChallenge}>
                  <Swords className="size-4.5" /> Meydan Oku!
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════ DAVET MODALI ═════════════════════════ */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="p-7 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 15 }} className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold to-accent text-4xl shadow-[0_5px_0_color-mix(in_srgb,var(--accent)_55%,black)]">
            🤝
          </motion.div>
          <h3 className="mt-4 font-display text-2xl font-bold text-ink">Arkadaşını Parla'ya Davet Et</h3>
          <p className="mt-2 text-sm font-semibold text-mut">Katılan her arkadaş ikinize de 50 💎 kazandırır. Üstelik birlikte düello yapabilirsiniz!</p>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border-2 border-line bg-bg p-2.5">
            <span className="flex-1 truncate px-2 text-left font-display text-sm font-semibold text-mut">parla.app/davet/ahmetyilmaz</span>
            <Button size="sm" onClick={copyInvite}>
              <Copy className="size-3.5" /> Kopyala
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { icon: "💬", label: "WhatsApp" },
              { icon: "✉️", label: "E-posta" },
              { icon: "🔗", label: "Diğer" },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => toast(`${s.label} paylaşımı hazırlandı ${s.icon}`, { desc: "Davet linkin eklendi.", type: "info" })}
                className="cursor-pointer rounded-2xl border-2 border-line bg-surface py-3.5 text-center transition hover:border-gold"
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="mt-1 text-[11px] font-extrabold text-ink">{s.label}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-raise p-4 text-left">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-mut">
              <Trophy className="size-4 text-gold" /> Bu haftaki davetlerin
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <ProgressBar value={0} className="h-3 flex-1" />
              <span className="font-display text-xs font-bold text-mut">0/3 ödül</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-mut">İlk arkadaşını davet et, 50 💎 anında hesabında! 💎</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
