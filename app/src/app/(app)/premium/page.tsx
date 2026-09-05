"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Crown,
  Download,
  Heart,
  Infinity as InfinityIcon,
  Lock,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Avatar, Badge, Button, Card, Modal, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { useApp } from "@/stores/app";
import { cn, fireConfetti } from "@/lib/utils";

type PlanId = "aylik" | "yillik" | "aile";

const plans: { id: PlanId; name: string; emoji: string; price: string; per: string; monthlyEq?: string; save?: string; desc: string; popular?: boolean; tag?: string }[] = [
  { id: "aylik", name: "Süper Aylık", emoji: "⚡", price: "129₺", per: "/ay", desc: "Esnek başlangıç — istediğin an iptal et.", tag: "Aylık" },
  { id: "yillik", name: "Süper Yıllık", emoji: "👑", price: "899₺", per: "/yıl", monthlyEq: "aylık 75₺'ye denk", save: "%42 tasarruf", desc: "Ciddi öğrenenlerin tercihi. En popüler plan.", popular: true, tag: "Yıllık" },
  { id: "aile", name: "Süper Aile", emoji: "👨‍👩‍👧‍👦", price: "1.899₺", per: "/yıl", monthlyEq: "kişi başı 26₺", save: "6 kişiye kadar", desc: "Tüm aile tek hesapta, herkes kendi ilerlemesinde.", tag: "Aile" },
];

const perks = [
  { icon: Heart, title: "Sınırsız Can", desc: "Hata yapmaktan korkmadan öğren. Canlar asla bitmez.", color: "#ff4b4b" },
  { icon: Brain, title: "Kişisel Çalışma Planı", desc: "Yapay zekâ her gün sana özel 10 dakikalık rota çizer.", color: "#9b5cff" },
  { icon: ShieldCheck, title: "Otomatik Seri Kalkanı", desc: "Bir gün kaçırınca serin kendiliğinden korunur.", color: "#1cb0f6" },
  { icon: Zap, title: "Hafta Sonu 2x XP", desc: "Cumartesi-Pazar her ders ve oyundan iki kat XP.", color: "#ffc800" },
  { icon: BookOpen, title: "Tüm Hikâye Arşivi", desc: "Kilitli bölümler dahil, 40+ sinematik hikâye.", color: "#ff9600" },
  { icon: Download, title: "Çevrimdışı Dersler", desc: "Uçakta, metroda, dağ başında. İndir ve çalış.", color: "#58cc02" },
  { icon: Sparkles, title: "Özel Rozetler & Taç", desc: "Profilinde altın taç, isminin yanında parlayan rozet.", color: "#f43f5e" },
  { icon: MessageCircle, title: "Öncelikli Destek", desc: "Piko ve ekibi Süper üyelere 1 saat içinde döner.", color: "#2dd4bf" },
];

const compare = [
  { label: "Günlük can", free: "5 can", super_: "Sınırsız ∞" },
  { label: "Seri kalkanı", free: "Mağazadan alınır", super_: "Otomatik, ücretsiz" },
  { label: "Kişisel çalışma planı", free: null, super_: "Her gün yenilenir" },
  { label: "Hafta sonu 2x XP", free: null, super_: "Her hafta sonu" },
  { label: "Hikâye arşivi", free: "İlk bölüm ücretsiz", super_: "40+ bölümün tamamı" },
  { label: "Çevrimdışı dersler", free: null, super_: "Sınırsız indirme" },
  { label: "Profil tacı & rozetler", free: null, super_: "Altın taç + özel rozet" },
  { label: "Destek hızı", free: "48 saat", super_: "1 saat öncelikli" },
];

const superTestimonials = [
  { name: "Deren K.", hue: 120, text: "Sınırsız can sayesinde konuşma sorularında hata yapmaktan korkmayı bıraktım. 94 gündür İspanyolca çalışıyorum, tek bir gün bile 'canım bitti' demedim.", plan: "Yıllık plan" },
  { name: "Emir T.", hue: 210, text: "Kişisel çalışma planı olayı gerçek. Sabah 07:15'te otobüste açınca 'bugünün rotası hazır' diyor. Beyin jimnastiği kahvaltıdan kolay artık.", plan: "Aylık plan" },
  { name: "Asya & Ailesi", hue: 330, text: "Aile planını aldık; ben Almanca, eşim İngilizce, çocuklar İtalyanca öğreniyor. Akşam yemeğinde kim daha çok XP topladı yarışı yapıyoruz 😄", plan: "Aile planı" },
];

