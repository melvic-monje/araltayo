"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

interface Flashcard { front: string; back: string; }

export default function FlashcardsPage() {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(15);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<"grid" | "study">("grid");

  async function handleGenerate() {
    if (!notes.trim()) return;
    setError(""); setLoading(true); setCards([]); setFlipped({}); setCurrent(0); setSaved(false);

    const res = await fetch("/api/ai/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, count }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to generate flashcards."); return; }
    setCards(data.cards);
    setRemaining(data.remaining);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Add a title before saving."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: dbErr } = await supabase.from("flashcard_sets").insert({
      user_id: user!.id, title: title.trim(), cards,
    });
    setSaving(false);
    if (dbErr) setError("Failed to save.");
    else setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#00C39A' }}>AI Tool</p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Flashcards</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create flashcard sets to drill terms and definitions.</p>
      </div>

      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,195,154,0.15)' }}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Your notes
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
            className="dark-input resize-none" placeholder="Paste your notes here…" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Number of cards
          </label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="dark-input w-auto">
            {[10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} cards</option>)}
          </select>
        </div>
        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)' }}>
            {error}
          </p>
        )}
        <button onClick={handleGenerate} disabled={loading || !notes.trim()} className="btn-glow w-full"
          style={{ background: 'linear-gradient(90deg, #009966, #00C39A)' }}>
          {loading ? "Generating flashcards…" : "Generate flashcards"}
        </button>
        {remaining !== null && (
          <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>{remaining} AI requests remaining today</p>
        )}
      </div>

      {cards.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(["grid", "study"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setCurrent(0); setFlipped({}); }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={mode === m
                    ? { background: 'rgba(0,195,154,0.2)', color: '#00C39A' }
                    : { color: 'var(--text-faint)' }}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Title…" className="dark-input w-32 py-1.5 text-xs" />
              <button onClick={handleSave} disabled={saving || saved}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: 'rgba(0,195,154,0.15)', color: '#00C39A', border: '1px solid rgba(0,195,154,0.3)' }}>
                {saved ? "Saved!" : saving ? "…" : "Save"}
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{cards.length} cards generated</p>

          {mode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cards.map((card, i) => (
                <button key={i} onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
                  className="rounded-2xl p-4 text-left min-h-[110px] flex flex-col justify-between transition-all duration-200"
                  style={{
                    background: flipped[i] ? 'rgba(0,195,154,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${flipped[i] ? 'rgba(0,195,154,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: flipped[i] ? '#00C39A' : '#6721FF' }}>
                    {flipped[i] ? "Back" : "Front"}
                  </p>
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {flipped[i] ? card.back : card.front}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#4a3a6a' }}>Tap to flip</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
                Card {current + 1} of {cards.length}
              </p>
              <button onClick={() => setFlipped((p) => ({ ...p, [current]: !p[current] }))}
                className="w-full rounded-2xl p-8 min-h-[180px] flex flex-col items-center justify-center transition-all duration-300"
                style={{
                  background: flipped[current] ? 'rgba(0,195,154,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${flipped[current] ? 'rgba(0,195,154,0.4)' : 'rgba(103,33,255,0.3)'}`,
                }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: flipped[current] ? '#00C39A' : '#6721FF' }}>
                  {flipped[current] ? "Back" : "Front"} — tap to flip
                </p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {flipped[current] ? cards[current].back : cards[current].front}
                </p>
              </button>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setFlipped({}); }}
                  disabled={current === 0}
                  className="btn-outline-glow px-6 py-2 disabled:opacity-30">
                  Previous
                </button>
                <button onClick={() => { setCurrent((c) => Math.min(cards.length - 1, c + 1)); setFlipped({}); }}
                  disabled={current === cards.length - 1}
                  className="btn-outline-glow px-6 py-2 disabled:opacity-30">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
