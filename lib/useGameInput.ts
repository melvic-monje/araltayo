"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PlayerInput } from "./game";

/**
 * Tracks current movement input + tracks "skill triggered" timestamps
 * so the game scene can detect rising-edge skill activations from any source
 * (keyboard, touch buttons).
 */
export function useGameInput() {
  const inputRef = useRef<PlayerInput>({ forward: 0, turn: 0 });
  const skillTriggerRef = useRef<{ throw?: number; harpoon?: number }>({});
  const keysRef = useRef<Record<string, boolean>>({});

  const api = useMemo(() => ({
    setForward: (v: number) => { inputRef.current = { ...inputRef.current, forward: v }; },
    setTurn: (v: number) => { inputRef.current = { ...inputRef.current, turn: v }; },
    triggerThrow: () => { skillTriggerRef.current = { ...skillTriggerRef.current, throw: Date.now() }; },
    triggerHarpoon: () => { skillTriggerRef.current = { ...skillTriggerRef.current, harpoon: Date.now() }; },
  }), []);

  useEffect(() => {
    const recompute = () => {
      const k = keysRef.current;
      const fwd = (k["ArrowUp"] ? 1 : 0) - (k["ArrowDown"] ? 1 : 0);
      const turn = (k["ArrowRight"] ? 1 : 0) - (k["ArrowLeft"] ? 1 : 0);
      inputRef.current = { forward: fwd, turn };
    };

    const onDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
        keysRef.current[e.code] = true;
        recompute();
      } else if (e.code === "KeyU") {
        if (!e.repeat) api.triggerThrow();
      } else if (e.code === "KeyI") {
        if (!e.repeat) api.triggerHarpoon();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        keysRef.current[e.code] = false;
        recompute();
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [api]);

  return { inputRef, skillTriggerRef, ...api };
}
