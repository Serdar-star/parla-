import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import confetti from "canvas-confetti";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0) {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function shuffle<T>(arr: T[], seed = 1): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function confettiDensity(): number {
  try {
    const raw = localStorage.getItem("parla-settings");
    if (raw) {
      const confettiLevel = (JSON.parse(raw) as { confetti?: string }).confetti;
      if (confettiLevel === "az") return 0.35;
      if (confettiLevel === "cok") return 1.9;
    }
  } catch {
    /* yok say */
  }
  return 1;
}

export function fireConfetti(big = false) {
  const d = confettiDensity();
  const colors = ["#58cc02", "#ffc800", "#ff9600", "#9b5cff", "#1cb0f6", "#ffffff"];
  if (d <= 0) return;
  if (big) {
    confetti({ particleCount: Math.round(120 * d), spread: 75, origin: { y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: Math.round(80 * d), angle: 60, spread: 60, origin: { x: 0 }, colors }), 220);
    setTimeout(() => confetti({ particleCount: Math.round(80 * d), angle: 120, spread: 60, origin: { x: 1 }, colors }), 380);
  } else {
    confetti({ particleCount: Math.round(70 * d), spread: 65, origin: { y: 0.7 }, colors });
  }
}

let audioCtx: AudioContext | null = null;

export function playTone(kind: "correct" | "wrong" | "click" | "win") {
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const ctx = audioCtx;
    const notes =
      kind === "correct" ? [523.25, 659.25, 783.99]
      : kind === "wrong" ? [196, 146.83]
      : kind === "win" ? [523.25, 659.25, 783.99, 1046.5]
      : [880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === "wrong" ? "square" : "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.05 : 0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {
    /* ses desteklenmiyorsa sessiz devam et */
  }
}

export function speak(text: string, opts?: { rate?: number; lang?: string }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  let rate = opts?.rate ?? 0.95;
  try {
    const raw = localStorage.getItem("parla-settings");
    if (raw && opts?.rate === undefined) {
      const ttsRate = (JSON.parse(raw) as { ttsRate?: number }).ttsRate;
      if (typeof ttsRate === "number" && ttsRate > 0) rate = ttsRate;
    }
  } catch {
    /* yok say */
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? "en-US";
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function pad(n: number) {
  return n.toString().padStart(2, "0");
}
