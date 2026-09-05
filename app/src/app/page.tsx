"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Flame, Languages, Menu, Sparkles, Trophy, X, Zap } from "lucide-react";

const socialIcons = [
  {
    label: "X",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm6.406-4.318a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    label: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
];
import { Avatar, Badge, Button, Counter, SectionHeading, StarRow } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { features, heroWords, languages, pricing, testimonials } from "@/data/mock";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Diller", href: "#diller" },
  { label: "Yorumlar", href: "#yorumlar" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/10 bg-[#071209]/85 py-2.5 backdrop-blur-xl" : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primarystrong shadow-[0_6px_20px_-6px_rgba(35,194,129,.7)]">
            <Languages className="size-5 text-white" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            parla<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white">
            Giriş Yap
          </Link>
          <Button href="/register" size="md">
            Ücretsiz Başla
          </Button>
        </div>

        <button onClick={() => setOpen(!open)} className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-white md:hidden">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-white/10 bg-[#071209]/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-5 py-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/10">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-bold text-white">
                  Giriş Yap
                </Link>
                <Button href="/register" full className="flex-1">
                  Ücretsiz Başla
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function PhoneMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-[300px] sm:w-[330px]"
    >
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative rounded-[2.6rem] border border-white/15 bg-[#0d1f14] p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,.8)]">
        <div className="rounded-[2rem] bg-[#0b100d] p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: "62%" }} transition={{ delay: 1.2, duration: 1 }} className="h-full rounded-full bg-primary" />
            </div>
            <span className="flex items-center gap-1 text-xs font-extrabold text-accent">
              <Flame className="size-3.5" /> 23
            </span>
          </div>

          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-widest text-primary">Kelime Seç</p>
          <p className="mt-1.5 font-display text-xl font-extrabold text-white">
            “apple” ne demek? <span className="align-middle text-2xl">🍎</span>
          </p>

          <div className="mt-5 space-y-2.5">
            {["elma", "armut", "üzüm", "şeftali"].map((o, i) => (
              <motion.div
                key={o}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.15 }}
                className={cn(
                  "rounded-2xl border-2 px-4 py-3 text-sm font-bold",
                  i === 0 ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-white/75"
                )}
              >
                {o}
                {i === 0 && <span className="float-right">✓</span>}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} className="mt-5 rounded-2xl bg-primary px-4 py-3.5 text-center text-sm font-extrabold text-primaryink">
            Devam Et
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, type: "spring", stiffness: 220, damping: 16 }}
        className="absolute -right-9 -top-12 hidden md:block"
      >
        <motion.div animate={{ rotate: [0, 4, -3, 0], y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <Mascot mood="wave" size={108} className="drop-shadow-2xl" />
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.1, type: "spring", stiffness: 260, damping: 18 }}
        className="absolute -left-10 top-14 hidden rounded-2xl border border-gold/30 bg-[#141b12] px-3.5 py-2.5 shadow-xl sm:block"
      >
        <motion.p animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.4 }} className="text-sm font-extrabold text-gold">
          +40 XP ⚡
        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.35, type: "spring", stiffness: 260, damping: 18 }}
        className="absolute -right-8 bottom-24 hidden rounded-2xl border border-primary/30 bg-[#141b12] px-3.5 py-2.5 shadow-xl sm:block"
      >
        <motion.p animate={{ y: [0, -6, 0] }} transition={{ duration: 3.4, repeat: Infinity }} className="flex items-center gap-1.5 text-sm font-extrabold text-primary">
          <Trophy className="size-4" /> Altın Lig
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#071209] pb-24 pt-36">
      <div className="hero-glow absolute inset-0" />
      <div className="dot-grid absolute inset-0 opacity-[0.12]" style={{ filter: "invert(1)" }} />

      {heroWords.map((w) => (
        <motion.span
          key={w.text}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + w.delay, duration: 0.8 }}
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{ left: w.x, top: w.y }}
        >
          <motion.span
            animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 6 + w.delay * 2, repeat: Infinity, ease: "easeInOut", delay: w.delay }}
            className="inline-block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 font-display text-sm font-bold text-white/80 backdrop-blur"
          >
            {w.text}
            <span className="ml-2 rounded-md bg-primary/25 px-1.5 py-0.5 text-[10px] font-extrabold text-primary">{w.lang}</span>
          </motion.span>
        </motion.span>
      ))}

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2">
        <div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gold">
              <Sparkles className="size-3.5" /> 2026'nın En İyi Uygulaması Adayı
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]"
          >
            Yeni bir dili,
            <br />
            <span className="text-gradient-jade">âşık olacağın</span>
            <br />
            kadar güzel öğren.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-white/60">
            AI öğretmenin, boss savaşları ve bilim destekli tekrar sistemiyle Parla, dil öğrenmeyi dünyanın en eğlenceli oyununa dönüştürüyor. Günde 10 dakika yeter.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="mt-9 flex flex-wrap items-center gap-3.5">
            <Button href="/register" size="xl">
              Ücretsiz Başla <ArrowRight className="size-5" />
            </Button>
            <Button href="/dashboard" size="xl" className="border-2 border-white/20 bg-white/5 text-white shadow-none hover:bg-white/10 active:border-b-2">
              Canlı Demoyu Gör
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {testimonials.slice(0, 4).map((t) => (
                <Avatar key={t.name} name={t.name} hue={t.hue} size={36} className="ring-[2.5px] ring-[#071209]" />
              ))}
            </div>
            <div>
              <StarRow count={5} size={14} />
              <p className="mt-1 text-xs font-bold text-white/55">4.9/5 — 128.000+ değerlendirme</p>
            </div>
          </motion.div>
        </div>

        <PhoneMock />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="relative mt-16 flex justify-center">
        <a href="#istatistikler" className="flex flex-col items-center gap-1 text-white/40 transition hover:text-white/70">
          <span className="text-xs font-bold">Keşfet</span>
          <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ChevronDown className="size-5" />
          </motion.span>
        </a>
      </motion.div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: 12.4, suffix: "M", decimals: 1, label: "Aktif öğrenen", icon: "🌍" },
    { value: 24, suffix: "", decimals: 0, label: "Dil kursu", icon: "🗣️" },
    { value: 1.2, suffix: "B", decimals: 1, label: "Tamamlanan ders", icon: "📚" },
    { value: 4.9, suffix: "", decimals: 1, label: "Mağaza puanı", icon: "⭐" },
  ];
  return (
    <section id="istatistikler" className="relative z-10 -mt-10 px-5">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 rounded-[2rem] border border-line bg-surface p-6 shadow-pop sm:p-9 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="text-center"
          >
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              <Counter to={s.value} decimals={s.decimals} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm font-bold text-mut">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="ozellikler" className="px-5 py-28">
      <SectionHeading
        eyebrow="Neden Parla?"
        title="Beynin oyun oynadığını sanacak, sen dil öğreneceksin"
        desc="Her özellik, nörobilim araştırmaları ve 3 yıllık kullanıcı verisiyle ince ince işlendi."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 3) * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="group h-full rounded-3xl border border-line bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-pop">
              <span className="inline-flex size-13 items-center justify-center rounded-2xl bg-primarysoft text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {f.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-extrabold text-ink">{f.title}</h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-mut">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LanguageMarquee() {
  const Row = ({ reverse }: { reverse?: boolean }) => (
    <div className={cn("flex w-max gap-4", reverse ? "animate-marquee-rev" : "animate-marquee")}>
      {[...languages, ...languages].map((l, i) => (
        <div key={`${l.code}-${i}`} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-6 py-4 shadow-card transition-colors hover:border-primary/40">
          <span className="text-3xl">{l.flag}</span>
          <div>
            <p className="font-display text-sm font-extrabold text-ink">{l.name}</p>
            <p className="text-xs font-bold text-mut">{l.learners} öğreniyor</p>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <section id="diller" className="overflow-hidden py-24">
      <SectionHeading
        eyebrow="24 Dil, Tek Tutku"
        title="Bugün hangi dilin kapısını aralıyorsun?"
        desc="İngilizceden Japoncaya, her kurs anadili seviyesinde içerik ekibi tarafından hazırlanıyor."
      />
      <div className="mt-14 space-y-4">
        <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <Row />
        </div>
        <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <Row reverse />
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="yorumlar" className="px-5 py-24">
      <SectionHeading eyebrow="12 Milyon Hikâye" title="Öğrenenler ne diyor?" />
      <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (i % 3) * 0.12, duration: 0.6 }}
            className={cn("rounded-3xl border border-line bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop", i >= 3 && "lg:col-span-3 lg:mx-auto lg:w-2/3")}
          >
            <StarRow count={t.stars} />
            <blockquote className="mt-4 text-[15px] font-medium leading-relaxed text-ink">“{t.text}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar name={t.name} hue={t.hue} size={42} />
              <div>
                <p className="text-sm font-extrabold text-ink">{t.name}</p>
                <p className="text-xs font-bold text-mut">{t.country}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="fiyatlandirma" className="px-5 py-24">
      <SectionHeading eyebrow="Fiyatlandırma" title="Ücretsiz başla, istersen uçuşa geç" desc="Kredi kartı yok, tuzak yok. İstediğin an iptal et." />
      <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
        {pricing.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.13, duration: 0.6 }}
            className={cn(
              "relative flex h-full flex-col rounded-[2rem] border p-8",
              p.popular ? "border-primary bg-surface shadow-pop ring-4 ring-primary/15 lg:-translate-y-4 lg:scale-[1.03]" : "border-line bg-surface shadow-card"
            )}
          >
            {p.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-primaryink shadow-lg">
                ⭐ En Popüler
              </span>
            )}
            <h3 className="font-display text-lg font-extrabold text-ink">{p.name}</h3>
            <p className="mt-1 text-sm font-medium text-mut">{p.desc}</p>
            <p className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink">
              {p.price}
              <span className="ml-1.5 text-sm font-bold text-mut">/ {p.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-semibold text-ink">
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", p.popular ? "bg-primary text-primaryink" : "bg-raise text-mut")}>
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button href="/register" variant={p.popular ? "primary" : "outline"} size="lg" full className="mt-8">
              {p.price === "0₺" ? "Hemen Başla" : `${p.name} Seç`}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-28 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#071209] px-6 py-20 text-center shadow-pop"
      >
        <div className="hero-glow absolute inset-0" />
        {["🔥", "⚡", "🏆", "💎", "🚀"].map((e, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -18, 0], rotate: [0, i % 2 ? 10 : -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            className="absolute hidden text-3xl sm:block"
            style={{ left: `${10 + i * 20}%`, top: i % 2 ? "70%" : "14%" }}
          >
            {e}
          </motion.span>
        ))}
        <div className="relative">
          <Zap className="mx-auto size-9 text-gold" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            İlk dersin <span className="text-gradient-jade">3 dakika</span> sürecek.
            <br />
            Sonrası bağımlılık.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base font-medium text-white/60">12 milyon kişi şu an seri yapıyor. Aralarına katıl, ilk gün ücretsiz.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <Button href="/register" size="xl">
              Hemen Başla — Ücretsiz <ArrowRight className="size-5" />
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/45">
            <Badge tone="gold" className="normal-case">Kredi kartı gerekmez</Badge>
            <Badge tone="primary" className="normal-case">İstediğin an iptal</Badge>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Ürün", links: ["Özellikler", "Fiyatlandırma", "Kurumsal", "Okullar için"] },
    { title: "Kaynaklar", links: ["Blog", "Kelime Testi", "CEFR Rehberi", "Yardım Merkezi"] },
    { title: "Şirket", links: ["Hakkımızda", "Kariyer", "Basın Kiti", "İletişim"] },
  ];
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primarystrong">
              <Languages className="size-5 text-white" />
            </span>
            <span className="font-display text-xl font-extrabold text-ink">
              parla<span className="text-primary">.</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-mut">Dünyanın en güzel dil öğrenme deneyimi. Her gün 10 dakika, ömür boyu süper güç.</p>
          <div className="mt-5 flex gap-2.5">
            {socialIcons.map((s) => (
              <a key={s.label} href="#" aria-label={s.label} className="flex size-9 items-center justify-center rounded-xl border border-line text-mut transition hover:border-primary hover:text-primary">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="font-display text-sm font-extrabold text-ink">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm font-semibold text-mut transition hover:text-primary">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-6 text-center text-xs font-bold text-mut">© 2026 Parla Labs. Tüm hakları saklıdır. Sevgiyle ve çok fazla kahveyle yapıldı ☕</div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <LanguageMarquee />
      <Testimonials />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}
