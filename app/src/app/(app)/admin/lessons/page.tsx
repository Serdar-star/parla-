"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Badge, Button, Card, Input, useToast } from "@/components/ui";
import { getJson, postJson, putJson, api } from "@/lib/api";

type Lesson = {
  id: number;
  title: string;
  description: string;
  unitNumber: number;
  lessonNumber: number;
  cefrLevel: string;
  type: string;
  xpReward: number;
};

export default function AdminLessonsPage() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState(1);
  const [num, setNum] = useState(1);

  const load = useCallback(async () => {
    try {
      const d = await getJson<{ lessons: Lesson[] }>("/api/admin/lessons");
      setLessons(d.lessons || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    try {
      await postJson("/api/admin/lessons", {
        title,
        unitNumber: unit,
        lessonNumber: num,
        description: "Yeni ders",
        content: { questions: [] },
      });
      setTitle("");
      toast("Ders eklendi");
      void load();
    } catch (e: any) {
      toast(e?.message || "Hata", { type: "error" });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Ders silinsin mi?")) return;
    try {
      await api(`/api/admin/lessons/${id}`, { method: "DELETE" });
      toast("Silindi");
      void load();
    } catch (e: any) {
      toast(e?.message || "Hata", { type: "error" });
    }
  };

  if (error) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Shield className="mx-auto size-10 text-danger" />
        <p className="mt-3 font-display text-lg font-bold text-ink">{error}</p>
        <Button className="mt-4" href="/dashboard">
          Ana Sayfa
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">Ders Yönetimi</h1>
        <Button size="sm" variant="outline" href="/admin">
          ← Geri
        </Button>
      </div>

      <Card className="mt-5 space-y-3 p-5">
        <p className="font-display text-sm font-bold text-ink">Yeni ders ekle</p>
        <Input label="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Selamlaşma" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ünite" type="number" value={unit} onChange={(e) => setUnit(Number(e.target.value))} />
          <Input label="Ders no" type="number" value={num} onChange={(e) => setNum(Number(e.target.value))} />
        </div>
        <Button onClick={() => void create()}>Ders Ekle</Button>
      </Card>

      <div className="mt-5 space-y-2">
        {lessons.map((l) => (
          <Card key={l.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">{l.title}</p>
              <p className="text-xs font-semibold text-mut">
                Ünite {l.unitNumber} · Ders {l.lessonNumber} · {l.xpReward} XP
              </p>
              <div className="mt-1 flex gap-1">
                <Badge tone="primary">{l.cefrLevel}</Badge>
                <Badge tone="mut">{l.type}</Badge>
              </div>
            </div>
            <Button size="sm" variant="danger" onClick={() => void remove(l.id)}>
              Sil
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
