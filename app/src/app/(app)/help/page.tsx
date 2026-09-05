"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle, Mail, Search } from "lucide-react";
import { Button, Card, Input, useToast } from "@/components/ui";
import { HELP_FAQ } from "@/data/content";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return HELP_FAQ;
    return HELP_FAQ.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => it.q.toLowerCase().includes(term) || it.a.toLowerCase().includes(term)),
    })).filter((c) => c.items.length > 0);
  }, [q]);

  const sendContact = async () => {
    if (!email.trim() || !message.trim()) {
      toast("E-posta ve mesaj gerekli", { type: "warning" });
      return;
    }
    setSending(true);
    try {
      await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "Destek", lang: "tr", level: "—" }),
      });
      toast("Mesajın alındı! 📬", { desc: "En kısa sürede dönüş yapacağız." });
      setMessage("");
    } catch {
      toast("Gönderilemedi, tekrar dene", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-azure text-white shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_55%,black)]">
          <HelpCircle className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Yardım & SSS</h1>
          <p className="text-sm font-semibold text-mut">20+ soru-cevap · anlık arama</p>
        </div>
      </div>

      <div className="mt-5">
        <Input icon={<Search className="size-4" />} placeholder="Soru ara..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6 space-y-6">
        {filtered.map((cat) => (
          <div key={cat.category}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-mut">{cat.category}</h2>
            <div className="mt-2 space-y-2">
              {cat.items.map((it) => {
                const id = `${cat.category}-${it.q}`;
                const isOpen = open === id;
                return (
                  <Card key={id} className="overflow-hidden p-0">
                    <button onClick={() => setOpen(isOpen ? null : id)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left">
                      <span className="text-sm font-extrabold text-ink">{it.q}</span>
                      <ChevronDown className={cn("size-5 shrink-0 text-mut transition", isOpen && "rotate-180 text-primary")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="border-t-2 border-line px-5 py-4 text-sm font-semibold leading-relaxed text-mut">{it.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">Sonuç bulunamadı</p>
            <p className="mt-1 text-sm font-semibold text-mut">Farklı bir anahtar kelime dene veya aşağıdaki formu kullan.</p>
          </Card>
        )}
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-ink">Sorunuzu bulamadınız mı?</h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-mut">Bize yaz, yardımcı olalım.</p>
        <div className="mt-4 space-y-3">
          <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sen@ornek.com" />
          <div>
            <label className="mb-1.5 block text-[13px] font-extrabold text-ink">Mesaj</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Sorununuzu yazın..." className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-primary" />
          </div>
          <Button full loading={sending} onClick={() => void sendContact()}>
            E-posta Gönder
          </Button>
        </div>
      </Card>
    </div>
  );
}
