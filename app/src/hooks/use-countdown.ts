"use client";

import { useEffect, useState } from "react";

export function useCountdown(getTarget: () => number) {
  const [left, setLeft] = useState(() => Math.max(0, getTarget() - Date.now()));

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, getTarget() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [getTarget]);

  const total = Math.floor(left / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
