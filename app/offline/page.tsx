"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-page)" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--accent-yellow-bg)", border: "1px solid var(--accent-yellow-border)" }}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "var(--accent-yellow)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          Offline ka ngayon
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-body)" }}>
          Wala kang internet connection ngayon. Maaari mong tingnan ang iyong mga nakaraang quiz at reviewer habang offline.
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-faint)" }}>
          Ang AI tools (Quiz Generator, Reviewer, Flashcards, Explainer, AI Tutor) ay nangangailangan ng internet para gumana.
        </p>
        <button onClick={() => window.location.reload()}
          className="btn-glow text-sm" style={{ padding: "10px 28px" }}>
          Subukang i-refresh
        </button>
      </div>
    </div>
  );
}
