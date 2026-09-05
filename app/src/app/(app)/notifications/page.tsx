"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { getJson, putJson, api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Notif = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string | Date;
};

const ICONS: Record<string, string> = {
  streak_reminder: "🔥",
  achievement: "🏆",
  level_up: "⭐",
  duel_invite: "⚔️",
  duel_result: "🎯",
  friend_request: "👥",
  weekly_report: "📊",
  daily_goal: "🎯",
};

const LINKS: Record<string, string> = {
  streak_reminder: "/lessons",
  achievement: "/achievements",
  level_up: "/profile",
  duel_invite: "/duel",
  duel_result: "/duel",
  friend_request: "/friends",
  weekly_report: "/report",
  daily_goal: "/dashboard",
};

function timeAgo(d: string | Date) {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "şimdi";
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} g`;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await getJson<{ notifications: Notif[]; unreadCount: number }>("/api/notifications");
      setItems(d.notifications || []);
      setUnread(d.unreadCount || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAll = async () => {
    try {
      await putJson("/api/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      toast("Tümü okundu işaretlendi");
    } catch {}
  };

  const markOne = async (id: number) => {
    try {
      await putJson(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/notifications/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
      toast("Bildirim silindi");
    } catch {}
  };

  const sorted = [...items].sort((a, b) => Number(a.isRead) - Number(b.isRead));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-azure text-white shadow-[0_3px_0_color-mix(in_srgb,var(--azure)_55%,black)]">
            <Bell className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Bildirimler</h1>
            <p className="text-sm font-semibold text-mut">{unread} okunmamış</p>
          </div>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={() => void markAll()}>
            <CheckCheck className="size-4" /> Tümünü okundu
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-2.5">
        {loading && <Card className="p-8 text-center text-sm font-bold text-mut">Yükleniyor…</Card>}
        {!loading && sorted.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-4xl">🔕</p>
            <p className="mt-3 font-display text-lg font-bold text-ink">Bildirim yok</p>
            <p className="mt-1 text-sm font-semibold text-mut">Yeni aktiviteler burada görünecek.</p>
          </Card>
        )}
        {sorted.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 p-4 transition-all",
                n.isRead ? "border-line bg-surface opacity-70" : "border-azure/40 bg-azuresoft/40"
              )}
            >
              <span className="text-2xl">{ICONS[n.type] || "🔔"}</span>
              <Link
                href={LINKS[n.type] || "/dashboard"}
                onClick={() => !n.isRead && void markOne(n.id)}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-bold text-ink">{n.title}</p>
                  {!n.isRead && <Badge tone="azure">Yeni</Badge>}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-mut">{n.message}</p>
                <p className="mt-1 text-[10px] font-extrabold uppercase text-mut">{timeAgo(n.createdAt)}</p>
              </Link>
              <button onClick={() => void remove(n.id)} className="cursor-pointer rounded-lg p-2 text-mut hover:text-danger" aria-label="Sil">
                <Trash2 className="size-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
