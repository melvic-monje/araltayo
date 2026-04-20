import Link from "next/link";
import { Reveal } from "@/components/Motion";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <Reveal className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-green-border)', backdropFilter: 'blur(20px)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-green-bg)', border: '1px solid var(--accent-green-border)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-green)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Account activated!
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Parental consent confirmed. The student account is now active and ready to use.
        </p>
        <Link href="/login" className="btn-glow inline-block">
          Go to login
        </Link>
      </Reveal>
    </div>
  );
}
