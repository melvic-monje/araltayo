"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "spacebar-race-player-id";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function usePlayerId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = uuid();
      localStorage.setItem(STORAGE_KEY, stored);
    }
    setId(stored);
  }, []);
  return id;
}
