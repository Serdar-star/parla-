"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Settings } from "@/types";

export interface Wallet {
  gems: number;
  hearts: number;
  freezes: number;
  doubleXp: boolean;
  isSuper: boolean;
}

const defaultSettings: Settings = {
  dailyGoal: 10,
  sound: true,
  mic: true,
  animations: true,
  notifTime: "19:30",
  notifLesson: true,
  notifStreak: true,
  notifLeague: false,
  notifDays: [0, 1, 2, 3, 4, 5, 6],
  profilePublic: true,
  showInLeague: true,
  fontSize: "md",
  confetti: "normal",
  ttsRate: 1,
  twoFactor: false,
};

const defaultWallet: Wallet = { gems: 520, hearts: 5, freezes: 1, doubleXp: false, isSuper: false };

interface AppState {
  settings: Settings;
  wallet: Wallet;
  update: (p: Partial<Settings>) => void;
  addGems: (n: number) => void;
  spendGems: (n: number) => boolean;
  loseHeart: () => void;
  refillHearts: () => void;
  addFreeze: () => void;
  setDoubleXp: (v: boolean) => void;
  activateSuper: () => void;
}

const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) {
    return {
      settings: defaultSettings,
      wallet: defaultWallet,
      update: () => {},
      addGems: () => {},
      spendGems: () => false,
      loseHeart: () => {},
      refillHearts: () => {},
      addFreeze: () => {},
      setDoubleXp: () => {},
      activateSuper: () => {},
    };
  }
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [wallet, setWallet] = useState<Wallet>(defaultWallet);

  useEffect(() => {
    try {
      const s = localStorage.getItem("parla-settings");
      if (s) setSettings((p) => ({ ...p, ...JSON.parse(s) }));
      const w = localStorage.getItem("parla-wallet");
      if (w) setWallet((p) => ({ ...p, ...JSON.parse(w) }));
    } catch {
      /* yok say */
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = settings.fontSize === "sm" ? "14px" : settings.fontSize === "lg" ? "18px" : "16px";
  }, [settings.fontSize]);

  const update = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      try {
        localStorage.setItem("parla-settings", JSON.stringify(next));
      } catch {
        /* yok say */
      }
      return next;
    });
  }, []);

  const persistWallet = useCallback((next: Wallet) => {
    setWallet(next);
    try {
      localStorage.setItem("parla-wallet", JSON.stringify(next));
    } catch {
      /* yok say */
    }
  }, []);

  const addGems = useCallback(
    (n: number) => {
      setWallet((prev) => {
        const next = { ...prev, gems: Math.max(0, prev.gems + n) };
        try {
          localStorage.setItem("parla-wallet", JSON.stringify(next));
        } catch {
          /* yok say */
        }
        return next;
      });
    },
    []
  );

  const spendGems = useCallback(
    (n: number) => {
      let ok = false;
      setWallet((prev) => {
        if (prev.gems < n) return prev;
        ok = true;
        const next = { ...prev, gems: prev.gems - n };
        try {
          localStorage.setItem("parla-wallet", JSON.stringify(next));
        } catch {
          /* yok say */
        }
        return next;
      });
      return ok;
    },
    []
  );

  const loseHeart = useCallback(() => {
    setWallet((prev) => {
      const next = { ...prev, hearts: Math.max(0, prev.hearts - 1) };
      try {
        localStorage.setItem("parla-wallet", JSON.stringify(next));
      } catch {
        /* yok say */
      }
      return next;
    });
  }, []);

  const refillHearts = useCallback(() => persistWallet({ ...wallet, hearts: 5 }), [wallet, persistWallet]);
  const addFreeze = useCallback(() => persistWallet({ ...wallet, freezes: wallet.freezes + 1 }), [wallet, persistWallet]);
  const setDoubleXp = useCallback((v: boolean) => persistWallet({ ...wallet, doubleXp: v }), [wallet, persistWallet]);
  const activateSuper = useCallback(() => persistWallet({ ...wallet, isSuper: true }), [wallet, persistWallet]);

  return (
    <AppCtx.Provider value={{ settings, wallet, update, addGems, spendGems, loseHeart, refillHearts, addFreeze, setDoubleXp, activateSuper }}>
      {children}
    </AppCtx.Provider>
  );
}
