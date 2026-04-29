"use client";

import { useEffect } from "react";
import { playSfx } from "./sounds";

/**
 * Plays a click sound on every <button> click while `enabled` is true.
 * Gate it on whether the user is in the race scene so we don't beep over
 * the in-game audio.
 */
export function useClickSfx(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button");
      if (!btn) return;
      // Skip disabled buttons and our own internal "skip-click-sfx" opt-out.
      if ((btn as HTMLButtonElement).disabled) return;
      if (btn.dataset.noClickSfx != null) return;
      playSfx("click", 0.4);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [enabled]);
}
