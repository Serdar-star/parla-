"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, AtSign, Check, KeyRound, Mail, PartyPopper, User } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { languages } from "@/data/mock";
import { Mascot } from "@/components/mascot";
import { postJson, putJson } from "@/lib/api";
import { cn, fireConfetti } from "@/lib/utils";

const reasons = [
  { emoji: "✈️", title: "Seyahat", desc: "Gittiğim her yerde rahatça anlaşmak" },
  { emoji: "💼", title: "Kariyer", desc: "İş fırsatlarımı ikiye katlamak" },
  { emoji: "🎓", title: "Eğitim", desc: "Sınavlar ve akademik hedefler" },
  { emoji: "👨‍👩‍👧", title: "Aile", desc: "Sevdiklerimle aynı dili konuşmak" },
  { emoji: "🍿", title: "Eğlence", desc: "Dizileri altyazısız izlemek" },
  { emoji: "🧠", title: "Beyin jimnastiği", desc: "Zihnimi formda tutmak" },
];

const levels = [
  { emoji: "🌱", title: "Yeni Başlayan", desc: "Hiç bilmiyorum, alfabelerden başlayalım" },
  { emoji: "🌿", title: "Biraz Biliyorum", desc: "Birkaç kelime ve temel kalıplar var" },
  { emoji: "🌳", title: "Orta Seviye", desc: "Konuşabiliyorum ama pratiğe ihtiyacım var" },
  { emoji: "🏔️", title: "İleri Seviye", desc: "Akıcılığımı mükemmelleştirmek istiyorum" },
];

const goals = [
  { min: 5, emoji: "🐢", title: "Rahat", desc: "Günde 5 dk" },
  { min: 10, emoji: "🚶", title: "Dengeli", desc: "Günde 10 dk" },
  { min: 15, emoji: "🏃", title: "Ciddi", desc: "Günde 15 dk" },
  { min: 30, emoji: "🚀", title: "Yoğun", desc: "Günde 30 dk" },
];

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-ZĞÜŞİÖÇ]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9ğüşıöçĞÜŞİÖÇ]/.test(pw)) s++;
  return s;
}

const strengthMeta = [
  { label: "Çok zayıf", color: "bg-danger" },
  { label: "Zayıf", color: "bg-danger" },
  { label: "Orta", color: "bg-gold" },
  { label: "İyi", color: "bg-gold" },
  { label: "Mükemmel", color: "bg-primary" },
];

