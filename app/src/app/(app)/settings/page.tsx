"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  Crown,
  Database,
  Download,
  Eye,
  FlaskConical,
  GraduationCap,
  HardDrive,
  Info,
  Laptop,
  Link2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  PartyPopper,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  UserRound,
  Volume2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge, Button, Card, Input, Modal, Toggle, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { user } from "@/data/mock";
import { useApp } from "@/stores/app";
import { putJson } from "@/lib/api";
import { cn, fireConfetti, playTone, speak } from "@/lib/utils";

const sections = [
  { id: "hesap", label: "Hesap", icon: UserRound, desc: "Profil, güvenlik, bağlantılar", color: "#58cc02" },
  { id: "abonelik", label: "Abonelik", icon: Crown, desc: "Plan, fatura, iptal", color: "#ffc800" },
  { id: "gorunum", label: "Görünüm", icon: Palette, desc: "Tema ve yazı tipi", color: "#9b5cff" },
  { id: "ogrenme", label: "Öğrenme", icon: GraduationCap, desc: "Hedefler, sesler, kutlamalar", color: "#1cb0f6" },
  { id: "bildirim", label: "Bildirimler", icon: Bell, desc: "Hatırlatmalar", color: "#ff9600" },
  { id: "gizlilik", label: "Gizlilik", icon: Eye, desc: "Görünürlük", color: "#ff4b4b" },
  { id: "veri", label: "Veri ve Depolama", icon: Database, desc: "İndir, sıfırla, yönet", color: "#2dd4bf" },
  { id: "hakkinda", label: "Hakkında", icon: Info, desc: "Parla'nın hikâyesi + Lab", color: "#ffc800" },
];

const goalComments: Record<number, string> = {
  5: "Minik ama istikrarlı adımlar — kaplumbağa stratejisi! 🐢",
  10: "Tam tatlı nokta! Çoğu şampiyon böyle başlıyor. 🚶",
  15: "Ciddi öğrenen sinyali aldım. Piko gururlu. 🏃",
  30: "Vay! Olimpiyat kampı modu. Su içmeyi unutma! 🚀",
};

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-line bg-bg p-4">
      <div>
        <p className="text-sm font-extrabold text-ink">{title}</p>
        <p className="text-xs font-bold text-mut">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, color }: { icon: typeof Bell; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: color, boxShadow: `0 4px 0 color-mix(in srgb, ${color} 55%, black)` }}>
        <Icon className="size-6" />
      </span>
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm font-semibold text-mut">{desc}</p>
      </div>
    </div>
  );
}

