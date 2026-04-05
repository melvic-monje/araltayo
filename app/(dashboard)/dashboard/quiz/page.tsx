"use client";

import { useState } from "react";

interface Question {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
}

type AnswerMap = Record<number, string>;

export default function QuizPage() {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleGenerate() {
    if (!notes.trim()) return;
    setError(""); setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false);

    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, count }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to generate quiz."); return; }
    setQuestions(data.quiz);
    setRemaining(data.remaining);
  }

  function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  const score = submitted ? questions.filter((q, i) => answers[i] === q.answer).length : 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-purple)' }}>AI Tool</p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Quiz Generator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Paste your notes and get a quiz in seconds.</p>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Your notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8}
              className="dark-input resize-none"
              placeholder="Paste your notes, textbook excerpts, or topic summary here…" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Number of questions
            </label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="dark-input w-auto">
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-2.5"
              style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)', border: '1px solid var(--accent-red-border)' }}>
              {error}
            </p>
          )}

          <button onClick={handleGenerate} disabled={loading || !notes.trim()} className="btn-glow w-full">
            {loading ? "Generating quiz…" : "Generate quiz"}
          </button>
          {remaining !== null && (
            <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>{remaining} AI requests remaining today</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {submitted && (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold gradient-text">{score}/{questions.length}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>correct</span>
              </div>
            )}
            <button onClick={() => { setQuestions([]); setSubmitted(false); setAnswers({}); }}
              className="text-xs ml-auto font-medium" style={{ color: 'var(--accent-purple)' }}>
              ← New quiz
            </button>
          </div>

          {questions.map((q, i) => {
            const selected = answers[i];
            return (
              <div key={i} className="rounded-2xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span className="gradient-text font-bold mr-2">{i + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.choices.map((choice) => {
                    let bg = 'var(--bg-white-subtle)';
                    let border = 'var(--bg-white-muted)';
                    let color = 'var(--text-body)';

                    if (submitted) {
                      if (choice === q.answer) { bg = 'var(--accent-green-bg)'; border = 'var(--accent-green)'; color = 'var(--text-primary)'; }
                      else if (choice === selected) { bg = 'var(--accent-red-bg)'; border = 'var(--accent-red)'; color = 'var(--accent-red)'; }
                      else { color = 'var(--text-faint)'; }
                    } else if (selected === choice) {
                      bg = 'var(--accent-purple-bg)'; border = 'var(--accent-purple)'; color = 'var(--text-primary)';
                    }

                    return (
                      <button key={choice}
                        onClick={() => !submitted && setAnswers((p) => ({ ...p, [i]: choice }))}
                        className="w-full text-left rounded-xl px-4 py-3 text-sm transition-all duration-200"
                        style={{ background: bg, border: `1px solid ${border}`, color, cursor: submitted ? 'default' : 'pointer' }}>
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-3 text-sm rounded-xl px-4 py-3"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-body)', border: '1px solid var(--border-subtle)' }}>
                    <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          {!submitted && (
            <>
              {error && (
                <p className="text-sm rounded-xl px-4 py-2.5"
                  style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)', border: '1px solid var(--accent-red-border)' }}>
                  {error}
                </p>
              )}
              <button onClick={handleSubmit} className="btn-glow w-full">Submit answers</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
