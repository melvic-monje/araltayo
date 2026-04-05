"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

const OPT_IN_KEY = "araltayo-push-asked";

export default function PushOptIn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function check() {
      const quizDone = localStorage.getItem("araltayo-first-quiz-done");
      if (!quizDone) return;
      if (localStorage.getItem(OPT_IN_KEY)) return;
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission !== "default") return;
      setShow(true);
    }

    // Check on mount
    check();

    // Also listen for storage changes (quiz page sets the flag)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "araltayo-first-quiz-done") check();
    };
    window.addEventListener("storage", onStorage);

    // Poll briefly in case same-tab localStorage write (storage event only fires cross-tab)
    const interval = setInterval(check, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 30000); // stop polling after 30s

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  async function handleEnable() {
    localStorage.setItem(OPT_IN_KEY, "1");
    setShow(false);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = subscription.toJSON();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      }, { onConflict: "user_id,endpoint" });
    } catch {
      // Silently fail — push is optional
    }
  }

  function handleDismiss() {
    localStorage.setItem(OPT_IN_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-4 shadow-xl w-full"
      style={{ maxWidth: "380px", background: "var(--bg-card-solid)", border: "1px solid var(--border-strong)" }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-purple-bg)" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "var(--accent-purple)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            I-on ang notifications?
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Para ma-remind ka mag-aral at makita ang study streak mo.
          </p>
          <div className="flex gap-2">
            <button onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: "var(--text-faint)", border: "1px solid var(--border-subtle)" }}>
              Hindi muna
            </button>
            <button onClick={handleEnable}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)", color: "#fff" }}>
              I-enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
