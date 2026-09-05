"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function DayTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: string; xp: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 shadow-pop">
      <p className="text-xs font-extrabold text-mut">{d.day}</p>
      <p className="font-display text-base font-semibold text-primary">{d.xp} XP</p>
    </div>
  );
}

/**
 * Recharts yalnızca burada import ediliyor ve dashboard'dan `next/dynamic`
 * ile yükleniyor. Böylece ~360 KB'lık recharts paketi ilk açılışı bloklamıyor;
 * sayfanın geri kalanı grafik inmeden önce çiziliyor.
 */
export function WeeklyChart({
  weekly,
  todayIdx,
}: {
  weekly: { day: string; xp: number; minutes: number }[];
  todayIdx: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weekly} barSize={26} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--line)" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--mut)", fontSize: 12, fontWeight: 800 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--mut)", fontSize: 11, fontWeight: 700 }} />
        <Tooltip content={<DayTooltip />} cursor={{ fill: "var(--raise)", opacity: 0.5 }} />
        <Bar dataKey="xp" radius={[8, 8, 2, 2]}>
          {weekly.map((d, i) => (
            <Cell key={d.day} fill={i === todayIdx ? "var(--accent)" : "var(--primary)"} opacity={i === todayIdx ? 1 : 0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
