"use client";

import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "araltayo-install-dismissed";
const VISIT_KEY = "araltayo-visit-count";
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only on mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Track visits — show after 2nd visit
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    if (visits < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    deferredPrompt.current = null;
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto rounded-2xl px-4 py-4 flex items-center gap-3 shadow-xl"
      style={{ maxWidth: "420px", background: "var(--bg-card-solid)", border: "1px solid var(--border-strong)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: "linear-gradient(135deg,#F59E0B,#6FC0B4)" }}>
        📚
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          I-install ang AralTayo
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Para sa mas mabilis na pag-access sa iyong phone.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ color: "var(--text-faint)" }}>
          Mamaya
        </button>
        <button onClick={handleInstall}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: "linear-gradient(90deg,#F59E0B,#6FC0B4)", color: "#fff" }}>
          I-install
        </button>
      </div>
    </div>
  );
}
