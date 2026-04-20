"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useTheme } from "@/lib/theme";
import { getAvatar } from "@/lib/avatars";
import { ProgressFill } from "@/components/Motion";

const TOOLS = [
  {
    href: "/dashboard/quiz", label: "Quiz",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    href: "/dashboard/reviewer", label: "Reviewer",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  },
  {
    href: "/dashboard/flashcards", label: "Flashcards",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  },
  {
    href: "/dashboard/explain", label: "Explainer",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  },
  {
    href: "/dashboard/study-buddy", label: "Study Buddy",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
  },
  {
    href: "/dashboard/study-buddy/ai-tutor", label: "AI Tutor",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.613-1.388 2.613H4.186c-1.418 0-2.389-1.613-1.388-2.613L4.2 15.3" />,
  },
];

export default function DashboardShell({
  displayName,
  avatarId = "default",
  children,
}: {
  displayName: string;
  avatarId?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [usage, setUsage] = useState<{ used: number; remaining: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/usage").then((r) => r.json()).then(setUsage).catch(() => {});
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const used = usage?.used ?? 0;
  const pct = (used / 10) * 100;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen py-5 px-3"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border-subtle)' }}>

        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold gradient-text px-3 mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}>
          AralTayo
        </Link>

        {/* Home */}
        <Link href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1"
          style={pathname === "/dashboard" ? {
            background: 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(111,192,180,0.1))',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
          } : {
            color: 'var(--text-muted)',
            border: '1px solid transparent',
          }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          Home
        </Link>

        {/* Tools label */}
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mt-5 mb-2" style={{ color: 'var(--text-faint)' }}>
          Tools
        </p>

        {/* Tool links */}
        <nav className="flex flex-col gap-0.5">
          {TOOLS.map((item) => {
            const active = item.href === "/dashboard/study-buddy"
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={active ? {
                  background: 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(111,192,180,0.1))',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                } : {
                  color: 'var(--text-muted)',
                  border: '1px solid transparent',
                }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <Link href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-2"
          style={pathname === "/dashboard/settings" ? {
            background: 'linear-gradient(90deg, rgba(245,158,11,0.25), rgba(111,192,180,0.1))',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
          } : {
            color: 'var(--text-muted)',
            border: '1px solid transparent',
          }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>

        {/* Bottom section */}
        <div className="space-y-3 px-1">
          {/* Usage */}
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>AI Requests</span>
              <span className="text-xs font-bold" style={{ color: pct >= 80 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
                {10 - used} left
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-white-muted)' }}>
              <ProgressFill
                percent={pct}
                className="h-full rounded-full"
                style={{
                  background: pct >= 80
                    ? 'linear-gradient(90deg, var(--accent-yellow), #E8826B)'
                    : 'linear-gradient(90deg, #F59E0B, var(--accent-cyan))',
                }}
              />
            </div>
            <Link href="/pricing"
              className="flex items-center justify-center gap-1.5 mt-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{ background: 'linear-gradient(90deg,rgba(245,158,11,0.15),rgba(111,192,180,0.08))', color: 'var(--accent-cyan)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Upgrade to Pro
            </Link>
          </div>

          {/* User row */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: getAvatar(avatarId).bg }}>
              {getAvatar(avatarId).emoji}
            </div>
            <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-body)' }}>{displayName}</span>
            <button onClick={toggle} className="p-1 rounded-full transition-all flex-shrink-0"
              style={{ color: 'var(--text-faint)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
            <button onClick={handleSignOut} className="p-1 rounded-full transition-all flex-shrink-0"
              style={{ color: 'var(--text-faint)' }}
              title="Sign out">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar (mobile + tablet) */}
        <header className="lg:hidden sticky top-0 z-20"
          style={{ background: 'var(--bg-navbar)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(20px)' }}>
          <div className="px-4 sm:px-6 flex items-center justify-between h-14">
            <Link href="/dashboard" className="text-xl font-bold gradient-text flex-shrink-0"
              style={{ fontFamily: 'var(--font-heading)' }}>
              AralTayo
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: pct >= 80 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
                {10 - used} left
              </span>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1" style={{ color: 'var(--text-body)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="border-t px-4 py-3 space-y-1"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-navbar)' }}>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ color: pathname === "/dashboard" ? 'var(--text-primary)' : 'var(--text-muted)', background: pathname === "/dashboard" ? 'var(--border-subtle)' : 'transparent' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                </svg>
                Home
              </Link>
              {TOOLS.map((item) => {
                const active = item.href === "/dashboard/study-buddy" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)', background: active ? 'var(--border-subtle)' : 'transparent' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/pricing" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold"
                style={{ color: 'var(--accent-cyan)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Upgrade to Pro
              </Link>
              <div className="pt-2 flex items-center justify-between px-3">
                <span className="text-xs" style={{ color: 'var(--text-body)' }}>{displayName}</span>
                <div className="flex items-center gap-3">
                  <button onClick={toggle} className="p-1 rounded-full transition-all"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                    {theme === 'dark' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                      </svg>
                    )}
                  </button>
                  <button onClick={handleSignOut} className="text-xs" style={{ color: 'var(--accent-red)' }}>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
