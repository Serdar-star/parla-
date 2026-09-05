"use client";

import { useEffect, useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { getJson } from "@/lib/api";
import { SONGS, PODCASTS, NEWS } from "@/data/content";

export default function AdminContentPage() {
  const [songs, setSongs] = useState(SONGS.length);
  const [podcasts, setPodcasts] = useState(PODCASTS.length);
  const [news, setNews] = useState(NEWS.length);

  useEffect(() => {
    getJson<{ songs: unknown[] }>("/api/content/songs").then((d) => setSongs(d.songs?.length || SONGS.length)).catch(() => {});
    getJson<{ podcasts: unknown[] }>("/api/content/podcasts").then((d) => setPodcasts(d.podcasts?.length || PODCASTS.length)).catch(() => {});
    getJson<{ articles: unknown[] }>("/api/content/news").then((d) => setNews(d.articles?.length || NEWS.length)).catch(() => {});
  }, []);

  const blocks = [
    { title: "Şarkılar", count: songs, href: "/music", emoji: "🎵", items: SONGS.slice(0, 5).map((s) => s.title) },
    { title: "Podcastler", count: podcasts, href: "/podcast", emoji: "🎙️", items: PODCASTS.slice(0, 5).map((p) => p.title) },
    { title: "Haberler", count: news, href: "/news", emoji: "📰", items: NEWS.slice(0, 5).map((n) => n.title) },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">İçerik Yönetimi</h1>
        <Button size="sm" variant="outline" href="/admin">
          ← Geri
        </Button>
      </div>
      <p className="mt-2 text-sm font-semibold text-mut">Şarkı, podcast ve haber içerikleri mock + DB üzerinden servis edilir.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <Card key={b.title} className="p-5">
            <span className="text-3xl">{b.emoji}</span>
            <p className="mt-2 font-display text-lg font-bold text-ink">{b.title}</p>
            <Badge tone="primary" className="mt-1">
              {b.count} adet
            </Badge>
            <ul className="mt-3 space-y-1">
              {b.items.map((t) => (
                <li key={t} className="truncate text-xs font-semibold text-mut">
                  · {t}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-4" href={b.href} variant="outline">
              Görüntüle
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
