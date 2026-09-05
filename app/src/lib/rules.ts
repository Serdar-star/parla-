/** XP, seviye, seri ve SRS kuralları — tek doğruluk kaynağı. */

/** Seviye başına gereken XP: 1-10 → 100, 11-25 → 200, 26-50 → 500, 51+ → 1000 */
export function xpNeededForLevel(level: number): number {
  if (level <= 10) return 100;
  if (level <= 25) return 200;
  if (level <= 50) return 500;
  return 1000;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (level < 100 && remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level += 1;
  }
  return level;
}

export function xpIntoLevel(totalXp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let remaining = totalXp;
  while (level < 100 && remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level += 1;
  }
  return { level, into: remaining, needed: xpNeededForLevel(level) };
}

/** SRS tekrar aralıkları (ms) — strength 0..5 */
export const REVIEW_INTERVALS = [
  10 * 60 * 1000, // 0 → 10 dk
  24 * 60 * 60 * 1000, // 1 → 1 gün
  3 * 24 * 60 * 60 * 1000, // 2 → 3 gün
  7 * 24 * 60 * 60 * 1000, // 3 → 7 gün
  14 * 24 * 60 * 60 * 1000, // 4 → 14 gün
  30 * 24 * 60 * 60 * 1000, // 5 → 30 gün
];

export function nextReviewDate(strength: number, from = new Date()): Date {
  const s = Math.max(0, Math.min(5, strength));
  return new Date(from.getTime() + REVIEW_INTERVALS[s]);
}

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function weekStartStr(d = new Date()): string {
  const day = d.getDay(); // 0 = Pazar
  const diff = (day + 6) % 7; // Pazartesi = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return todayStr(monday);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

/** Ders sonuçlarından yıldız hesapla */
export function starsFor(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}
