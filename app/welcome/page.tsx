import Link from "next/link";

export default function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ already?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,195,154,0.25)', backdropFilter: 'blur(20px)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,195,154,0.12)', border: '1px solid rgba(0,195,154,0.3)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#00C39A' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Account activated!
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Parental consent confirmed. The student account is now active and ready to use.
        </p>
        <Link href="/login" className="btn-glow inline-block">
          Go to login
        </Link>
      </div>
    </div>
  );
}
