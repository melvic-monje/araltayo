"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useTheme } from "@/lib/theme";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/quiz", label: "Quiz" },
  { href: "/dashboard/reviewer", label: "Reviewer" },
  { href: "/dashboard/flashcards", label: "Flashcards" },
  { href: "/dashboard/explain", label: "Explainer" },
  { href: "/dashboard/study-buddy", label: "Study Buddy" },
  { href: "/dashboard/study-buddy/ai-tutor", label: "AI Tutor" },
];

export default function DashboardShell({
  displayName,
  children,
}: {
  displayName: string;
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
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-20"
        style={{ background: 'var(--bg-navbar)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold gradient-text flex-shrink-0"
            style={{ fontFamily: 'var(--font-heading)' }}>
            AralTayo
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                  style={active ? {
                    background: 'linear-gradient(90deg, rgba(103,33,255,0.3), rgba(0,203,255,0.15))',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-strong)',
                  } : {
                    color: 'var(--text-muted)',
                    border: '1px solid transparent',
                  }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Usage pill */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-white-muted)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80
                      ? 'linear-gradient(90deg, var(--accent-yellow), #EE6E4D)'
                      : 'linear-gradient(90deg, #6721FF, var(--accent-cyan))',
                  }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: pct >= 80 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
                {used}/10
              </span>
            </div>

            {/* Upgrade */}
            <Link href="/pricing"
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={{ background: 'linear-gradient(90deg,rgba(103,33,255,0.2),rgba(0,203,255,0.1))', color: 'var(--accent-cyan)', border: '1px solid rgba(103,33,255,0.3)' }}>
              Pro
            </Link>

            {/* Theme toggle */}
            <button onClick={toggle} className="p-1.5 rounded-full transition-all"
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

            <span className="text-xs font-medium" style={{ color: 'var(--text-body)' }}>{displayName}</span>

            <button onClick={handleSignOut}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--bg-white-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--accent-red)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-red-border)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-white-muted)';
              }}>
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: pct >= 80 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
              {used}/10
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
          <div className="md:hidden border-t px-4 py-3 space-y-1"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-navbar)' }}>
            {NAV.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)', background: active ? 'var(--border-subtle)' : 'transparent' }}>
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 flex items-center justify-between px-3">
              <span className="text-xs" style={{ color: 'var(--text-body)' }}>{displayName}</span>
              <div className="flex items-center gap-3">
                {/* Mobile theme toggle */}
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
    </div>
  );
}
