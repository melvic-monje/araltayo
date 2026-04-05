import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const CHECK = (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const DASH = <span className="text-sm">—</span>;

const FEATURES = [
  { label: "AI requests", free: "10 / day", pro: "Unlimited", annual: "Unlimited" },
  { label: "Quiz Generator", free: true, pro: true, annual: true },
  { label: "Reviewer", free: true, pro: true, annual: true },
  { label: "Flashcards", free: true, pro: true, annual: true },
  { label: "Explainer", free: true, pro: true, annual: true },
  { label: "AI Tutor", free: true, pro: true, annual: true },
  { label: "Study Partner", free: true, pro: true, annual: true },
  { label: "Drawing Board", free: true, pro: true, annual: true },
  { label: "Calculator", free: true, pro: true, annual: true },
  { label: "Priority AI responses", free: false, pro: true, annual: true },
  { label: "Longer notes input", free: false, pro: true, annual: true },
  { label: "Export to PDF", free: false, pro: true, annual: true },
  { label: "Save unlimited reviewers", free: false, pro: true, annual: true },
  { label: "Ad-free experience", free: true, pro: true, annual: true },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* Nav */}
      <header className="sticky top-0 z-20"
        style={{ background: "rgba(13,1,38,0.85)", borderBottom: "1px solid rgba(103,33,255,0.12)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="text-xl font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
            AralTayo
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="text-sm font-medium px-4 py-1.5 rounded-full transition-all"
                style={{ color: "var(--text-muted)" }}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login"
                  className="text-sm font-medium px-4 py-1.5 rounded-full transition-all"
                  style={{ color: "var(--text-muted)" }}>
                  Log in
                </Link>
                <Link href="/signup" className="btn-glow text-sm px-5 py-2">
                  Magsimula
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-purple)" }}>
            Pricing
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            Piliin ang plan na <span className="gradient-text">tama sa&apos;yo</span>.
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: "var(--text-body)" }}>
            Libre lang magsimula. Upgrade anytime kung kailangan mo ng more power.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">

          {/* Free */}
          <div className="rounded-2xl p-6 flex flex-col"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-faint)" }}>
              Free
            </p>
            <div className="mb-1">
              <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                ₱0
              </span>
            </div>
            <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>forever</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                10 AI requests per day
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                All study tools
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                Study Partner & AI Tutor
              </li>
            </ul>
            <Link href="/signup"
              className="block text-center py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {isLoggedIn ? "Current plan" : "Magsimula"}
            </Link>
          </div>

          {/* AralPro Monthly — highlighted */}
          <div className="rounded-2xl p-6 flex flex-col relative"
            style={{ background: "var(--bg-card)", border: "2px solid rgba(103,33,255,0.5)", boxShadow: "0 8px 48px rgba(103,33,255,0.2)" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)", color: "#fff" }}>
              Most Popular
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-purple)" }}>
              AralPro
            </p>
            <div className="mb-1">
              <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                ₱149
              </span>
              <span className="text-sm ml-1" style={{ color: "var(--text-faint)" }}>/month</span>
            </div>
            <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>cancel anytime</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--accent-cyan)" }}>{CHECK}</span>
                Unlimited AI requests
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-cyan)" }}>{CHECK}</span>
                Priority AI responses
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-cyan)" }}>{CHECK}</span>
                Longer notes input
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-cyan)" }}>{CHECK}</span>
                Export & save unlimited
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-cyan)" }}>{CHECK}</span>
                Everything in Free
              </li>
            </ul>
            <Link href="/signup"
              className="btn-glow block text-center text-sm"
              style={{ padding: "10px 24px" }}>
              Get AralPro
            </Link>
          </div>

          {/* Annual */}
          <div className="rounded-2xl p-6 flex flex-col relative"
            style={{ background: "var(--bg-card)", border: "1px solid var(--accent-green-border)" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: "var(--accent-green)", color: "#fff" }}>
              Save 44%
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-green)" }}>
              AralPro Annual
            </p>
            <div className="mb-1">
              <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                ₱999
              </span>
              <span className="text-sm ml-1" style={{ color: "var(--text-faint)" }}>/year</span>
            </div>
            <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>₱83/month — best value</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                Unlimited AI requests
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                Everything in AralPro
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                44% cheaper than monthly
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                <span style={{ color: "var(--accent-green)" }}>{CHECK}</span>
                Locked-in price for 1 year
              </li>
            </ul>
            <Link href="/signup"
              className="block text-center py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ background: "var(--accent-green-bg)", color: "var(--accent-green)", border: "1px solid var(--accent-green-border)" }}>
              Get Annual
            </Link>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Feature Comparison
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th className="text-left px-6 py-3 font-semibold" style={{ color: "var(--text-muted)", width: "40%" }}>Feature</th>
                  <th className="text-center px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Free</th>
                  <th className="text-center px-4 py-3 font-semibold" style={{ color: "var(--accent-purple)" }}>AralPro</th>
                  <th className="text-center px-4 py-3 font-semibold" style={{ color: "var(--accent-green)" }}>Annual</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.label}
                    style={{ borderBottom: i < FEATURES.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <td className="px-6 py-3" style={{ color: "var(--text-body)" }}>{f.label}</td>
                    {(["free", "pro", "annual"] as const).map((plan) => {
                      const val = f[plan];
                      return (
                        <td key={plan} className="text-center px-4 py-3">
                          {typeof val === "string" ? (
                            <span className="text-xs font-semibold" style={{ color: plan === "free" ? "var(--text-muted)" : "var(--text-primary)" }}>
                              {val}
                            </span>
                          ) : val ? (
                            <span style={{ color: plan === "free" ? "var(--accent-green)" : plan === "pro" ? "var(--accent-cyan)" : "var(--accent-green)" }}>
                              {CHECK}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-faint)" }}>{DASH}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ-like note */}
        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Hindi pa available ang payment? No worries — enjoy the free plan muna.
            <br />
            We&apos;ll notify you kapag live na ang AralPro.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
            AralTayo
          </Link>
          <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
            AI study platform para sa mga Filipino students. araltayo.ph
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs" style={{ color: "var(--text-faint)" }}>Log in</Link>
            <Link href="/signup" className="text-xs" style={{ color: "var(--text-faint)" }}>Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
