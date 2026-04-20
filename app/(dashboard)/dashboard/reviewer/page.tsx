"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

function applyPrintTableStyles(html: string): string {
  // Replace each full <table>...</table> block with inline styles
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const firstRow = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i)?.[1] ?? "";
    const thCount = (firstRow.match(/<th/gi) ?? []).length;
    const tdCount = (firstRow.match(/<td/gi) ?? []).length;
    const cols = thCount || tdCount;
    const fontSize = cols > 3 ? "6pt" : "8pt";
    return tableHtml.replace(
      /<table(\s[^>]*)?>/i,
      `<table style="width:100%;border-collapse:collapse;margin:4pt 0;table-layout:fixed;word-break:break-word;font-size:${fontSize};">`
    );
  });
}

function printReviewer(html: string, title: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  const processedHtml = applyPrintTableStyles(html);
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || "AralTayo Reviewer"}</title>
<style>
  @page { margin: 1.5cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #000; background: #fff; }
  .content { column-count: 2; column-gap: 1cm; column-rule: 0.5pt solid #ccc; column-fill: auto; }
  h2 {
    column-span: all;
    font-size: 10pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; border-bottom: 1pt solid #000;
    padding-bottom: 2pt; margin: 10pt 0 6pt;
  }
  h3 { font-size: 9pt; font-weight: 700; margin: 6pt 0 2pt; }
  p { margin: 2pt 0; line-height: 1.5; }
  ul { padding-left: 14pt; margin: 2pt 0 4pt; }
  li { margin: 1pt 0; line-height: 1.5; }
  strong { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 4pt 0; table-layout: fixed; word-break: break-word; break-inside: avoid; }
  th { background: #e0e0e0; font-weight: 700; border: 0.5pt solid #999; padding: 2pt 4pt; text-align: left; overflow-wrap: break-word; }
  td { border: 0.5pt solid #999; padding: 2pt 4pt; overflow-wrap: break-word; }
  tr:nth-child(even) td { background: #f5f5f5; }
  .next-topics { display: none; }
</style>
</head>
<body><div class="content">${processedHtml}</div></body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

function splitReviewer(html: string): { body: string; nextTopics: string[] } {
  // Flexible match: handles single/double quotes, extra attributes, whitespace
  const match = html.match(/<div[^>]*class=["'][^"']*next-topics[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!match) return { body: html, nextTopics: [] };

  const body = html.replace(match[0], "").trim();
  const items = [...match[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim()
  ).filter(Boolean);
  return { body, nextTopics: items };
}

export default function ReviewerPage() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewerBody, setReviewerBody] = useState("");
  const [nextTopics, setNextTopics] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!reviewerBody) return;
    const tables = document.querySelectorAll("#reviewer-print table");
    tables.forEach((table) => {
      const cols = table.querySelectorAll("thead tr th").length ||
                   table.querySelectorAll("tr:first-child td").length;
      if (cols > 3) {
        (table as HTMLElement).style.fontSize = "0.65rem";
        table.querySelectorAll("th, td").forEach((cell) => {
          (cell as HTMLElement).style.padding = "4px 6px";
        });
      }
    });
  }, [reviewerBody]);

  async function handleGenerate() {
    if (!notes.trim()) return;
    setError(""); setLoading(true); setReviewerBody(""); setNextTopics([]); setSaved(false);

    const res = await fetch("/api/ai/reviewer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to generate reviewer."); return; }

    const { body, nextTopics: topics } = splitReviewer(data.reviewer);
    setReviewerBody(body);
    setNextTopics(topics);
    setRemaining(data.remaining);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Please add a title before saving."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: dbErr } = await supabase.from("reviewers").insert({
      user_id: user!.id, title: title.trim(), source_notes: notes, content: reviewerBody,
    });
    setSaving(false);
    if (dbErr) setError("Failed to save reviewer.");
    else setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          style={{ background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan-border)' }}>
          AI Tool
        </span>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Reviewer
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Generate a printable study reviewer from your notes.
        </p>
      </div>

      <div className="rounded-2xl p-6 mb-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Your notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            className="dark-input resize-none"
            placeholder="Paste your notes, textbook excerpts, or topic summary here…"
          />
        </div>

        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5"
            style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)', border: '1px solid var(--accent-red-border)' }}>
            {error}
          </p>
        )}

        <button onClick={handleGenerate} disabled={loading || !notes.trim()} className="btn-glow w-full"
          style={{ background: 'linear-gradient(90deg, #0066cc, var(--accent-cyan))' }}>
          {loading ? "Generating reviewer…" : "Generate reviewer"}
        </button>

        {remaining !== null && (
          <p className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            {remaining} AI requests remaining today
          </p>
        )}
      </div>

      {reviewerBody && (
        <>
          {/* Printable reviewer card */}
          <div className="rounded-2xl p-6 space-y-4 mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                placeholder="Add a title to save…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="dark-input flex-1 min-w-0"
              />
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'var(--accent-green-bg)', color: 'var(--accent-green)', border: '1px solid var(--accent-green-border)' }}>
                {saved ? "Saved!" : saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => printReviewer(reviewerBody, title)}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5"
                style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', border: '1px solid var(--accent-purple-border)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / PDF
              </button>
            </div>

            <div
              id="reviewer-print"
              className="reviewer-content rounded-xl p-5 text-sm leading-relaxed"
              style={{ background: 'var(--bg-white-subtle)', border: '1px solid var(--border-subtle)' }}
              dangerouslySetInnerHTML={{ __html: reviewerBody }}
            />
          </div>

          {/* Next topics — outside print area */}
          {nextTopics.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed var(--accent-purple-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-purple)' }}>
                Continue studying — generate a reviewer for:
              </p>
              <div className="flex flex-wrap gap-2">
                {nextTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => { setNotes(topic); setReviewerBody(""); setNextTopics([]); }}
                    className="px-3 py-1.5 rounded-full text-sm transition-all"
                    style={{ background: 'var(--accent-purple-bg)', color: 'var(--text-body)', border: '1px solid var(--accent-purple-border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-purple)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-purple-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-body)'; }}>
                    {topic}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
                Click a topic to load it as your notes, then generate a new reviewer.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
