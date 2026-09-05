import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/layout/app-frame";
import { COOKIE_NAME, DEMO_MODE, verifyToken } from "@/lib/auth";

/**
 * Sunucu bileşeni: oturum kontrolü burada yapılır.
 *
 * Önceden bu layout bir client component'ti ve tüm uygulama sayfalarını
 * tarayıcıda `/api/auth/me` isteği bitene kadar bir "Yükleniyor..."
 * ekranının arkasında bekletiyordu. İçerik görünmeden önce sırayla
 * HTML → JS indir → hydrate → auth fetch → sayfanın kendi fetch'i
 * adımlarının bitmesi gerekiyordu.
 *
 * Burada sadece JWT doğrulanıyor (imza kontrolü, DB sorgusu yok —
 * middleware zaten aynı imzayı doğruluyor). Böylece hem gereksiz tur
 * hem de spinner gidiyor, hem de her sayfa render'ında ekstra bir
 * veritabanı sorgusu maliyeti oluşmuyor.
 */
export default async function GroupLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const userId = token ? await verifyToken(token) : null;
  if (!userId && !DEMO_MODE) redirect("/login");

  return <AppFrame>{children}</AppFrame>;
}
