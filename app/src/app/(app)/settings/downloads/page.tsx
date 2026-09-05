"use client";

import { useEffect, useState } from "react";
import { Download, HardDrive, Trash2, WifiOff } from "lucide-react";
import { Badge, Button, Card, ProgressBar, useToast } from "@/components/ui";

type CachedLesson = { id: string; title: string; sizeKb: number; at: string };

const KEY = "parla-offline-lessons";

export default function DownloadsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CachedLesson[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const save = (next: CachedLesson[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const addDemo = () => {
    const demo: CachedLesson = {
      id: `lesson-${Date.now()}`,
      title: `Ünite 1 · Ders ${items.length + 1}`,
      sizeKb: 420 + items.length * 35,
      at: new Date().toISOString(),
    };
    save([...items, demo]);
    toast("Ders indirildi 📥", { desc: "Çevrimdışı kullanılabilir." });
  };

  const remove = (id: string) => {
    save(items.filter((x) => x.id !== id));
    toast("İndirme silindi");
  };

  const clearAll = () => {
    save([]);
    toast("Tüm indirmeler temizlendi");
  };

  const totalKb = items.reduce((a, b) => a + b.sizeKb, 0);
  const limitMb = 50;
  const usedPct = Math.min(100, (totalKb / 1024 / limitMb) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-azure text-white">
          <HardDrive className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">İndirmeler</h1>
          <p className="text-sm font-semibold text-mut">Çevrimdışı ders yönetimi</p>
        </div>
      </div>

      {!online && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-gold/40 bg-goldsoft px-4 py-3 text-sm font-extrabold text-gold">
          <WifiOff className="size-4" /> Çevrimdışı moddasın. Sadece indirilen içeriklere erişebilirsin.
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-ink">Disk kullanımı</p>
          <Badge tone="azure">
            {(totalKb / 1024).toFixed(1)} / {limitMb} MB
          </Badge>
        </div>
        <ProgressBar value={usedPct} className="mt-3" barClassName="from-azure to-violet" />
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={addDemo}>
            <Download className="size-4" /> Ders İndir
          </Button>
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={clearAll}>
              Tümünü Sil
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-5 space-y-2">
        {items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-3 font-display text-lg font-bold text-ink">İndirilen ders yok</p>
            <p className="mt-1 text-sm font-semibold text-mut">Mevcut ünite derslerini indir, internetsiz çalış.</p>
          </Card>
        )}
        {items.map((it) => (
          <Card key={it.id} className="flex items-center gap-3 p-4">
            <span className="text-2xl">📚</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">{it.title}</p>
              <p className="text-xs font-semibold text-mut">
                {(it.sizeKb / 1024).toFixed(2)} MB · {new Date(it.at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <button onClick={() => remove(it.id)} className="cursor-pointer rounded-xl border-2 border-line p-2 text-mut hover:text-danger" aria-label="Sil">
              <Trash2 className="size-4" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
