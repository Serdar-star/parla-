import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
      <Mascot mood="sad" size={160} />
      <p className="mt-6 font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">Piko bu kelimeyi sözlükte bulamadı 🦜</h1>
      <p className="mt-2 max-w-sm text-sm font-semibold text-mut">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ama merak etme, öğrenme yolun hâlâ burada.</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-primary px-8 font-display text-base font-semibold uppercase text-primaryink shadow-[0_5px_0_var(--primary-strong)] transition-all hover:brightness-105 active:translate-y-[5px] active:shadow-none"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
