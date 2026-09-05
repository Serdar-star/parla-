"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Clock3, Crown, Diamond, Flame, GraduationCap, PencilLine, Share2, Swords, Timer, Trophy, Zap } from "lucide-react";
import { Badge, Button, Card, Counter, Modal, ProgressBar, ProgressRing, Skeleton, StatChip, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { getJson, putJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

interface ProfileUser {
  fullName: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  dailyGoal: number;
  coins: number;
  isPremium: boolean;
  createdAt: string;
}
interface Stats {
  lessonsDone: number;
  perfectLessons: number;
  wordsLearned: number;
  totalMinutes: number;
  skills: { name: string; value: number }[];
}
interface ActivityDay {
  date: string;
  xp: number;
  minutes: number;
}

const tabs = [
  { id: "stats", label: "İstatistikler", icon: Zap },
  { id: "activity", label: "Aktivite", icon: CalendarDays },
  { id: "langs", label: "Diller", icon: GraduationCap },
] as const;
type TabId = (typeof tabs)[number]["id"];

function AreaTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: string; dk: number } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-line bg-surface px-3 py-2 shadow-pop">
      <p className="text-xs font-extrabold text-mut">{payload[0].payload.day}</p>
      <p className="text-sm font-extrabold text-primary">{payload[0].payload.dk} dk</p>
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("stats");
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, s, a] = await Promise.all([getJson<{ user: ProfileUser }>("/api/profile"), getJson<Stats>("/api/profile/stats"), getJson<{ activity: ActivityDay[] }>("/api/profile/activity")]);
      setUser(p.user);
      setName(p.user.fullName);
      setStats(s);
      setActivity(a.activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    try {
      const res = await putJson<{ user: ProfileUser }>("/api/profile", { fullName: name });
      setUser(res.user);
      setEditOpen(false);
      toast("Profil güncellendi ✨");
    } catch (err) {
      toast("Kaydedilemedi", { desc: err instanceof Error ? err.message : "Hata", type: "error" });
    }
  };

  const shareProfile = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(`🦜 Parla Profilim: ${user.fullName} · Sv.${user.level} · ${user.streak} gün seri 🔥 · ${user.xp.toLocaleString("tr-TR")} XP`);
      fireConfetti();
      toast("Profil kartı kopyalandı 📋");
    } catch {
      toast("Paylaşım hazır 🔗", { type: "info" });
    }
  };

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <Mascot mood="sad" size={130} />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Profil yüklenemedi 😕</h1>
        <Button className="mt-5" onClick={() => void load()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!user || !stats || !activity) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-72 rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  const joined = new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const last30 = activity.slice(0, 30).reverse().map((a, i) => ({ day: `${i + 1}`, dk: a.minutes }));

  return (
    <div className="mx-auto max-w-5xl">
      {/* ═══════════════════════════ OYUNCU KARTI ══════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="overflow-hidden rounded-[2.5rem] border-2 border-line bg-surface shadow-pop">
        <div className="relative h-40 overflow-hidden sm:h-48" style={{ background: "linear-gradient(110deg, #46a302, #58cc02 40%, #1cb0f6 105%)" }}>
          <div className="dot-grid absolute inset-0 opacity-25" />
          {["🔥", "⚡", "🏆", "💎", "🦜"].map((e, i) => (
            <motion.span key={i} animate={{ y: [0, -12, 0], rotate: [0, i % 2 ? 10 : -10, 0] }} transition={{ duration: 3.4 + i * 0.6, repeat: Infinity, delay: i * 0.5 }} className="absolute text-2xl opacity-70 drop-shadow" style={{ left: `${12 + i * 19}%`, top: i % 2 ? "56%" : "20%" }}>
              {e}
            </motion.span>
          ))}
        </div>
        <div className="relative px-6 pb-7 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              <div className="relative">
                <ProgressRing value={60} size={124} stroke={9} color="var(--gold)" track="var(--raise)">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.2 }} className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primarystrong font-display text-3xl font-bold text-white shadow-pop ring-4 ring-surface">
                    {user.fullName.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()}
                  </motion.span>
                </ProgressRing>
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity }} className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-surface bg-gold px-2.5 py-1 font-display text-xs font-bold text-[#4a3800] shadow-md">
                  <Crown className="size-3 fill-current" /> Sv. {user.level}
                </motion.span>
              </div>
              <div className="pb-2">
                <h1 className="font-display text-3xl font-bold text-ink">{user.fullName}</h1>
                <p className="mt-0.5 text-sm font-bold text-mut">@{user.username} · katıldı: {joined}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {user.isPremium && (
                    <Badge tone="gold" className="bg-gold text-[#4a3800]">
                      <Crown className="size-3 fill-current" /> Süper Üye
                    </Badge>
                  )}
                  <Badge tone="accent">
                    <Flame className="size-3" /> {user.streak} gün seri
                  </Badge>
                  <Badge tone="violet">
                    <Swords className="size-3" /> Altın Lig
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 pb-1">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilLine className="size-4" /> Düzenle
              </Button>
              <Button variant="soft" onClick={() => void shareProfile()}>
                <Share2 className="size-4" /> Paylaş
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <StatChip icon={<Zap className="size-4.5 text-gold" />} value={<Counter to={user.xp} />} title="Toplam XP" />
            <StatChip icon={<Flame className="size-4.5 text-accent" />} value={`${user.streak} gün`} title="Aktif seri" />
            <StatChip icon={<Trophy className="size-4.5 text-gold" />} value={stats.lessonsDone} title="Ders" />
            <StatChip icon={<Diamond className="size-4.5 fill-azure text-azure" />} value={user.coins} title="Para" />
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ SAYAÇLAR ══════════════════════════════ */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: "⚡", label: "Toplam XP", value: user.xp, color: "text-gold" },
          { icon: "📖", label: "Öğrenilen Kelime", value: stats.wordsLearned, color: "text-primary" },
          { icon: "✅", label: "Tamamlanan Ders", value: stats.lessonsDone, color: "text-violet" },
          { icon: "⏱️", label: "Toplam Süre (dk)", value: stats.totalMinutes, color: "text-accent" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card hover className="p-5 text-center">
              <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }} className="inline-block text-2xl">
                {s.icon}
              </motion.span>
              <p className={cn("mt-2 font-display text-3xl font-bold", s.color)}>
                <Counter to={s.value} />
              </p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-mut">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════ SEKMELER ══════════════════════════════ */}
      <div className="mt-7 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border-2 px-5 py-2.5 font-display text-sm font-semibold transition-all", tab === t.id ? "border-transparent bg-primary text-primaryink shadow-[0_4px_0_var(--primary-strong)]" : "border-line bg-surface text-mut shadow-[0_3px_0_var(--line)] hover:text-ink")}>
            <t.icon className="size-4.5" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mt-6">
          {tab === "stats" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Beceri Radarı</h2>
                <p className="mt-0.5 text-xs font-semibold text-mut">{stats.perfectLessons} hatasız ders · {stats.wordsLearned} kelime</p>
                <div className="mt-2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={stats.skills} outerRadius="72%">
                      <PolarGrid stroke="var(--line)" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "var(--mut)", fontSize: 11, fontWeight: 800 }} />
                      <Radar dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.28} strokeWidth={2.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Son 30 Gün Çalışma Süresi</h2>
                <p className="mt-0.5 text-xs font-semibold text-mut">{activity.filter((a) => a.xp > 0).length} aktif gün</p>
                <div className="mt-2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last30} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis tick={{ fill: "var(--mut)", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<AreaTip />} cursor={{ stroke: "var(--line-strong)" }} />
                      <Area type="monotone" dataKey="dk" stroke="var(--primary)" strokeWidth={2.5} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {tab === "activity" && (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-ink">Son 6 Ay · Günlük Aktivite</h2>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-mut">
                  Az
                  {[0.2, 0.45, 0.7, 1].map((o) => (
                    <span key={o} className="size-3 rounded-[4px]" style={{ background: `color-mix(in srgb, var(--primary) ${o * 100}%, var(--raise))` }} />
                  ))}
                  Çok
                </div>
              </div>
              <div className="mt-5 overflow-x-auto pb-2">
                <div className="grid w-max grid-flow-col grid-rows-7 gap-[5px]">
                  {Array.from({ length: 182 }, (_, i) => {
                    const day = activity[i];
                    const intensity = day ? Math.min(4, Math.round((day.xp / 60) * 4)) : 0;
                    return (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.0012 }}
                        title={day ? `${day.date} · ${day.xp} XP · ${day.minutes} dk` : "aktivite yok"}
                        className="size-[14px] cursor-pointer rounded-[4px] transition-transform hover:scale-130"
                        style={{ background: intensity === 0 ? "var(--raise)" : `color-mix(in srgb, var(--primary) ${intensity * 25}%, var(--raise))` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-mut">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" /> {activity.filter((a) => a.xp > 0).length} aktif gün
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="size-4 text-accent" /> {stats.totalMinutes} dk toplam
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4 text-violet" /> En verimli saat: 21:00
                </span>
              </div>
            </Card>
          )}

          {tab === "langs" && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { flag: "🇬🇧", name: "İngilizce", level: "A1", pct: Math.round((stats.lessonsDone / 15) * 100), words: stats.wordsLearned, streak: `${user.streak} gün`, active: true },
                { flag: "🇪🇸", name: "İspanyolca", level: "A1", pct: 0, words: 0, streak: "—", active: false },
              ].map((l, i) => (
                <motion.div key={l.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}>
                  <Card hover className="h-full p-6">
                    <div className="flex items-center justify-between">
                      <motion.span whileHover={{ rotate: 8 }} className="text-4xl">
                        {l.flag}
                      </motion.span>
                      {l.active ? <Badge tone="primary">Aktif</Badge> : <Badge tone="mut">Yakında</Badge>}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold text-ink">{l.name}</h3>
                    <p className="text-xs font-bold text-mut">
                      {l.words} kelime · seri {l.streak}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-extrabold">
                        <span className="text-mut">Seviye {l.level}</span>
                        <span className="text-primary">%{l.pct}</span>
                      </div>
                      <ProgressBar value={l.pct} className="mt-1.5" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════════ DÜZENLEME ═════════════════════════════ */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="p-7">
          <h3 className="font-display text-xl font-bold text-ink">Profili Düzenle</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-ink">Görünen İsim</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border-2 border-line bg-surface px-4 text-[15px] font-medium text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_var(--primary-soft)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-ink">Kullanıcı Adı</label>
              <input value={user.username} disabled className="h-12 w-full rounded-xl border-2 border-line bg-raise px-4 text-[15px] font-medium text-mut outline-none" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" full onClick={() => setEditOpen(false)}>
              Vazgeç
            </Button>
            <Button full onClick={() => void saveProfile()}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
