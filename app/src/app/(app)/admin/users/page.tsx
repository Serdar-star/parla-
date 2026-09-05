"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Shield } from "lucide-react";
import { Badge, Button, Card, Input, useToast } from "@/components/ui";
import { getJson, putJson, api } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  level: number;
  xp: number;
  isPremium: boolean;
  isAdmin: boolean;
  subscriptionPlan: string;
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getJson<{ users: AdminUser[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setUsers(d.users || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Yüklenemedi");
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: number, patch: Partial<AdminUser>) => {
    try {
      await putJson(`/api/admin/users/${id}`, patch);
      toast("Güncellendi");
      void load();
    } catch (e: any) {
      toast(e?.message || "Hata", { type: "error" });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Kullanıcı silinsin mi?")) return;
    try {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
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
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Kullanıcı Yönetimi</h1>
          <p className="text-sm font-semibold text-mut">{users.length} kullanıcı</p>
        </div>
        <Button size="sm" variant="outline" href="/admin">
          ← Genel Bakış
        </Button>
      </div>
      <div className="mt-4">
        <Input icon={<Search className="size-4" />} placeholder="Ara (isim, email, username)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-5 space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-ink">
                {u.fullName} <span className="text-mut">@{u.username}</span>
              </p>
              <p className="truncate text-xs font-semibold text-mut">
                {u.email} · Sv.{u.level} · {u.xp} XP
              </p>
              <div className="mt-1 flex gap-1">
                {u.isPremium && <Badge tone="gold">Premium</Badge>}
                {u.isAdmin && <Badge tone="violet">Admin</Badge>}
                <Badge tone="mut">{u.subscriptionPlan || "free"}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void update(u.id, { isPremium: !u.isPremium, subscriptionPlan: !u.isPremium ? "premium" : "free" })}>
                {u.isPremium ? "Premium Al" : "Premium Ver"}
              </Button>
              <Button size="sm" variant="soft" onClick={() => void update(u.id, { isAdmin: !u.isAdmin })}>
                {u.isAdmin ? "Admin Kaldır" : "Admin Yap"}
              </Button>
              <Button size="sm" variant="danger" onClick={() => void remove(u.id)}>
                Sil
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
