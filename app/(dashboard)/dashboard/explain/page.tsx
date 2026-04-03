"use client";

import { useState } from "react";

const LEVELS = [
  { value: "elementary", label: "Elementary (Grades 1–6)" },
  { value: "junior-high", label: "Junior High (Grades 7–10)" },
  { value: "senior-high", label: "Senior High (Grades 11–12)" },
  { value: "college", label: "College" },
];

export default function ExplainPage() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("junior-high");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleExplain() {
    if (!topic.trim()) return;
    setError(""); setLoading(true); setExplanation("");

    const res = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, level }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to generate explanation."); return; }
    setExplanation(data.explanation);
    setRemaining(data.remaining);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#FDCF6D' }}>AI Tool</p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Explainer</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Ask AI to explain any topic clearly, at your level.
        </p>
      </div>

      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(253,207,109,0.15)' }}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Topic or question
          </label>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4}
            className="dark-input resize-none"
            placeholder="e.g. What is photosynthesis? / Explain the Philippine Revolution of 1896 / How does compound interest work?" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Your level
          </label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="dark-input w-auto">
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)' }}>
            {error}
          </p>
        )}

        <button onClick={handleExplain} disabled={loading || !topic.trim()} className="btn-glow w-full"
          style={{ background: 'linear-gradient(90deg, #c47c00, #FDCF6D)', color: 'var(--bg-page)' }}>
          {loading ? "Explaining…" : "Explain this"}
        </button>
        {remaining !== null && (
          <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>{remaining} AI requests remaining today</p>
        )}
      </div>

      {explanation && (
        <div className="mt-6 rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(253,207,109,0.2)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              Explanation
            </h2>
            <button onClick={() => { setTopic(""); setExplanation(""); }}
              className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Ask another
            </button>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl p-4"
            style={{ background: 'rgba(253,207,109,0.04)', color: 'var(--text-body)', border: '1px solid rgba(253,207,109,0.1)' }}>
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
}
