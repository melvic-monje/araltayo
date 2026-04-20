"use client";

import Link from "next/link";

export default function StudyBuddyPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          style={{ background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan-border)' }}>
          Study Buddy
        </span>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Study with someone
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Get help from an AI tutor or study together with a real classmate in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* AI Tutor */}
        <Link href="/dashboard/study-buddy/ai-tutor"
          className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 group"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
          onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(245,158,11,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid var(--border-card)')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-purple-bg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--accent-purple)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.613-1.388 2.613H4.186c-1.418 0-2.389-1.613-1.388-2.613L4.2 15.3" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              AI Tutor
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ask anything. Get explanations, examples, and follow-up answers from an AI study assistant.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--accent-purple)' }}>
            Start session
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Study Partner */}
        <Link href="/dashboard/study-buddy/partner"
          className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 group"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-cyan-border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid var(--accent-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid var(--accent-cyan-border)')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-cyan-bg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--accent-cyan)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Study Partner
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Find a real classmate to study with live. Post a topic and match with someone instantly.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--accent-cyan)' }}>
            Find a partner
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
