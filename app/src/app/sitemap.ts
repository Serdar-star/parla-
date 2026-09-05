import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://parla.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/dashboard",
    "/lessons",
    "/ai-teacher",
    "/roleplay",
    "/games",
    "/duel",
    "/music",
    "/podcast",
    "/news",
    "/camera",
    "/report",
    "/pricing",
    "/premium",
    "/dictionary",
    "/leaderboard",
    "/friends",
    "/notifications",
    "/achievements",
    "/help",
    "/profile",
    "/settings",
    "/stories",
    "/review",
  ];
  return paths.map((p) => ({
    url: `${BASE}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" || p === "/dashboard" ? "daily" : "weekly",
    priority: p === "" || p === "/dashboard" ? 1 : 0.7,
  }));
}