const faqs = [
  { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet! Tek dokunuşla iptal edilir, dönem sonuna kadar Süper ayrıcalıkların devam eder. Sözleşme, taahhüt, gizli madde yok." },
  { q: "Ödeme yöntemleri neler?", a: "Kredi/banka kartı, Apple Pay ve Google Play faturalandırması desteklenir. Bu demoda ödeme simüle edilir — kart bilgisi girsen de hiçbir şey çekilmez. 😊" },
  { q: "Aile planı nasıl çalışır?", a: "Tek ödeme, 6 ayrı profil. Herkes kendi dilinde, kendi serisinde ilerler; ilerlemeler asla birbirine karışmaz." },
  { q: "Ücretsiz plana geri dönebilir miyim?", a: "Tabii. İptal sonrası hesabın, serin ve kelimelerin aynen korunur. Sadece Süper ayrıcalıkları pasifleşir." },
  { q: "Süper gerçekten işe yarıyor mu?", a: "Verilerimize göre Süper üyeler 3.2 kat daha uzun seri yapıyor ve %64 daha hızlı seviye atlıyor. Sınırsız can + kişisel plan birleşince ivme kaçınılmaz. 🚀" },
];

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export default function PremiumPage() {
  const { wallet, activateSuper } = useApp();
  const { toast } = useToast();
  const [cycle, setCycle] = useState<"aylik" | "yillik">("yillik");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [plan, setPlan] = useState<PlanId>("yillik");
  const [payStep, setPayStep] = useState<"form" | "processing" | "success">("form");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const selected = plans.find((p) => p.id === plan) ?? plans[1];

  const openCheckout = (id: PlanId) => {
    if (wallet.isSuper) {
      toast("Zaten Süper üyesin 👑", { desc: "Plan değişikliği yakında!", type: "info" });
      return;
    }
    setPlan(id);
    setPayStep("form");
    setCard({ number: "", name: "", expiry: "", cvc: "" });
    setErrors({});
    setCheckoutOpen(true);
  };

  const pay = () => {
    const e: Record<string, string> = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "16 haneli kart numarası gir";
    if (card.name.trim().length < 3) e.name = "Kart üzerindeki ismi yaz";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = "AA/YY formatında olmalı";
    if (card.cvc.length < 3) e.cvc = "3 haneli CVC gir";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setPayStep("processing");
    setTimeout(() => {
      activateSuper();
      setPayStep("success");
      fireConfetti(true);
      toast("Süper üyeliğin aktif! 👑", { desc: "Sınırsız can ve tüm ayrıcalıklar senin." });
    }, 1800);
  };

  const crownFloat = useMemo(() => ["👑", "💎", "⚡", "🔥", "✨"], []);

  return (
    <div className="mx-auto max-w-5xl">
      {/* ═══════════════════════════ HERO ══════════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[2.5rem] border-2 border-gold/40 bg-gradient-to-br from-[#241a02] via-[#33270a] to-[#1c1404] p-8 shadow-pop sm:p-12">
        <div className="dot-grid absolute inset-0 opacity-10" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 300px at 25% 0%, rgba(255,200,0,.22), transparent), radial-gradient(480px 260px at 85% 100%, rgba(255,150,0,.16), transparent)" }} />
        {crownFloat.map((e, i) => (
          <motion.span key={i} animate={{ y: [0, -16, 0], rotate: [0, i % 2 ? 10 : -10, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }} className="pointer-events-none absolute hidden text-3xl opacity-60 sm:block" style={{ left: `${8 + i * 21}%`, top: i % 2 ? "68%" : "12%" }}>
            {e}
          </motion.span>
        ))}

        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-gold">
              <Crown className="size-3.5" /> Parla Süper
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Öğrenmenin <span className="text-gradient-jade">süper gücünü</span> aç.
            </h1>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed text-white/65">
              Sınırsız can, kişisel çalışma planı, otomatik seri kalkanı ve daha fazlası. Süper üyeler <span className="font-extrabold text-gold">3.2 kat daha uzun seri</span> yapıyor.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {["Sınırsız can ❤️", "Kişisel plan 🧠", "Seri kalkanı 🛡️", "2x XP ⚡"].map((t) => (
                <span key={t} className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-extrabold text-white backdrop-blur">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="relative hidden md:block">
            <motion.span animate={{ rotate: [0, 6, -4, 0] }} transition={{ duration: 3.4, repeat: Infinity }} className="absolute -top-9 left-1/2 z-10 -translate-x-1/2">
              <Crown className="size-12 fill-gold text-gold drop-shadow-[0_6px_16px_rgba(255,200,0,.6)]" />
            </motion.span>
            <Mascot mood="joy" size={180} className="drop-shadow-2xl" />
          </motion.div>
        </div>

        {wallet.isSuper && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-gold/50 bg-gold/15 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <span className="flex size-13 items-center justify-center rounded-2xl bg-gold text-2xl shadow-[0_4px_0_color-mix(in_srgb,var(--gold)_55%,black)]">👑</span>
              <div>
                <p className="font-display text-lg font-semibold text-white">Süper üyeliğin aktif!</p>
                <p className="text-xs font-bold text-white/70">Yıllık plan · sonraki yenileme: 14 Aralık 2026</p>
              </div>
            </div>
            <Button variant="gold" onClick={() => toast("Üyelik yönetimi 📋", { desc: "Plan detayların yakında burada olacak.", type: "info" })}>
              Üyeliği Yönet
            </Button>
          </motion.div>
        )}
      </motion.section>

      {/* ═══════════════════════════ PLANLAR ═══════════════════════════════ */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">Planını seç 👇</h2>
          <div className="flex items-center gap-1 rounded-2xl border-2 border-line bg-surface p-1 shadow-[0_3px_0_var(--line)]">
            {(["aylik", "yillik"] as const).map((c) => (
              <button key={c} onClick={() => setCycle(c)} className={cn("relative cursor-pointer rounded-xl px-5 py-2.5 font-display text-sm font-semibold transition-all", cycle === c ? "bg-primary text-primaryink shadow-[0_3px_0_var(--primary-strong)]" : "text-mut hover:text-ink")}>
                {c === "aylik" ? "Aylık" : "Yıllık"}
                {c === "yillik" && <span className={cn("ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold", cycle === c ? "bg-white/25 text-primaryink" : "bg-primarysoft text-primarystrong")}>-42%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans
            .filter((p) => (cycle === "aylik" ? p.id !== "yillik" : p.id !== "aylik"))
            .map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className={cn("relative flex flex-col rounded-[2rem] border-2 bg-surface p-7", p.popular ? "border-gold shadow-[0_8px_0_color-mix(in_srgb,var(--gold)_45%,transparent)] lg:scale-[1.03]" : "border-line shadow-card")}
              >
                {p.popular && (
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#4a3800] shadow-lg">
                    <Star className="size-3.5 fill-current" /> En Popüler
                  </motion.span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{p.emoji}</span>
                  <Badge tone={p.popular ? "gold" : "mut"}>{p.tag}</Badge>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold text-mut">{p.desc}</p>
                <p className="mt-5 font-display text-4xl font-bold text-ink">
                  {p.price}
                  <span className="text-base font-semibold text-mut">{p.per}</span>
                </p>
                {p.monthlyEq && <p className="mt-1 text-xs font-extrabold text-primarystrong">{p.monthlyEq}</p>}
                {p.save && <Badge tone="primary" className="mt-2 self-start normal-case tracking-normal">{p.save}</Badge>}
                <ul className="mt-5 flex-1 space-y-2.5">
                  {(p.id === "aile" ? ["6 profil, tek ödeme", "Her üyeye özel ilerleme", ...perks.slice(0, 4).map((x) => x.title)] : perks.slice(0, 5).map((x) => x.title)).slice(0, 6).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm font-bold text-ink">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primarysoft text-primarystrong">
                        <Check className="size-3" strokeWidth={3.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button size="lg" full variant={p.popular ? "gold" : "outline"} className="mt-6" onClick={() => openCheckout(p.id)}>
                  {wallet.isSuper ? "Mevcut Planın 👑" : p.popular ? "Süper'e Geç 👑" : "Bu Planı Seç"}
                </Button>
              </motion.div>
            ))}
        </div>
        <p className="mt-4 text-center text-xs font-bold text-mut">7 gün ücretsiz deneme · İstediğin an iptal · Gizli ücret yok 💚</p>
      </motion.section>

      {/* ═══════════════════════════ NELER DAHİL ═══════════════════════════ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold text-ink">Süper ile gelen 8 süper güç 💪</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.08, duration: 0.5 }} whileHover={{ y: -5 }} className="rounded-3xl border-2 border-line bg-surface p-5 shadow-card">
              <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${p.color} 16%, var(--surface))`, color: p.color, border: `2px solid color-mix(in srgb, ${p.color} 40%, transparent)` }}>
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-3.5 font-display text-base font-semibold text-ink">{p.title}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-mut">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ KARŞILAŞTIRMA ═════════════════════════ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold text-ink">Ücretsiz vs Süper ⚖️</h2>
        <div className="mt-6 overflow-hidden rounded-[2rem] border-2 border-line bg-surface shadow-card">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b-2 border-line bg-raise/60 px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-mut">
            <span>Özellik</span>
            <span className="text-center">Ücretsiz</span>
            <span className="flex items-center justify-center gap-1.5 text-center text-gold">
              <Crown className="size-4 fill-current" /> Süper
            </span>
          </div>
          {compare.map((row, i) => (
            <motion.div key={row.label} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b-2 border-line/60 px-5 py-3.5 last:border-0">
              <p className="text-sm font-extrabold text-ink">{row.label}</p>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-mut">
                {row.free ? row.free : <X className="size-4 text-linestrong" />}
              </p>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs font-extrabold text-primarystrong">
                <Check className="size-4 shrink-0" /> {row.super_}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ YORUMLAR ══════════════════════════════ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold text-ink">Süper üyeler ne diyor? 💬</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {superTestimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col rounded-3xl border-2 border-line bg-surface p-6 shadow-card">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-ink">“{t.text}”</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={t.name} hue={t.hue} size={40} />
                <div>
                  <p className="text-sm font-extrabold text-ink">{t.name}</p>
                  <p className="text-[11px] font-bold text-gold">👑 {t.plan}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ SSS ═══════════════════════════════════ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold text-ink">Merak edilenler 🤔</h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className={cn("overflow-hidden rounded-2xl border-2 transition-colors", openFaq === i ? "border-gold/50 bg-goldsoft/40" : "border-line bg-surface")}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left">
                <span className="font-display text-[15px] font-semibold text-ink">{f.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }}>
                  <ChevronDown className="size-5 shrink-0 text-mut" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="px-5 pb-5 text-sm font-semibold leading-relaxed text-mut">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ ALT CTA ═══════════════════════════════ */}
      {!wallet.isSuper && (
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14">
          <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-gold/40 bg-gradient-to-br from-[#241a02] to-[#33270a] p-10 text-center shadow-pop">
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(500px 220px at 50% 0%, rgba(255,200,0,.2), transparent)" }} />
            <div className="relative">
              <Crown className="mx-auto size-12 fill-gold text-gold drop-shadow-[0_6px_16px_rgba(255,200,0,.5)]" />
              <h2 className="mt-4 font-display text-3xl font-bold text-white">İlk 7 gün ücretsiz.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-white/60">Beğenmezsen tek dokunuşla iptal et. Ama kimse iptal etmiyor — sayılar ortada. 😉</p>
              <Button variant="gold" size="xl" className="mt-7" onClick={() => openCheckout("yillik")}>
                Süper'i Ücretsiz Dene <Sparkles className="size-5" />
              </Button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ═══════════════════════════ ÖDEME MODALI ══════════════════════════ */}
      <Modal open={checkoutOpen} onClose={() => payStep !== "processing" && setCheckoutOpen(false)} className="max-w-md">
        {payStep === "success" ? (
          <div className="bg-gradient-to-b from-goldsoft to-surface p-8 text-center">
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="relative mx-auto inline-block">
              <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-8 left-1/2 z-10 -translate-x-1/2">
                <Crown className="size-10 fill-gold text-gold" />
              </motion.span>
              <Mascot mood="joy" size={120} />
            </motion.div>
            <h3 className="mt-3 font-display text-2xl font-bold text-ink">Hoş geldin, Süper! 👑</h3>
            <p className="mt-2 text-sm font-semibold text-mut">{selected.name} planın aktif oldu. İşte açılan süper güçlerin:</p>
            <div className="mt-5 space-y-2 text-left">
              {["Sınırsız can — artık hata korkusu yok ❤️", "Seri kalkanı otomatik devrede 🛡️", "Tüm hikâye arşivi açıldı 📚", "Profiline altın taç eklendi 👑"].map((f, i) => (
                <motion.div key={f} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-sm font-bold text-ink shadow-card">
                  <Check className="size-4.5 shrink-0 text-primary" strokeWidth={3} />
                  {f}
                </motion.div>
              ))}
            </div>
            <Button size="lg" full className="mt-6" onClick={() => setCheckoutOpen(false)}>
              <PartyPopper className="size-5" /> Süper'i Keşfet
            </Button>
          </div>
        ) : payStep === "processing" ? (
          <div className="flex flex-col items-center p-12 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="flex size-16 items-center justify-center rounded-full border-4 border-gold/30 border-t-gold">
              <Crown className="size-7 fill-gold text-gold" />
            </motion.div>
            <h3 className="mt-5 font-display text-xl font-bold text-ink">Ödeme işleniyor...</h3>
            <p className="mt-1.5 text-sm font-semibold text-mut">Taç hazırlanıyor, canlar sonsuza ayarlanıyor 👑</p>
          </div>
        ) : (
          <div>
            <div className="relative overflow-hidden bg-gradient-to-r from-gold to-accent p-6">
              <div className="dot-grid absolute inset-0 opacity-20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">Güvenli Ödeme 🔒</p>
                  <h3 className="font-display text-xl font-bold text-white">{selected.name}</h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-white">{selected.price}</p>
                  <p className="text-[11px] font-bold text-white/80">{selected.per} · 7 gün ücretsiz deneme</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-[13px] font-bold text-ink">Kart Numarası</label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-mut" />
                  <input
                    value={card.number}
                    onChange={(e) => {
                      setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }));
                      setErrors((x) => ({ ...x, number: "" }));
                    }}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    className={cn("h-12 w-full rounded-xl border-2 bg-surface pl-11 pr-4 font-display text-[15px] font-semibold tracking-wider text-ink outline-none transition focus:border-gold focus:shadow-[0_0_0_4px_var(--gold-soft)]", errors.number ? "border-danger" : "border-line")}
                  />
                </div>
                {errors.number && <p className="mt-1 text-xs font-bold text-danger">{errors.number}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-bold text-ink">Kart Üzerindeki İsim</label>
                <input
                  value={card.name}
                  onChange={(e) => {
                    setCard((c) => ({ ...c, name: e.target.value }));
                    setErrors((x) => ({ ...x, name: "" }));
                  }}
                  placeholder="AHMET YILMAZ"
                  className={cn("h-12 w-full rounded-xl border-2 bg-surface px-4 text-[15px] font-semibold uppercase text-ink outline-none transition focus:border-gold focus:shadow-[0_0_0_4px_var(--gold-soft)]", errors.name ? "border-danger" : "border-line")}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-danger">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-ink">Son Kullanma</label>
                  <input
                    value={card.expiry}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCard((c) => ({ ...c, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }));
                      setErrors((x) => ({ ...x, expiry: "" }));
                    }}
                    placeholder="AA/YY"
                    inputMode="numeric"
                    className={cn("h-12 w-full rounded-xl border-2 bg-surface px-4 font-display text-[15px] font-semibold text-ink outline-none transition focus:border-gold focus:shadow-[0_0_0_4px_var(--gold-soft)]", errors.expiry ? "border-danger" : "border-line")}
                  />
                  {errors.expiry && <p className="mt-1 text-xs font-bold text-danger">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-ink">CVC</label>
                  <input
                    value={card.cvc}
                    onChange={(e) => {
                      setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) }));
                      setErrors((x) => ({ ...x, cvc: "" }));
                    }}
                    placeholder="123"
                    inputMode="numeric"
                    className={cn("h-12 w-full rounded-xl border-2 bg-surface px-4 font-display text-[15px] font-semibold text-ink outline-none transition focus:border-gold focus:shadow-[0_0_0_4px_var(--gold-soft)]", errors.cvc ? "border-danger" : "border-line")}
                  />
                  {errors.cvc && <p className="mt-1 text-xs font-bold text-danger">{errors.cvc}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-azuresoft p-3.5">
                <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-azure" />
                <p className="text-xs font-semibold leading-relaxed text-ink/80">
                  <span className="font-extrabold">Demo modu:</span> Gerçek ödeme alınmaz, kart bilgisi hiçbir yere gönderilmez. İstersen rastgele rakamlarla dene!
                </p>
              </div>

              <Button variant="gold" size="lg" full onClick={pay}>
                <Lock className="size-4.5" /> Ödemeyi Tamamla — {selected.price}
              </Button>
              <p className="text-center text-[11px] font-bold text-mut">İstediğin zaman iptal · 7 gün ücretsiz deneme · Gizli ücret yok</p>
            </div>
          </div>
        )}
      </Modal>

      {/* destek çipleri */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 pb-2 text-xs font-bold text-mut">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-primary" /> 7 gün ücretsiz deneme
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4 text-azure" /> 2.1M Süper üye
        </span>
        <span className="flex items-center gap-1.5">
          <InfinityIcon className="size-4 text-accent" /> Sınırsız can garantisi
        </span>
      </div>
    </div>
  );
}
