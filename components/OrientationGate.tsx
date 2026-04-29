"use client";

import { useEffect, useState } from "react";

export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [shouldRotate, setShouldRotate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = matchMedia("(pointer: coarse)").matches;
    const portraitMq = matchMedia("(orientation: portrait)");
    const update = () => setShouldRotate(isCoarse && portraitMq.matches);
    update();
    portraitMq.addEventListener("change", update);

    // Best-effort orientation lock — most browsers reject without fullscreen
    // + user gesture, so we silently swallow the rejection and rely on the
    // overlay below.
    type ScreenWithOrientationLock = Screen & {
      orientation?: ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    };
    const so = (screen as ScreenWithOrientationLock).orientation;
    so?.lock?.("landscape").catch(() => {});

    return () => portraitMq.removeEventListener("change", update);
  }, []);

  if (!shouldRotate) return <>{children}</>;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 text-center"
      style={{ background: "#0B0E1A" }}
    >
      <div>
        <div className="text-7xl mb-4 animate-pulse">📱</div>
        <h2 className="text-2xl font-bold mb-2 neon-text">Rotate your device</h2>
        <p className="text-slate-400 max-w-xs mx-auto">
          Spacebar Race plays best in landscape. Turn your phone sideways to start racing.
        </p>
      </div>
    </div>
  );
}
