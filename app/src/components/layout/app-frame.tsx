"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Ders oynatıcı tam ekran (kabuk yok), diğer tüm sayfalar AppShell içinde.
 * Auth kontrolü artık sunucuda yapılıyor — burada istek atılmıyor.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLessonPlayer = /^\/lessons\/[^/]+$/.test(pathname);

  if (isLessonPlayer) {
    return <div className="min-h-screen bg-bg">{children}</div>;
  }
  return <AppShell>{children}</AppShell>;
}
