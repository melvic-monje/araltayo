import Link from "next/link";

export default function VerifyParentPage() {
  return (
    <>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(253,207,109,0.12)', border: '1px solid rgba(253,207,109,0.3)' }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-yellow)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Check your parent&apos;s inbox
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          We sent a confirmation email to your parent or guardian.
          Your account will be activated once they click the link.
        </p>
        <div className="mt-6 rounded-xl p-4 text-left"
          style={{ background: 'rgba(253,207,109,0.08)', border: '1px solid rgba(253,207,109,0.2)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent-yellow)' }}>What happens next?</p>
          <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: 'var(--text-body)' }}>
            <li>Your parent receives an email from AralTayo</li>
            <li>They click &quot;Approve Account&quot; in the email</li>
            <li>Your account activates and you can start studying</li>
          </ol>
        </div>
        <p className="mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          Didn&apos;t receive the email? Ask your parent to check spam, or{" "}
          <Link href="/signup" style={{ color: 'var(--accent-cyan)' }}>
            sign up again
          </Link>{" "}
          with a different parent email.
        </p>
      </div>
    </>
  );
}
