"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

const CURRENT_YEAR = new Date().getFullYear();

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const age = birthYear ? CURRENT_YEAR - parseInt(birthYear, 10) : null;
  const isMinor = age !== null && age < 18;

  async function handleSignup(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    if (!birthYear || parseInt(birthYear, 10) < 1900 || parseInt(birthYear, 10) > CURRENT_YEAR) {
      setError("Please enter a valid birth year.");
      return;
    }
    if (isMinor && !parentEmail.trim()) {
      setError("A parent or guardian email is required for users under 18.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, birthYear, parentEmail }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    if (data.isMinor) {
      router.push("/verify-parent");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email, password });
    router.push("/dashboard");
    router.refresh();
  }

  const labelClass = "block text-xs font-semibold uppercase tracking-widest mb-1.5";

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
        Create your account
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        No real name needed — you&apos;ll get a fun anonymous name.
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="dark-input" placeholder="you@email.com" />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="dark-input" placeholder="At least 8 characters" />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-muted)' }}>
            Display name <span className="normal-case font-normal" style={{ color: 'var(--text-faint)' }}>(optional)</span>
          </label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="dark-input" placeholder="e.g. BlueMangga#4421" />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Birth year</label>
          <input type="number" required min={1900} max={CURRENT_YEAR} value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="dark-input" placeholder={String(CURRENT_YEAR - 16)} />
          {isMinor && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--accent-yellow)' }}>
              You&apos;re under 18 — parental consent is required.
            </p>
          )}
        </div>

        {isMinor && (
          <div>
            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Parent / guardian email</label>
            <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
              className="dark-input" placeholder="parent@email.com" />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
              We&apos;ll send a confirmation link. No ID collected.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5"
            style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)', border: '1px solid var(--accent-red-border)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-glow w-full mt-2">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>
          Sign in
        </Link>
      </p>
    </>
  );
}
