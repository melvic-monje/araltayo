"use client";

import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium"
      style={{ background: "var(--accent-yellow)", color: "#0F1A20" }}>
      <span className="mr-2">📡</span>
      Wala kang internet connection ngayon. Ang AI tools ay hindi gagana habang offline.
    </div>
  );
}
