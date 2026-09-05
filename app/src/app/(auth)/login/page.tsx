"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { postJson } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Geçerli bir e-posta adresi gir";
    if (form.password.length < 6) e.password = "Şifre en az 6 karakter olmalı";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await postJson<{ user: { fullName: string; streak: number } }>("/api/auth/login", form);
      toast(`Tekrar hoş geldin, ${data.user.fullName.split(" ")[0]}! 👋`, { desc: "Derslerin seni bekliyor." });
      setLoading(false);
      router.push("/dashboard");
    } catch (err) {
      toast("Giriş yapılamadı", { desc: err instanceof Error ? err.message : "Bilinmeyen hata", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#071209] lg:block">
        <div className="hero-glow absolute inset-0" />
        <div className="relative flex h-full flex-col justify-center p-14">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-white">
              Serini korumaya
              <br />
              <span className="text-gradient-jade">hazır mısın?</span>
            </h2>
            <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-white/55">Her gün 10 dakika, bir ömür süper güç. Kaldığın yerden devam et. 🔥</p>
            <div className="mt-10 flex items-end gap-3">
              <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
                <Mascot mood="wave" size={110} className="drop-shadow-2xl" />
              </motion.div>
              <div className="relative mb-6 rounded-2xl rounded-bl-md border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-sm font-bold text-white">Hoş geldin! 👋</p>
                <p className="text-xs font-semibold text-white/60">Serin güvende, dersin hazır. Hadi!</p>
              </div>
            </div>
            <p className="mt-6 text-xs font-bold text-white/35">332 kelime · 15 ders · 32 başarım · 4.9 ★</p>
          </motion.div>
        </div>
      </div>

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
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Tekrar hoş geldin</h1>
            <p className="mt-2 text-sm font-semibold text-mut">Serin seni özledi. Hadi kaldığımız yerden. 🔥</p>

            <form
              className="mt-8 space-y-4"
              onSubmit={(ev) => {
                ev.preventDefault();
                void submit();
              }}
            >
              <Input
                label="E-posta"
                type="email"
                placeholder="ornek@posta.com"
                icon={<Mail className="size-4.5" />}
                value={form.email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, email: e.target.value }));
                  setErrors((p) => ({ ...p, email: undefined }));
                }}
                error={errors.email}
                success={/^\S+@\S+\.\S+$/.test(form.email)}
              />
              <Input
                label="Şifre"
                type="password"
                placeholder="••••••••"
                icon={<KeyRound className="size-4.5" />}
                value={form.password}
                onChange={(e) => {
                  setForm((p) => ({ ...p, password: e.target.value }));
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-mut">
                  <button
                    type="button"
                    onClick={() => setRemember(!remember)}
                    className={`flex size-5.5 cursor-pointer items-center justify-center rounded-md border-2 transition-all ${remember ? "border-primary bg-primary text-primaryink" : "border-linestrong bg-surface"}`}
                  >
                    {remember && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  Beni hatırla
                </label>
                <button type="button" onClick={() => toast("Şifre sıfırlama", { desc: "Bu demoda giriş için yeni hesap oluşturabilirsin.", type: "info" })} className="cursor-pointer text-sm font-extrabold text-primary hover:underline">
                  Şifremi unuttum
                </button>
              </div>

              <Button size="lg" full loading={loading} type="submit" className="mt-3">
                Giriş Yap <ArrowRight className="size-5" />
              </Button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-mut">
              Hesabın yok mu?{" "}
              <Link href="/register" className="font-extrabold text-primary hover:underline">
                Ücretsiz kayıt ol
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