const slide = {
  initial: { opacity: 0, x: 56 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -56 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(-1); // -1 form, 0..4 onboarding

  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => strengthOf(form.password), [form.password]);

  const [langs, setLangs] = useState<string[]>(["en"]);
  const [reason, setReason] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 3) e.fullName = "Adını ve soyadını yazmalısın";
    if (form.username.trim().length < 3) e.username = "Kullanıcı adı en az 3 karakter olmalı";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Geçerli bir e-posta adresi gir";
    if (strength < 2) e.password = "Şifre en az 6 karakter olmalı, büyük harf ve rakam önerilir";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      await postJson("/api/auth/register", form);
      toast("Hesabın oluşturuldu! 🎉", { desc: "Şimdi seni tanıyalım." });
      setStep(0);
    } catch (err) {
      toast("Kayıt başarısız", { desc: err instanceof Error ? err.message : "Bilinmeyen hata", type: "error" });
      setLoading(false);
    }
  };

  const canNext = step === 0 ? langs.length > 0 : step === 1 ? reason !== null : step === 2 ? level !== null : step === 3 ? goal !== null : true;

  const next = async () => {
    if (step === 4) {
      fireConfetti(true);
      if (goal !== null) {
        await putJson("/api/profile", { dailyGoal: goal }).catch(() => undefined);
      }
      router.push("/dashboard");
      return;
    }
    if (step === 3) fireConfetti();
    setStep((s) => s + 1);
  };

  if (step >= 0) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-surface text-mut shadow-[0_3px_0_var(--line)] transition hover:text-ink"
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="h-3.5 flex-1 overflow-hidden rounded-full border border-line/60 bg-raise">
              <motion.div animate={{ width: `${((step + 1) / 5) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-gradient-to-r from-primary to-primarystrong" />
            </div>
            <span className="w-12 text-right text-sm font-extrabold text-mut">{step + 1}/5</span>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" {...slide} className="mt-10">
                  <h1 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Hangi dilleri öğrenmek istiyorsun? 🌍</h1>
                  <p className="mt-2 text-center text-sm font-semibold text-mut">Birden fazla seçebilirsin, sonra sırayla ilerleriz.</p>
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {languages.slice(0, 9).map((l) => {
                      const active = langs.includes(l.code);
                      return (
                        <motion.button
                          key={l.code}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setLangs((p) => (active ? p.filter((c) => c !== l.code) : [...p, l.code]))}
                          className={cn(
                            "relative cursor-pointer rounded-2xl border-2 p-4 text-left transition-all duration-200",
                            active ? "border-primary bg-primarysoft shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong"
                          )}
                        >
                          {active && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2.5 top-2.5 flex size-5.5 items-center justify-center rounded-full bg-primary text-primaryink">
                              <Check className="size-3.5" strokeWidth={3.5} />
                            </motion.span>
                          )}
                          <span className="text-3xl">{l.flag}</span>
                          <p className="mt-2 font-display text-sm font-semibold text-ink">{l.name}</p>
                          <p className="text-xs font-bold text-mut">{l.speakers} konuşuyor</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" {...slide} className="mt-10">
                  <h1 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Neden öğreniyorsun? 💭</h1>
                  <p className="mt-2 text-center text-sm font-semibold text-mut">Sana en uygun yolu böyle çizelim.</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {reasons.map((r) => (
                      <motion.button
                        key={r.title}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setReason(r.title)}
                        className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4.5 text-left transition-all duration-200", reason === r.title ? "border-primary bg-primarysoft" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="text-3xl">{r.emoji}</span>
                        <span>
                          <span className="block font-display text-sm font-semibold text-ink">{r.title}</span>
                          <span className="block text-xs font-semibold text-mut">{r.desc}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" {...slide} className="mt-10">
                  <h1 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Şu anki seviyen ne? 📏</h1>
                  <p className="mt-2 text-center text-sm font-semibold text-mut">Endişelenme, ilk ders sonrası netleşecek.</p>
                  <div className="mt-8 space-y-3">
                    {levels.map((l, i) => (
                      <motion.button
                        key={l.title}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setLevel(i)}
                        className={cn("flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200", level === i ? "border-primary bg-primarysoft" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="flex size-12 items-center justify-center rounded-xl bg-raise text-2xl">{l.emoji}</span>
                        <span>
                          <span className="block font-display font-semibold text-ink">{l.title}</span>
                          <span className="block text-sm font-semibold text-mut">{l.desc}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" {...slide} className="mt-10">
                  <h1 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Günlük hedefin ne? 🎯</h1>
                  <p className="mt-2 text-center text-sm font-semibold text-mut">Küçük hedefler, büyük zaferler getirir.</p>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {goals.map((g) => (
                      <motion.button
                        key={g.min}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGoal(g.min)}
                        className={cn("cursor-pointer rounded-2xl border-2 p-6 text-center transition-all duration-200", goal === g.min ? "border-primary bg-primarysoft shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_35%,var(--line))]" : "border-line bg-surface hover:border-linestrong")}
                      >
                        <span className="text-4xl">{g.emoji}</span>
                        <p className="mt-2.5 font-display font-semibold text-ink">{g.title}</p>
                        <p className="text-sm font-bold text-mut">{g.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" {...slide} className="mt-10 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }} className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primarystrong text-white shadow-pop">
                    <PartyPopper className="size-12" />
                  </motion.div>
                  <h1 className="mt-6 font-display text-3xl font-bold text-ink">Hazırsın, {form.fullName.split(" ")[0] || "şampiyon"}! 🎉</h1>
                  <p className="mt-2 text-sm font-semibold text-mut">Kişisel öğrenme yolun oluşturuldu. İşte maceran:</p>
                  <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
                    {[
                      { icon: "🌍", label: "Diller", value: languages.filter((l) => langs.includes(l.code)).map((l) => `${l.flag} ${l.name}`).join(", ") },
                      { icon: "💭", label: "Sebep", value: reason ?? "-" },
                      { icon: "📏", label: "Seviye", value: level !== null ? levels[level].title : "-" },
                      { icon: "🎯", label: "Günlük hedef", value: goal ? `${goal} dakika` : "-" },
                    ].map((r, i) => (
                      <motion.div key={r.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.12 }} className="flex items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4 shadow-card">
                        <span className="text-2xl">{r.icon}</span>
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-mut">{r.label}</p>
                          <p className="text-sm font-bold text-ink">{r.value}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button size="xl" full disabled={!canNext} onClick={() => void next()} className="mt-8">
            {step === 4 ? "Dashboard'a Git 🚀" : "Devam Et"} <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-[0_3px_0_var(--primary-strong)]">
            <span className="font-display text-sm font-bold text-white">P</span>
          </span>
          <span className="font-display text-xl font-bold text-ink">
            parla<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Hesap oluştur</h1>
            <p className="mt-2 text-sm font-semibold text-mut">30 saniyede başla. İlk dersin hazır bekliyor. 🎁</p>

            <form
              className="mt-7 space-y-4"
              onSubmit={(ev) => {
                ev.preventDefault();
                void submit();
              }}
            >
              <Input label="Ad Soyad" placeholder="Ayşe Demir" icon={<User className="size-4.5" />} value={form.fullName} onChange={set("fullName")} error={errors.fullName} success={form.fullName.length >= 3} />
              <Input label="Kullanıcı Adı" placeholder="aysedemir" icon={<AtSign className="size-4.5" />} value={form.username} onChange={set("username")} error={errors.username} success={form.username.length >= 3} />
              <Input label="E-posta" type="email" placeholder="ornek@posta.com" icon={<Mail className="size-4.5" />} value={form.email} onChange={set("email")} error={errors.email} success={/^\S+@\S+\.\S+$/.test(form.email)} />
              <div>
                <Input label="Şifre" type="password" placeholder="••••••••" icon={<KeyRound className="size-4.5" />} value={form.password} onChange={set("password")} error={errors.password} />
                {form.password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div key={i} initial={false} animate={{ opacity: i < strength ? 1 : 0.25 }} className={cn("h-1.5 flex-1 rounded-full", strengthMeta[strength].color)} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-mut">
                      Şifre gücü: <span className="text-ink">{strengthMeta[strength].label}</span>
                    </p>
                  </div>
                )}
              </div>
              <Button size="lg" full loading={loading} type="submit">
                Hesap Oluştur <ArrowRight className="size-5" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm font-semibold text-mut">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="font-extrabold text-primary hover:underline">
                Giriş yap
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[#071209] lg:block">
        <div className="hero-glow absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center p-14">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="max-w-md">
            <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 2.8, repeat: Infinity }}>
              <Mascot mood="joy" size={150} className="mx-auto drop-shadow-2xl" />
            </motion.div>
            <h2 className="mt-8 text-center font-display text-4xl font-bold leading-tight text-white">
              1 dil, 332 kelime,
              <br />
              sınırsız macera.
            </h2>
            <p className="mt-4 text-center text-base font-medium leading-relaxed text-white/55">İngilizce A1 yolculuğu: 3 ünite, 15 ders, boss savaşları ve rozetler seni bekliyor.</p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm font-medium leading-relaxed text-white/75">“Kayıt oldum, 5 dakikada ilk dersimi bitirdim. Seri rozetini almak için her gün giriyorum!”</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-accent font-display text-sm font-bold text-white">DK</span>
                <div>
                  <p className="text-sm font-extrabold text-white">Deren K.</p>
                  <p className="text-xs font-bold text-white/50">94 günlük seri 🇪🇸</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