function ThemePreview({ mode }: { mode: "light" | "dark" | "system" }) {
  return (
    <div className={cn("h-24 w-full overflow-hidden rounded-xl border-2 transition-all", mode === "light" ? "border-line bg-[#f7f8f3]" : mode === "dark" ? "border-[#2b4250] bg-[#0e1a20]" : "border-line")}>
      {mode === "system" ? (
        <div className="flex h-full">
          <div className="flex-1 bg-[#f7f8f3] p-2">
            <div className="h-2.5 w-3/4 rounded-full bg-[#e2e4da]" />
            <div className="mt-1.5 h-6 w-full rounded-lg bg-[#58cc02]" />
            <div className="mt-1.5 h-2.5 w-1/2 rounded-full bg-[#e2e4da]" />
          </div>
          <div className="flex-1 bg-[#0e1a20] p-2">
            <div className="h-2.5 w-3/4 rounded-full bg-[#2b4250]" />
            <div className="mt-1.5 h-6 w-full rounded-lg bg-[#58cc02]" />
            <div className="mt-1.5 h-2.5 w-1/2 rounded-full bg-[#2b4250]" />
          </div>
        </div>
      ) : (
        <div className="p-2">
          <div className={cn("h-2.5 w-3/4 rounded-full", mode === "light" ? "bg-[#e2e4da]" : "bg-[#2b4250]")} />
          <div className="mt-1.5 h-6 w-full rounded-lg bg-[#58cc02] shadow-[0_2px_0_#46a302]" />
          <div className={cn("mt-1.5 h-2.5 w-1/2 rounded-full", mode === "light" ? "bg-[#e2e4da]" : "bg-[#2b4250]")} />
          <div className={cn("mt-1.5 h-2.5 w-2/3 rounded-full", mode === "light" ? "bg-[#e2e4da]" : "bg-[#2b4250]")} />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState("hesap");
  const { settings, update, wallet } = useApp();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [profile, setProfile] = useState({ name: user.name, email: "ahmet@parla.app", username: user.handle });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome · Windows", icon: Laptop, place: "İstanbul, TR", time: "Şu an aktif", current: true },
    { id: 2, device: "Parla iOS · iPhone 15", icon: Smartphone, place: "İstanbul, TR", time: "2 saat önce", current: false },
    { id: 3, device: "Safari · MacBook", icon: Monitor, place: "Ankara, TR", time: "3 gün önce", current: false },
  ]);
  const [connected, setConnected] = useState({ google: true, apple: false });
  const [lab, setLab] = useState({ retro: false, nightOwl: false, bossVoice: false });
  const [pikoClicks, setPikoClicks] = useState(0);

  useEffect(() => setMounted(true), []);

  const current = sections.find((s) => s.id === section) ?? sections[0];

  const toggleDay = (d: number) => {
    const next = settings.notifDays.includes(d) ? settings.notifDays.filter((x) => x !== d) : [...settings.notifDays, d].sort();
    update({ notifDays: next });
  };

  const exportData = () => {
    const payload = {
      uygulama: "Parla v3.0",
      exportAt: new Date().toISOString(),
      profil: { name: profile.name, handle: profile.username, email: profile.email, level: user.level, totalXp: user.totalXp, streak: user.streak, cefr: user.cefr },
      cüzdan: wallet,
      tercihler: settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parla-verilerim.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Verilerin indirildi 📦", { desc: "parla-verilerim.json dosyan hazır." });
  };

  const resetLocal = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("parla-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* yok say */
    }
    setResetOpen(false);
    toast("Yerel veriler temizlendi 🧹", { desc: "Sayfa yeniden yükleniyor..." });
    setTimeout(() => window.location.reload(), 900);
  };

  const pokePiko = () => {
    const n = pikoClicks + 1;
    setPikoClicks(n);
    if (n === 5) {
      fireConfetti(true);
      toast("Gizli başarım açıldı! 🥚", { desc: "“Meraklı Kaşif” — Piko'yu 5 kez dürttün." });
      setPikoClicks(0);
    } else if (n >= 3) {
      toast(`Piko gıdıklanıyor... (${5 - n} kaldı) 👀`, { type: "info" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Görev Kontrol Odası 🎛️</h1>
          <p className="mt-2 text-sm font-semibold text-mut">Parla deneyimini kendine göre ayarla — her düğme bir şeyi gerçekten değiştirir.</p>
        </div>
        <Badge tone="primary" className="normal-case tracking-normal">
          <ShieldCheck className="size-3.5" /> Tercihlerin cihazında saklanır
        </Badge>
      </motion.div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ═══════════════════════════ SOL NAV ═══════════════════════════ */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto no-scrollbar lg:block lg:space-y-2.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-200 lg:w-full",
                section === s.id ? "border-transparent bg-surface shadow-pop" : "border-line bg-surface/60 shadow-[0_3px_0_var(--line)] hover:bg-surface"
              )}
              style={section === s.id ? { borderColor: `color-mix(in srgb, ${s.color} 50%, var(--line))` } : undefined}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-all" style={{ background: section === s.id ? s.color : "var(--raise)", color: section === s.id ? "white" : "var(--mut)", boxShadow: section === s.id ? `0 3px 0 color-mix(in srgb, ${s.color} 55%, black)` : undefined }}>
                <s.icon className="size-5" />
              </span>
              <span>
                <span className={cn("block font-display text-sm font-semibold", section === s.id ? "text-ink" : "text-mut")}>{s.label}</span>
                <span className="hidden text-xs font-bold text-mut lg:block">{s.desc}</span>
              </span>
              {section === s.id && (
                <motion.span layoutId="settings-pill" className="ml-auto hidden size-2.5 shrink-0 rounded-full lg:block" style={{ background: s.color }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
            </button>
          ))}
        </motion.div>

        {/* ═══════════════════════════ SAĞ PANEL ══════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="space-y-5">
            {/* ═══════════════════════════ HESAP ═══════════════════════════ */}
            {section === "hesap" && (
              <>
                <Card className="p-7">
                  <SectionTitle icon={UserRound} title="Hesap Bilgileri" desc="Profilini güncelle, bilgilerini taze tut." color={current.color} />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Input label="Ad Soyad" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                    <Input label="Kullanıcı Adı" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
                    <div className="sm:col-span-2">
                      <Input label="E-posta" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <Button
                    className="mt-5"
                    onClick={() =>
                      void putJson("/api/profile", { fullName: profile.name, username: profile.username })
                        .then(() => toast("Profil kaydedildi ✅", { desc: "Bilgilerin güncellendi." }))
                        .catch((err) => toast("Kaydedilemedi", { desc: err instanceof Error ? err.message : "Hata", type: "error" }))
                    }
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </Card>

                <Card className="p-7">
                  <h3 className="font-display text-lg font-semibold text-ink">Şifre Değiştir 🔐</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Input label="Mevcut Şifre" type="password" placeholder="••••••••" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
                    <Input label="Yeni Şifre" type="password" placeholder="••••••••" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
                  </div>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      if (pw.next.length < 8) {
                        toast("Şifre çok kısa", { desc: "Yeni şifre en az 8 karakter olmalı.", type: "warning" });
                        return;
                      }
                      void putJson("/api/settings/password", { current: pw.current, next: pw.next })
                        .then(() => {
                          setPw({ current: "", next: "" });
                          toast("Şifre güncellendi 🔐", { desc: "Yeni şifrenle devam edebilirsin." });
                        })
                        .catch((err) => toast("Şifre değiştirilemedi", { desc: err instanceof Error ? err.message : "Mevcut şifreni kontrol et.", type: "error" }));
                    }}
                  >
                    Şifreyi Güncelle
                  </Button>
                </Card>

                {/* güvenlik */}
                <Card className="p-7">
                  <h3 className="font-display text-lg font-semibold text-ink">Güvenlik 🛡️</h3>
                  <div className="mt-4 space-y-3">
                    <SettingRow title="İki Adımlı Doğrulama" desc="Girişte ek onay kodu — hesabın kale gibi olur">
                      <Toggle
                        checked={settings.twoFactor}
                        onChange={(v) => {
                          update({ twoFactor: v });
                          toast(v ? "2FA aktif edildi 🛡️" : "2FA kapatıldı", { desc: v ? "Bir sonraki girişinde SMS kodu istenecek." : "Hesabın yine de şifrenle korunuyor.", type: v ? "success" : "warning" });
                        }}
                      />
                    </SettingRow>

                    <div className="rounded-2xl border-2 border-line bg-bg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-ink">Aktif Oturumlar</p>
                          <p className="text-xs font-bold text-mut">Hesabının açık olduğu cihazlar</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSessions((s) => s.filter((x) => x.current));
                            toast("Diğer oturumlar kapatıldı 🔒", { desc: "Sadece bu cihaz aktif." });
                          }}
                        >
                          <LogOut className="size-3.5" /> Diğerlerini Kapat
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <AnimatePresence>
                          {sessions.map((s) => (
                            <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="flex items-center gap-3 rounded-xl border-2 border-line bg-surface p-3">
                              <span className={cn("flex size-10 items-center justify-center rounded-xl", s.current ? "bg-primarysoft text-primarystrong" : "bg-raise text-mut")}>
                                <s.icon className="size-5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-extrabold text-ink">
                                  {s.device} {s.current && <Badge tone="primary" className="ml-1.5">Bu cihaz</Badge>}
                                </p>
                                <p className="text-xs font-bold text-mut">
                                  {s.place} · {s.time}
                                </p>
                              </div>
                              {!s.current && (
                                <button onClick={() => { setSessions((x) => x.filter((y) => y.id !== s.id)); toast("Oturum kapatıldı", { desc: `${s.device} çıkarıldı.`, type: "info" }); }} className="cursor-pointer rounded-lg border-2 border-line px-2.5 py-1.5 text-[11px] font-extrabold text-mut transition hover:border-danger hover:text-danger">
                                  Çıkar
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* bağlı hesaplar */}
                <Card className="p-7">
                  <h3 className="font-display text-lg font-semibold text-ink">Bağlı Hesaplar 🔗</h3>
                  <p className="mt-1 text-xs font-semibold text-mut">Tek dokunuşla giriş için hesaplarını bağla.</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { key: "google" as const, name: "Google", sub: connected.google ? "ahmet@parla.app bağlı" : "Tek dokunuşla giriş", logo: "G", cls: "bg-white text-[#4285F4] border-line" },
                      { key: "apple" as const, name: "Apple", sub: connected.apple ? "Apple ID bağlı" : "Face ID ile giriş", logo: "", cls: "bg-ink text-bg border-line" },
                    ].map((a) => (
                      <div key={a.key} className="flex items-center gap-4 rounded-2xl border-2 border-line bg-bg p-4">
                        <span className={cn("flex size-11 items-center justify-center rounded-xl border-2 font-display text-lg font-bold", a.cls)}>{a.logo}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-ink">{a.name}</p>
                          <p className="text-xs font-bold text-mut">{a.sub}</p>
                        </div>
                        {connected[a.key] ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConnected((c) => ({ ...c, [a.key]: false }));
                              toast(`${a.name} bağlantısı kaldırıldı`, { type: "info" });
                            }}
                          >
                            Bağlantıyı Kes
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setConnected((c) => ({ ...c, [a.key]: true }));
                              toast(`${a.name} bağlandı ✅`, { desc: "Artık tek dokunuşla giriş yapabilirsin." });
                            }}
                          >
                            <Link2 className="size-3.5" /> Bağla
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-danger/30 bg-dangersoft/60 p-6">
                  <div className="flex items-center gap-4">
                    <Mascot mood="sad" size={72} className="grayscale-[0.3]" />
                    <div>
                      <p className="font-display text-base font-semibold text-danger">Tehlikeli Bölge</p>
                      <p className="mt-0.5 text-xs font-bold text-danger/80">Hesabını silmek {user.streak} günlük serini, {user.totalXp.toLocaleString("tr-TR")} XP'ni ve tüm rozetlerini yakar. Geri dönüşü yok.</p>
                    </div>
                  </div>
                  <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" /> Hesabı Sil
                  </Button>
                </div>
              </>
            )}

            {/* ═══════════════════════════ ABONELİK ═════════════════════════ */}
            {section === "abonelik" && (
              <Card className="p-7">
                <SectionTitle icon={Crown} title="Abonelik" desc="Mevcut planın, faturalandırma ve iptal." color={current.color} />
                <div className="mt-6 rounded-2xl border-2 border-gold/40 bg-goldsoft/50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-gold text-2xl">👑</span>
                    <div>
                      <p className="font-display text-lg font-bold text-ink">{wallet.isSuper ? "Premium Aktif" : "Ücretsiz Plan"}</p>
                      <p className="text-xs font-semibold text-mut">
                        {wallet.isSuper ? "Sınırsız can, AI ve çevrimdışı açık" : "Günde 3 ders · 20 AI mesajı"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-bold text-mut">Sonraki ödeme: {wallet.isSuper ? "30 gün sonra" : "—"}</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button variant="gold" href="/premium">
                    Planı Değiştir
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void fetch("/api/payment/create-portal", { method: "POST" })
                        .then((r) => r.json())
                        .then((d) => {
                          if (d.url) window.location.href = d.url;
                          else toast("Portal açılamadı", { type: "warning" });
                        })
                        .catch(() => toast("Portal açılamadı", { type: "error" }));
                    }}
                  >
                    Aboneliği Yönet
                  </Button>
                </div>
                <Button className="mt-3" variant="outline" href="/settings/downloads">
                  <Download className="size-4" /> Çevrimdışı İndirmeler
                </Button>
                <p className="mt-4 text-xs font-semibold text-mut">30 gün iade garantisi · Stripe ile güvenli ödeme</p>
              </Card>
            )}

            {/* ═══════════════════════════ GÖRÜNÜM ═════════════════════════ */}
            {section === "gorunum" && (
              <Card className="p-7">
                <SectionTitle icon={Palette} title="Görünüm" desc="Karanlık, aydınlık ya da sistem — gözlerin karar versin." color={current.color} />

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "Aydınlık", icon: Sun },
                    { id: "dark", label: "Karanlık", icon: Moon },
                    { id: "system", label: "Sistem", icon: Monitor },
                  ].map((t) => {
                    const active = mounted && theme === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setTheme(t.id);
                          toast(`${t.label} tema aktif ${t.id === "dark" ? "🌙" : t.id === "light" ? "☀️" : "🖥️"}`, { desc: "Anında uygulandı." });
                        }}
                        className={cn("cursor-pointer rounded-2xl border-2 p-3.5 transition-all", active ? "border-violet bg-violetsoft shadow-[0_4px_0_color-mix(in_srgb,var(--violet)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <ThemePreview mode={t.id as "light" | "dark" | "system"} />
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <t.icon className={cn("size-4", active ? "text-violet" : "text-mut")} />
                          <span className={cn("text-xs font-extrabold", active ? "text-violet" : "text-mut")}>{t.label}</span>
                          {active && <Check className="size-3.5 text-violet" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-extrabold text-ink">Yazı Boyutu</p>
                  <div className="flex gap-3">
                    {([
                      { id: "sm", label: "Küçük", cls: "text-xs" },
                      { id: "md", label: "Normal", cls: "text-base" },
                      { id: "lg", label: "Büyük", cls: "text-xl" },
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          update({ fontSize: f.id });
                          toast(`Yazı boyutu: ${f.label}`, { desc: "Tüm sayfaya uygulandı.", type: "info" });
                        }}
                        className={cn("flex-1 cursor-pointer rounded-2xl border-2 p-4 text-center transition-all", settings.fontSize === f.id ? "border-violet bg-violetsoft shadow-[0_3px_0_color-mix(in_srgb,var(--violet)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className={cn("font-display font-bold", f.cls, settings.fontSize === f.id ? "text-violet" : "text-ink")}>Aa</span>
                        <p className="mt-1 text-xs font-bold text-mut">{f.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-extrabold text-ink">Uygulama Dili</p>
                  <select
                    defaultValue="tr"
                    onChange={(e) => toast("Arayüz dili güncellendi 🌐", { desc: e.target.value === "tr" ? "Türkçe olarak devam ediyorsun." : "Bu demoda arayüz Türkçe kalır.", type: "info" })}
                    className="h-12 w-full max-w-xs cursor-pointer rounded-xl border-2 border-line bg-surface px-4 text-sm font-bold text-ink outline-none transition focus:border-violet"
                  >
                    <option value="tr">🇹🇷 Türkçe</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="de">🇩🇪 Deutsch</option>
                  </select>
                </div>
              </Card>
            )}

            {/* ═══════════════════════════ ÖĞRENME ═════════════════════════ */}
            {section === "ogrenme" && (
              <>
                <Card className="p-7">
                  <SectionTitle icon={GraduationCap} title="Öğrenme Tercihleri" desc="Hedefini seç, Piko'yu dinle." color={current.color} />

                  <p className="mt-6 text-sm font-extrabold text-ink">Günlük Hedef</p>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {[
                      { min: 5, emoji: "🐢", label: "Rahat" },
                      { min: 10, emoji: "🚶", label: "Dengeli" },
                      { min: 15, emoji: "🏃", label: "Ciddi" },
                      { min: 30, emoji: "🚀", label: "Yoğun" },
                    ].map((m) => (
                      <motion.button
                        key={m.min}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          update({ dailyGoal: m.min });
                          void putJson("/api/profile", { dailyGoal: m.min }).catch(() => undefined);
                          toast(`Günlük hedef: ${m.min} dakika 🎯`);
                        }}
                        className={cn("cursor-pointer rounded-2xl border-2 p-4 text-center transition-all", settings.dailyGoal === m.min ? "border-azure bg-azuresoft shadow-[0_4px_0_color-mix(in_srgb,var(--azure)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="text-3xl">{m.emoji}</span>
                        <p className="mt-2 font-display text-lg font-bold text-ink">{m.min}</p>
                        <p className="text-[10px] font-extrabold uppercase text-mut">{m.label}</p>
                      </motion.button>
                    ))}
                  </div>

                  <motion.div key={settings.dailyGoal} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-azure/30 bg-azuresoft p-4">
                    <Mascot mood="happy" size={56} className="shrink-0" />
                    <p className="text-sm font-bold text-ink">{goalComments[settings.dailyGoal]}</p>
                  </motion.div>

                  <div className="mt-7 space-y-3">
                    <SettingRow title="Ses Efektleri" desc="Doğru/yanlış cevap ve kutlama melodileri">
                      <Toggle
                        checked={settings.sound}
                        onChange={(v) => {
                          update({ sound: v });
                          if (v) playTone("correct");
                        }}
                      />
                    </SettingRow>
                    <SettingRow title="Mikrofon İzni" desc="Konuşma sorularında telaffuzunu analiz edelim">
                      <Toggle checked={settings.mic} onChange={(v) => update({ mic: v })} />
                    </SettingRow>
                    <SettingRow title="Zengin Animasyonlar" desc="Konfeti, uçuşan XP'ler ve kutlama şovları">
                      <Toggle checked={settings.animations} onChange={(v) => update({ animations: v })} />
                    </SettingRow>
                  </div>
                </Card>

                {/* kutlama ve ses ayarları */}
                <Card className="p-7">
                  <h3 className="font-display text-lg font-semibold text-ink">Kutlama Ayarları 🎉</h3>
                  <p className="mt-1 text-xs font-semibold text-mut">Konfeti yoğunluğu tüm uygulamada anında etkili olur.</p>

                  <p className="mt-5 text-sm font-extrabold text-ink">Konfeti Yoğunluğu</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {([
                      { id: "az", label: "Az", emoji: "✨" },
                      { id: "normal", label: "Normal", emoji: "🎊" },
                      { id: "cok", label: "Çılgın", emoji: "🌋" },
                    ] as const).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          update({ confetti: c.id });
                          toast(`Konfeti: ${c.label} ${c.emoji}`, { type: "info" });
                        }}
                        className={cn("cursor-pointer rounded-2xl border-2 p-4 text-center transition-all", settings.confetti === c.id ? "border-gold bg-goldsoft shadow-[0_3px_0_color-mix(in_srgb,var(--gold)_40%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <p className="mt-1.5 text-sm font-extrabold text-ink">{c.label}</p>
                      </button>
                    ))}
                  </div>
                  <Button variant="soft" size="sm" className="mt-3" onClick={() => fireConfetti(true)}>
                    <PartyPopper className="size-3.5" /> Deneme Ateşi
                  </Button>

                  <div className="my-6 h-px bg-line" />

                  <p className="text-sm font-extrabold text-ink">Konuşma Sesi Hızı</p>
                  <p className="mt-0.5 text-xs font-semibold text-mut">Kelime seslendirmelerinin temposu — yavaş başla, sonra hızlan.</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {([
                      { rate: 0.6, label: "Yavaş", emoji: "🐢" },
                      { rate: 0.95, label: "Normal", emoji: "🚶" },
                      { rate: 1.3, label: "Hızlı", emoji: "⚡" },
                    ] as const).map((r) => (
                      <button
                        key={r.label}
                        onClick={() => {
                          update({ ttsRate: r.rate });
                          toast(`Ses hızı: ${r.label}`, { type: "info" });
                        }}
                        className={cn("cursor-pointer rounded-2xl border-2 p-4 text-center transition-all", settings.ttsRate === r.rate ? "border-azure bg-azuresoft shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="text-2xl">{r.emoji}</span>
                        <p className="mt-1.5 text-sm font-extrabold text-ink">{r.label}</p>
                      </button>
                    ))}
                  </div>
                  <Button variant="soft" size="sm" className="mt-3" onClick={() => speak("The quick brown fox jumps over the lazy dog.")}>
                    <Volume2 className="size-3.5" /> Sesle Test Et
                  </Button>
                </Card>
              </>
            )}

            {/* ═══════════════════════════ BİLDİRİMLER ═════════════════════ */}
            {section === "bildirim" && (
              <Card className="p-7">
                <SectionTitle icon={Bell} title="Bildirimler" desc="Serini korumak için nazik dürtmeler ayarla." color={current.color} />

                <div className="mt-6 grid gap-8 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-extrabold text-ink">Hatırlatma Saati</p>
                    <input
                      type="time"
                      value={settings.notifTime}
                      onChange={(e) => update({ notifTime: e.target.value })}
                      className="mt-3 h-13 w-full max-w-[200px] cursor-pointer rounded-2xl border-2 border-line bg-surface px-4 font-display text-lg font-bold text-ink outline-none transition focus:border-accent"
                    />

                    <p className="mt-6 text-sm font-extrabold text-ink">Hatırlatma Günleri</p>
                    <div className="mt-3 flex gap-2">
                      {dayNames.map((d, i) => {
                        const on = settings.notifDays.includes(i);
                        return (
                          <motion.button
                            key={d}
                            whileTap={{ scale: 0.88 }}
                            onClick={() => toggleDay(i)}
                            className={cn("size-11 cursor-pointer rounded-xl border-2 font-display text-xs font-bold transition-all", on ? "border-transparent bg-accent text-white shadow-[0_3px_0_color-mix(in_srgb,var(--accent)_55%,black)]" : "border-line bg-surface text-mut hover:border-accent")}
                          >
                            {d}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs font-bold text-mut">{settings.notifDays.length === 7 ? "Her gün — şampiyon disiplini! 🏆" : settings.notifDays.length === 0 ? "Sessiz mod — ama serin riske girer! 😬" : `Haftada ${settings.notifDays.length} gün dürtme gelecek.`}</p>

                    <div className="mt-6 space-y-3">
                      <SettingRow title="Ders Hatırlatması" desc={`Her gün ${settings.notifTime}'da ders zamanı bildirimi`}>
                        <Toggle checked={settings.notifLesson} onChange={(v) => update({ notifLesson: v })} />
                      </SettingRow>
                      <SettingRow title="Seri Uyarısı" desc="Serin yanmadan 2 saat önce acil uyarı 🔥">
                        <Toggle checked={settings.notifStreak} onChange={(v) => update({ notifStreak: v })} />
                      </SettingRow>
                      <SettingRow title="Lig Gelişmeleri" desc="Sıralaman değişince anlık haber">
                        <Toggle checked={settings.notifLeague} onChange={(v) => update({ notifLeague: v })} />
                      </SettingRow>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-ink">Böyle Görünecek 👀</p>
                    <div className="mt-3 space-y-3">
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border-2 border-line bg-surface p-4 shadow-pop">
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg shadow-[0_3px_0_var(--primary-strong)]">🦜</span>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-extrabold text-ink">parla</p>
                              <p className="text-[10px] font-bold text-mut">{settings.notifTime}</p>
                            </div>
                            <p className="mt-0.5 text-sm font-bold text-ink">Ders vakti! Serin seni bekliyor 🔥</p>
                            <p className="text-xs font-semibold text-mut">Sadece {settings.dailyGoal} dakika ayır, {user.streak} günlük seriyi koru.</p>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border-2 border-accent/30 bg-accentsoft p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-lg text-white shadow-[0_3px_0_color-mix(in_srgb,var(--accent)_55%,black)]">⏰</span>
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-wide text-accent">Acil seri uyarısı</p>
                            <p className="mt-0.5 text-sm font-bold text-ink">Serin 2 saat içinde yanabilir! 😱</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    <Button variant="soft" className="mt-4" onClick={() => toast("Test bildirimi gönderildi 🔔", { desc: `Parla: Ders vakti! Serin seni bekliyor 🔥`, type: "info" })}>
                      Test Bildirimi Gönder
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* ═══════════════════════════ GİZLİLİK ════════════════════════ */}
            {section === "gizlilik" && (
              <Card className="p-7">
                <SectionTitle icon={Eye} title="Gizlilik" desc="Ne kadar görünür olacağını sen belirlersin." color={current.color} />

                <p className="mt-6 text-sm font-extrabold text-ink">Profil Görünürlüğü</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    { id: true, title: "Herkese Açık", desc: "Profilini herkes görebilir, ligde yarışır ve arkadaşlık istekleri alırsın.", emoji: "🌍" },
                    { id: false, title: "Sadece Arkadaşlar", desc: "Yalnızca eklediğin arkadaşlar profilini ve aktivitelerini görür.", emoji: "🔒" },
                  ].map((o) => (
                    <motion.button
                      key={o.title}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        update({ profilePublic: o.id });
                        toast(o.id ? "Profil herkese açık 🌍" : "Profil gizlendi 🔒", { type: "info" });
                      }}
                      className={cn("cursor-pointer rounded-2xl border-2 p-5 text-left transition-all", settings.profilePublic === o.id ? "border-danger/50 bg-dangersoft/50 shadow-[0_4px_0_color-mix(in_srgb,var(--danger)_30%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                    >
                      <span className="text-2xl">{o.emoji}</span>
                      <p className="mt-2 font-display text-base font-semibold text-ink">{o.title}</p>
                      <p className="mt-1 text-xs font-bold leading-relaxed text-mut">{o.desc}</p>
                      {settings.profilePublic === o.id && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-danger px-2 py-1 text-[10px] font-extrabold uppercase text-white">
                          <Check className="size-3" /> Seçili
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6">
                  <SettingRow title="Lig Sıralamasında Görün" desc="Kapatırsan XP toplarsın ama kimse seni tabloda görmez">
                    <Toggle checked={settings.showInLeague} onChange={(v) => update({ showInLeague: v })} />
                  </SettingRow>
                </div>
              </Card>
            )}

            {/* ═══════════════════════ VERİ VE DEPOLAMA ════════════════════ */}
            {section === "veri" && (
              <>
                <Card className="p-7">
                  <SectionTitle icon={Database} title="Veri ve Depolama" desc="Verilerin senindir — indir, taşı ya da sıfırla." color={current.color} />

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: "📚", title: "Çevrimdışı dersler", size: "24 MB", desc: "3 ünite indirildi" },
                      { icon: "🔊", title: "Ses paketleri", size: "11 MB", desc: "İngilizce telaffuz seti" },
                      { icon: "💾", title: "İlerleme verisi", size: "1.2 MB", desc: "Cihazında saklanıyor" },
                    ].map((s, i) => (
                      <motion.div key={s.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl border-2 border-line bg-bg p-4">
                        <span className="text-2xl">{s.icon}</span>
                        <p className="mt-2 text-sm font-extrabold text-ink">{s.title}</p>
                        <p className="text-xs font-bold text-mut">{s.desc}</p>
                        <p className="mt-1.5 font-display text-base font-bold text-azure">{s.size}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-mut">Depolama kullanımı</span>
                      <span className="text-ink">36.2 MB / 500 MB</span>
                    </div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full border border-line/60 bg-raise">
                      <motion.div initial={{ width: 0 }} animate={{ width: "7.2%" }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-[#2dd4bf] to-azure" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" size="lg" onClick={exportData}>
                      <Download className="size-4.5" /> Verilerimi İndir
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => toast("Bulut yedeği alındı ☁️", { desc: "İlerlemen güvende.", type: "info" })}>
                      <HardDrive className="size-4.5" /> Buluta Yedekle
                    </Button>
                    <Button variant="soft" size="lg" href="/settings/downloads">
                      <Download className="size-4.5" /> Çevrimdışı Dersler
                    </Button>
                  </div>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-accent/30 bg-accentsoft/60 p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-3xl">🧹</span>
                    <div>
                      <p className="font-display text-base font-semibold text-ink">Yerel Verileri Sıfırla</p>
                      <p className="mt-0.5 text-xs font-bold text-mut">Cihazdaki elmas, favori ve rekor kayıtlarını temizler. Hesabın silinmez.</p>
                    </div>
                  </div>
                  <Button variant="danger" onClick={() => setResetOpen(true)}>
                    <RotateCcw className="size-4" /> Sıfırla
                  </Button>
                </div>
              </>
            )}

            {/* ═══════════════════════════ HAKKINDA ════════════════════════ */}
            {section === "hakkinda" && (
              <>
                <Card className="relative overflow-hidden p-8 text-center">
                  <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-12 -right-8 size-44 rounded-full bg-gold/10 blur-2xl" />
                  <motion.button animate={{ y: [0, -8, 0] }} transition={{ duration: 2.8, repeat: Infinity }} onClick={pokePiko} className="relative inline-block cursor-pointer" aria-label="Piko'ya dokun">
                    <Mascot mood={pikoClicks >= 3 ? "joy" : "happy"} size={130} />
                  </motion.button>
                  <h2 className="mt-3 font-display text-2xl font-bold text-ink">
                    parla<span className="text-primary">.</span> v3.0
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed text-mut">
                    Dil öğrenmeyi dünyanın en eğlenceli oyunu yapmak için kurulduk. 12 milyon öğrenen, 24 dil ve sayısız konfeti sonrası hâlâ ilk günkü gibi heyecanlıyız. 💚
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                    {["🏆 2026'nın Uygulaması Adayı", "⭐ 4.9 mağaza puanı", "💚 %100 sevgiyle yapıldı"].map((t) => (
                      <span key={t} className="rounded-xl bg-raise px-3.5 py-2 text-xs font-extrabold text-ink">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {[
                      { title: "Gizlilik Politikası", desc: "Verin senindir, nokta." },
                      { title: "Kullanım Şartları", desc: "Kısa, öz, dürüst." },
                      { title: "Destek Merkezi", desc: "Piko 7/24 soruları bekler." },
                    ].map((l) => (
                      <button key={l.title} onClick={() => toast(`${l.title} açıldı 📄`, { desc: l.desc, type: "info" })} className="cursor-pointer rounded-2xl border-2 border-line bg-bg p-4 text-left transition hover:border-primary hover:-translate-y-0.5">
                        <p className="text-sm font-extrabold text-ink">{l.title}</p>
                        <p className="mt-0.5 text-xs font-bold text-mut">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Piko'nun laboratuvarı */}
                <Card className="overflow-hidden p-0">
                  <div className="flex items-center gap-4 bg-gradient-to-r from-violet to-violet/75 p-6">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white/20 text-white">
                      <FlaskConical className="size-6" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white">Piko'nun Laboratuvarı 🧪</h3>
                      <p className="text-xs font-semibold text-white/75">Henüz fırından çıkmamış deneysel özellikler. Bozulabilirler — o yüzden eğlenceliler!</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <SettingRow title="Retro Yeşil Mod" desc="Butonlar 8-bit oyun konsolu hissine bürünür">
                      <Toggle
                        checked={lab.retro}
                        onChange={(v) => {
                          setLab((l) => ({ ...l, retro: v }));
                          toast(v ? "Retro mod açık 👾" : "Retro mod kapalı", { desc: "Biraz piksel, bol nostalji.", type: "info" });
                        }}
                      />
                    </SettingRow>
                    <SettingRow title="Gece Kuşu Rozeti" desc="23:00'ten sonra çalışanlara özel 🦉">
                      <Toggle
                        checked={lab.nightOwl}
                        onChange={(v) => {
                          setLab((l) => ({ ...l, nightOwl: v }));
                          toast(v ? "Gece kuşu modu aktif 🦉" : "Gündüz moduna dönüldü ☀️", { type: "info" });
                        }}
                      />
                    </SettingRow>
                    <SettingRow title="Boss Seslendirme" desc="Kelime Lordu her vuruşta konuşur 🐉">
                      <Toggle
                        checked={lab.bossVoice}
                        onChange={(v) => {
                          setLab((l) => ({ ...l, bossVoice: v }));
                          toast(v ? "Boss mikrofonu açtı 🎤" : "Boss sessize alındı 🤫", { type: "info" });
                        }}
                      />
                    </SettingRow>
                    <p className="rounded-2xl bg-violetsoft p-3.5 text-center text-xs font-bold text-violet">💡 İpucu: Piko'yu yukarıda birkaç kez dürtmeyi dene...</p>
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════ HESAP SİLME MODALI ════════════════════ */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="p-7 text-center">
          <Mascot mood="sad" size={110} className="mx-auto" />
          <h3 className="mt-2 font-display text-xl font-bold text-ink">Emin misin?</h3>
          <p className="mt-2 text-sm font-bold text-mut">
            {user.streak} günlük seri, {user.totalXp.toLocaleString("tr-TR")} XP ve {user.wordsLearned} kelime sonsuza dek silinecek. Piko da çok üzülecek. 😢
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button variant="outline" size="lg" onClick={() => setDeleteOpen(false)}>
              Vazgeçtim, Öğrenmeye Devam 💪
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteOpen(false);
                toast("Hesap silme talebi alındı", { desc: "Bu bir demo — hesabın güvende. 😊", type: "warning" });
              }}
            >
              Evet, Hesabımı Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════ SIFIRLAMA MODALI ══════════════════════ */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)}>
        <div className="p-7 text-center">
          <span className="text-6xl">🧹</span>
          <h3 className="mt-3 font-display text-xl font-bold text-ink">Yerel veriler sıfırlansın mı?</h3>
          <p className="mt-2 text-sm font-bold text-mut">Cihazında saklanan elmaslar, favoriler, rekorlar ve tercihler temizlenecek. Hesabın ve ders ilerlemen güvende kalır.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button variant="outline" size="lg" onClick={() => setResetOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" size="lg" onClick={resetLocal}>
              Evet, Sıfırla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
