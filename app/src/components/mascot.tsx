"use client";

import { cn } from "@/lib/utils";

export type MascotMood = "happy" | "joy" | "sad" | "wave";

/**
 * Piko — Parla'nın maskot papağanı. Tamamen SVG, tamamen bizim. 🦜
 */
export function Mascot({ mood = "happy", size = 120, className }: { mood?: MascotMood; size?: number; className?: string }) {
  const wingUp = mood === "wave" || mood === "joy";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={cn("select-none", className)} aria-hidden>
      {/* ayaklar */}
      <ellipse cx="47" cy="108" rx="10" ry="5" fill="#ff9600" />
      <ellipse cx="73" cy="108" rx="10" ry="5" fill="#ff9600" />

      {/* kuyruk tüyleri */}
      <ellipse cx="26" cy="84" rx="7" ry="14" fill="#1cb0f6" transform="rotate(28 26 84)" />
      <ellipse cx="94" cy="84" rx="7" ry="14" fill="#1cb0f6" transform="rotate(-28 94 84)" />

      {/* gövde */}
      <path d="M60 12 C88 12 102 33 102 60 C102 90 85 106 60 106 C35 106 18 90 18 60 C18 33 32 12 60 12 Z" fill="#58cc02" />
      {/* karın */}
      <ellipse cx="60" cy="80" rx="25" ry="21" fill="#a5e860" />

      {/* kafa tüyü */}
      <path d="M52 13 C49 4 57 0 60 7 C63 0 71 4 68 13 Z" fill="#46a302" />

      {/* sol kanat */}
      {wingUp ? (
        <ellipse cx="20" cy="44" rx="9" ry="17" fill="#46a302" transform="rotate(-135 20 44)" />
      ) : (
        <ellipse cx="22" cy="66" rx="8.5" ry="16" fill="#46a302" transform="rotate(16 22 66)" />
      )}
      {/* sağ kanat */}
      {wingUp ? (
        <ellipse cx="100" cy="44" rx="9" ry="17" fill="#46a302" transform="rotate(135 100 44)" />
      ) : (
        <ellipse cx="98" cy="66" rx="8.5" ry="16" fill="#46a302" transform="rotate(-16 98 66)" />
      )}

      {/* gözler */}
      {mood === "joy" ? (
        <>
          <path d="M34 52 Q44 40 54 52" stroke="#17241c" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M66 52 Q76 40 86 52" stroke="#17241c" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="44" cy="50" r="12" fill="#ffffff" />
          <circle cx="76" cy="50" r="12" fill="#ffffff" />
          {mood === "sad" ? (
            <>
              <path d="M32 44 L56 44 L56 38 Q44 34 32 38 Z" fill="#58cc02" />
              <path d="M64 44 L88 44 L88 38 Q76 34 64 38 Z" fill="#58cc02" />
              <circle cx="45" cy="53" r="5" fill="#17241c" />
              <circle cx="77" cy="53" r="5" fill="#17241c" />
              <path d="M52 62 q2 8 -3 12" stroke="#4cc9ff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="46" cy="53" r="5.5" fill="#17241c" />
              <circle cx="78" cy="53" r="5.5" fill="#17241c" />
              <circle cx="48" cy="51" r="1.8" fill="#ffffff" />
              <circle cx="80" cy="51" r="1.8" fill="#ffffff" />
            </>
          )}
        </>
      )}

      {/* yanaklar */}
      <circle cx="32" cy="64" r="5" fill="#ffb27a" opacity="0.75" />
      <circle cx="88" cy="64" r="5" fill="#ffb27a" opacity="0.75" />

      {/* gaga */}
      <path d="M49 60 Q60 53 71 60 Q68 73 60 74 Q52 73 49 60 Z" fill="#ff9600" />
      <path d="M53 66 Q60 71 67 66 Q64 74 60 74 Q56 74 53 66 Z" fill="#e07f00" />

      {/* göğüs parlaması */}
      <ellipse cx="46" cy="26" rx="10" ry="6" fill="#8ae04e" opacity="0.7" transform="rotate(-18 46 26)" />
    </svg>
  );
}
