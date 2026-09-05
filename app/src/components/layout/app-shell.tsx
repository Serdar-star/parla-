"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Bot,
  Crown,
  Diamond,
  Flame,
  Gamepad2,
  Heart,
  Languages,
  LayoutDashboard,
  Map,
  Moon,
  Repeat,
  Settings,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sun,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button, Modal, ProgressBar, StatChip, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { user } from "@/data/mock";
import { useApp } from "@/stores/app";
import { cn, fireConfetti, seeded } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: string; gold?: boolean };

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/lessons", label: "Dersler", icon: Map },
  { href: "/stories", label: "Hikayeler", icon: Sparkles, badge: "YENİ" },
  { href: "/review", label: "Tekrar", icon: Repeat },
  { href: "/ai-teacher", label: "AI Öğretmen", icon: Bot },
  { href: "/games", label: "Oyunlar", icon: Gamepad2 },
  { href: "/premium", label: "Süper", icon: Crown, gold: true },
  { href: "/dictionary", label: "Sözlük", icon: BookOpen },
  { href: "/leaderboard", label: "Sıralama", icon: Trophy },
  { href: "/friends", label: "Arkadaşlar", icon: Users },
  { href: "/achievements", label: "Başarımlar", icon: Award },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-[0_3px_0_var(--primary-strong)]">
        <Languages className="size-5 text-white" />
      </span>
      {!compact && (
        <span className={cn("font-display text-xl font-bold tracking-tight", light ? "text-white" : "text-ink")}>
          parla<span className="text-primary">.</span>
        </span>
      )}
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("size-10 rounded-xl border-2 border-line", className)} />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Tema değiştir"
      className={cn(
        "flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-surface text-mut shadow-[0_3px_0_var(--line)] transition-all hover:text-ink active:translate-y-[3px] active:shadow-none",
        className
      )}
    >
      <motion.span key={dark ? "moon" : "sun"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </motion.span>
    </button>
  );
}

/* -------------------------------- Seri takvimi ------------------------------- */

function StreakModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallet, addGems } = useApp();
  const { toast } = useToast();
  const todayKey = new Date().toDateString();
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    try {
      setClaimed(localStorage.getItem("parla-daily-claim") === todayKey);
    } catch {
      /* yok say */
    }
  }, [todayKey]);

  const claim = () => {
    addGems(10);
    try {
      localStorage.setItem("parla-daily-claim", todayKey);
    } catch {
      /* yok say */
    }
    setClaimed(true);
    fireConfetti();
    toast("Bugünün ödülü alındı! +10 💎", { desc: "Yarın yine gel, seri bozulmasın." });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`Parla'da ${user.streak} günlük seri yaptım! 🔥 Sen de katıl: parla.app/davet/ahmetyilmaz`);
      toast("Seri kartı panoya kopyalandı 📋", { desc: "Arkadaşlarınla paylaş, birlikte öğrenin." });
    } catch {
      toast("Paylaşım metni hazır 🔗", { desc: `Parla'da ${user.streak} günlük seri yaptım! 🔥`, type: "info" });
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Pzt=0
  const monthName = now.toLocaleDateString("tr-TR", { month: "long" });

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-gradient-to-b from-accentsoft to-surface p-7 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 15 }} className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent shadow-[0_5px_0_color-mix(in_srgb,var(--accent)_55%,black)]">
          <Flame className="size-10 text-white" />
        </motion.div>
        <h3 className="mt-4 font-display text-2xl font-bold text-ink">{user.streak} günlük seri!</h3>
        <p className="mt-1 text-sm font-semibold text-mut">Bu ay {today} günün {user.streak >= today ? "tamamında" : `${Math.min(user.streak, today)} gününde`} ateş yaktın 🔥</p>

        <div className="mt-6 rounded-2xl border-2 border-line bg-surface p-4">
          <p className="font-display text-sm font-semibold text-ink">{monthName} {year}</p>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
            {["P", "S", "Ç", "P", "C", "C", "P"].map((d, i) => (
              <span key={i} className="text-[10px] font-extrabold text-mut">
                {d}
              </span>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const done = d < today ? seeded(d * 3.7) > 0.12 : d === today;
              const isToday = d === today;
              return (
                <motion.span
                  key={d}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: d * 0.012 }}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg text-[11px] font-extrabold",
                    done ? "bg-accentsoft text-accent" : "bg-raise text-mut/60",
                    isToday && "ring-2 ring-accent"
                  )}
                >
                  {done ? "🔥" : d}
                </motion.span>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={claim}
            disabled={claimed}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 text-left transition-all",
              claimed ? "cursor-default border-line bg-raise opacity-80" : "border-azure/30 bg-azuresoft hover:-translate-y-0.5"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{claimed ? "✅" : "🎁"}</span>
              <div className="text-left">
                <p className="text-sm font-extrabold text-ink">{claimed ? "Ödül alındı" : "Bugünün ödülü"}</p>
                <p className="text-xs font-semibold text-mut">{claimed ? "Yarın yine gel!" : "+10 elmas seni bekliyor"}</p>
              </div>
            </div>
            {!claimed && <Diamond className="size-5 fill-azure text-azure" />}
          </button>
          <button onClick={share} className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-accent/30 bg-accentsoft p-4 text-left transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📸</span>
              <div className="text-left">
                <p className="text-sm font-extrabold text-ink">Serini Paylaş</p>
                <p className="text-xs font-semibold text-mut">Kartı panoya kopyala</p>
              </div>
            </div>
            <Flame className="size-5 fill-accent text-accent" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-azure/30 bg-azuresoft p-4">
          <div className="flex items-center gap-3">
            <Snowflake className="size-6 text-azure" />
            <div className="text-left">
              <p className="text-sm font-extrabold text-ink">Seri Kalkanı</p>
              <p className="text-xs font-semibold text-mut">Bir gün kaçırırsan serini korur</p>
            </div>
          </div>
          <span className="rounded-xl bg-azure px-3 py-1.5 font-display text-sm font-semibold text-white">{wallet.freezes} adet</span>
        </div>

        <Button variant="outline" full className="mt-5" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------- Mağaza ---------------------------------- */

function ShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallet, spendGems, refillHearts, addFreeze, setDoubleXp } = useApp();
  const { toast } = useToast();

  const buy = (id: "freeze" | "hearts" | "double") => {
    const price = id === "freeze" ? 200 : id === "hearts" ? 350 : 300;
    if (!spendGems(price)) {
      toast("Yetersiz elmas 💎", { desc: "Ders bitirerek daha fazla kazanabilirsin.", type: "warning" });
      return;
    }
    if (id === "freeze") {
      addFreeze();
      toast("Seri Kalkanı alındı 🛡️", { desc: "Cüzdanına eklendi." });
    }
    if (id === "hearts") {
      refillHearts();
      toast("Canlar dolduruldu ❤️", { desc: "5/5 can ile devam!" });
    }
    if (id === "double") {
      setDoubleXp(true);
      toast("Çifte XP aktif ⚡", { desc: "24 saat boyunca iki kat XP." });
    }
    fireConfetti();
  };

  const items = [
    { id: "freeze" as const, icon: <Snowflake className="size-6 text-azure" />, title: "Seri Kalkanı", desc: "Bir gün ders yapamasan bile serin yanmaz.", price: 200, owned: `${wallet.freezes} adet`, disabled: false },
    { id: "hearts" as const, icon: <Heart className="size-6 fill-danger text-danger" />, title: "Can Doldur", desc: "5 canının tamamını geri yükle.", price: 350, owned: `${wallet.hearts}/5 dolu`, disabled: wallet.hearts === 5 },
    { id: "double" as const, icon: <Zap className="size-6 text-gold" />, title: "Çifte XP", desc: "24 saat boyunca tüm derslerden 2x XP.", price: 300, owned: wallet.doubleXp ? "aktif" : "pasif", disabled: wallet.doubleXp },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b-2 border-line bg-azuresoft px-6 py-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-6 text-azure" />
          <h3 className="font-display text-xl font-bold text-ink">Mağaza</h3>
        </div>
        <StatChip icon={<Diamond className="size-4.5 fill-azure text-azure" />} value={wallet.gems} />
      </div>
      <div className="flex items-center gap-4 px-6 pt-6">
        <Mascot mood="happy" size={72} className="shrink-0" />
        <p className="text-sm font-semibold leading-snug text-mut">
          Merhaba! Ben <span className="font-extrabold text-ink">Piko</span> 🦜 Elmaslarını güçlendirmelere çevirelim mi?
        </p>
      </div>
      <div className="space-y-3 p-6">
        {items.map((it) => (
          <div key={it.id} className={cn("flex items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4", it.disabled && "opacity-60")}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-raise">{it.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-ink">
                {it.title} <span className="ml-1 rounded-md bg-raise px-1.5 py-0.5 text-[10px] font-extrabold text-mut">{it.owned}</span>
              </p>
              <p className="text-xs font-semibold text-mut">{it.desc}</p>
            </div>
            <Button size="sm" variant="azure" disabled={it.disabled} onClick={() => buy(it.id)}>
              <Diamond className="size-3.5 fill-current" /> {it.price}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* --------------------------------- Status bar -------------------------------- */

function StatusBar({ compact = false }: { compact?: boolean }) {
  const { wallet } = useApp();
  const [streakOpen, setStreakOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <>
      <div className={cn("flex items-center gap-2", compact && "gap-1.5")}>
        <StatChip title="Günlük seri" icon={<Flame className="size-4.5 text-accent" />} value={user.streak} onClick={() => setStreakOpen(true)} />
        <StatChip title="Elmaslar" icon={<Diamond className="size-4.5 fill-azure text-azure" />} value={wallet.gems} onClick={() => setShopOpen(true)} />
        <StatChip title={wallet.isSuper ? "Süper: sınırsız can" : "Canlar"} icon={wallet.isSuper ? <Crown className="size-4.5 fill-gold text-gold" /> : <Heart className="size-4.5 fill-danger text-danger" />} value={wallet.isSuper ? "∞" : wallet.hearts} onClick={() => setShopOpen(true)} />
        <ThemeToggle />
      </div>
      <StreakModal open={streakOpen} onClose={() => setStreakOpen(false)} />
      <ShopModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </>
  );
}

/* ---------------------------------- Sidebar ---------------------------------- */

function Sidebar() {
  const pathname = usePathname();
  const { wallet } = useApp();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r-2 border-line bg-surface lg:flex">
      <div className="px-6 pb-5 pt-7">
        <Logo />
      </div>

      <Link href="/profile" className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border-2 border-line bg-bg p-3 shadow-[0_3px_0_var(--line)] transition-all hover:-translate-y-0.5">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white shadow-[0_3px_0_var(--primary-strong)]">
          {user.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{user.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-md bg-goldsoft px-1.5 py-0.5 text-[10px] font-extrabold text-gold">Sv. {user.level}</span>
            <div className="flex-1">
              <ProgressBar value={(user.levelXp / (user.levelXp + user.xpToNext)) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </Link>

      <nav className="mt-1 flex-1 space-y-1.5 overflow-y-auto px-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href === "/lessons" && pathname.startsWith("/lessons"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 font-display text-[15px] font-medium tracking-wide transition-all duration-150",
                active
                  ? "border-line bg-primarysoft text-primarystrong shadow-[0_3px_0_var(--line)]"
                  : item.gold
                    ? "border-transparent text-gold hover:bg-goldsoft"
                    : "border-transparent text-mut hover:bg-raise"
              )}
            >
              <Icon className={cn("size-5.5", active ? "text-primarystrong" : item.gold ? "fill-gold text-gold" : "text-mut")} strokeWidth={active ? 2.6 : 2} />
              <span className="uppercase">{item.label}</span>
              {item.href === "/review" && !active && (
                <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white">8</span>
              )}
              {item.badge && !active && item.href !== "/review" && (
                <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[9px] font-extrabold text-[#4a3800]">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        {wallet.isSuper ? (
          <div className="relative overflow-hidden rounded-3xl border-2 border-gold/60 bg-gradient-to-br from-goldsoft to-surface p-4 shadow-[0_4px_0_color-mix(in_srgb,var(--gold)_50%,transparent)]">
            <div className="flex items-center gap-2.5">
              <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="flex size-9 items-center justify-center rounded-xl bg-gold shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_55%,black)]">
                <Crown className="size-5 fill-[#4a3800] text-[#4a3800]" />
              </motion.span>
              <div>
                <p className="font-display text-base font-semibold text-ink">Süper Aktif 👑</p>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gold">Sınırsız can açık</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-mut">Ayrıcalıklarının keyfini çıkar, şampiyon.</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border-2 border-gold/50 bg-goldsoft p-4 shadow-[0_4px_0_color-mix(in_srgb,var(--gold)_50%,transparent)]">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gold shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_55%,black)]">
                <Crown className="size-5 text-[#4a3800]" />
              </span>
              <p className="font-display text-base font-semibold text-ink">Parla Süper</p>
            </div>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-mut">Sınırsız can, kişisel plan ve seri kalkanı. İlk 7 gün ücretsiz!</p>
            <Button variant="gold" size="sm" className="mt-3" href="/premium">
              Süper'i Dene 👑
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* --------------------------------- Mobil nav ---------------------------------- */

function MobileNav() {
  const pathname = usePathname();
  const items = navItems.filter((i) => ["/dashboard", "/lessons", "/review", "/leaderboard", "/profile"].includes(i.href));
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-line bg-surface/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Logo compact />
        <StatusBar compact />
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href === "/lessons" && pathname.startsWith("/lessons"));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative flex w-16 flex-col items-center gap-0.5 py-1.5">
                {active && <motion.span layoutId="mobile-pill" className="absolute -top-1.5 h-1.5 w-9 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <motion.span animate={{ scale: active ? 1.18 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  <Icon className={cn("size-6", active ? "text-primarystrong" : "text-mut")} strokeWidth={active ? 2.6 : 2} />
                </motion.span>
                <span className={cn("text-[10px] font-extrabold", active ? "text-primarystrong" : "text-mut")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileNav />
      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-[280px] lg:px-10 lg:pb-12 lg:pt-6">
        <div className="mb-5 hidden justify-end lg:flex">
          <StatusBar />
        </div>
        {children}
      </main>
    </div>
  );
}
