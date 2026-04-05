import Link from "next/link";

const MESSAGES: Record<string, string> = {
  missing_token: "The confirmation link is missing a token.",
  invalid_token: "This link is invalid or has already been used.",
  update_failed: "Something went wrong activating the account. Please try again.",
};

export default function ConsentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-red-border)', backdropFilter: 'blur(20px)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-red-bg)', border: '1px solid var(--accent-red-border)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-red)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Consent link error
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          There was a problem with the confirmation link.
        </p>
        <Link href="/signup" className="btn-glow inline-block">
          Back to sign up
        </Link>
      </div>
    </div>
  );
}
