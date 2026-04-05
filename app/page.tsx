import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";

const HERO_IMG     = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop";
const BUDDY_IMG    = "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80&auto=format&fit=crop";
const LIBRARY_IMG  = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80&auto=format&fit=crop";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Quiz Generator",
    description: "I-paste mo lang ang notes mo — mag-ge-generate agad ng multiple-choice quiz para ma-test mo ang sarili mo.",
    accent: "#6721FF",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Reviewer",
    description: "Gawa ng structured study reviewer mula sa iyong notes — puwede pa i-print para sa buong klase.",
    accent: "#00CBFF",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: "Flashcards",
    description: "Mag-memorize ng terms at definitions gamit ang AI-generated flashcards — perfect for vocab, formulas, at definitions.",
    accent: "#00C39A",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Explainer",
    description: "Di mo gets ang topic? Ipapaliwanag ng AI sa simpleng paraan — may Filipino context pa para mas madaling maintindihan.",
    accent: "#FDCF6D",
  },
];

const STEPS = [
  { number: "01", title: "Gumawa ng account", description: "Libre magsimula. Walang credit card. Mag-sign up gamit ang email mo in under a minute." },
  { number: "02", title: "Piliin ang tool mo", description: "Quiz, Reviewer, Flashcards, Explainer, o Study Buddy — ikaw ang bahala kung saan ka magsisimula." },
  { number: "03", title: "I-paste ang notes mo", description: "Kahit galing sa libro, sa board, o sa sariling notes mo — i-paste lang at hayaan ang AI." },
  { number: "04", title: "Mag-aral nang mas smart", description: "10 free AI requests per day. Kailangan ng more? AralPro is less than isang Starbucks tall a month." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* Nav */}
      <header className="sticky top-0 z-20"
        style={{ background: "rgba(13,1,38,0.85)", borderBottom: "1px solid rgba(103,33,255,0.12)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="text-xl font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
            AralTayo
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium px-4 py-1.5 rounded-full transition-all"
              style={{ color: "var(--text-muted)" }}>
              Log in
            </Link>
            <Link href="/signup" className="btn-glow text-sm px-5 py-2">
              Magsimula
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — split layout */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-[-80px] left-0 w-[600px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, #6721FF 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #00CBFF 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
              style={{ background: "rgba(103,33,255,0.12)", border: "1px solid rgba(103,33,255,0.3)", color: "#a78bfa" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Libre magsimula — para sa lahat ng Filipino students
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight mb-6"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              The future of{" "}
              <span className="gradient-text">learning</span>
              <br />is here.
            </h1>

            <p className="text-lg max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed"
              style={{ color: "var(--text-body)" }}>
              Mas madali na mag-aral dahil sa AralTayo — ang AI-powered study platform na
              ginawa para sa mga Filipino students. Gumawa ng quiz, reviewer, at flashcards
              mula sa notes mo in seconds. Libre magsimula, at less than one Starbucks tall a month kung gusto mo ng unlimited.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/signup" className="btn-glow text-base px-8 py-3.5 w-full sm:w-auto text-center">
                Magsimula nang libre
              </Link>
              <Link href="/login" className="btn-outline-glow text-sm px-8 py-3.5 w-full sm:w-auto text-center">
                Mag-log in
              </Link>
            </div>

            <p className="mt-4 text-xs" style={{ color: "var(--text-faint)" }}>
              Walang credit card para magsimula. 10 free requests per day.
            </p>
          </div>

          {/* Hero image */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="relative rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(103,33,255,0.25)", boxShadow: "0 24px 80px rgba(103,33,255,0.25)" }}>
              <Image
                src={HERO_IMG}
                alt="Filipino students studying together"
                width={700}
                height={480}
                className="w-full object-cover"
                priority
              />
              {/* Overlay tint */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg, rgba(103,33,255,0.15) 0%, rgba(0,203,255,0.08) 100%)" }} />
            </div>

            {/* Floating stat badges */}
            <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl shadow-xl"
              style={{ background: "var(--bg-card-solid)", border: "1px solid rgba(103,33,255,0.3)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>AI requests per day</p>
              <p className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>10</p>
            </div>
            <div className="absolute -top-4 -right-4 px-4 py-2.5 rounded-2xl shadow-xl"
              style={{ background: "var(--bg-card-solid)", border: "1px solid rgba(0,203,255,0.3)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Start for</p>
              <p className="text-lg font-extrabold" style={{ color: "#00CBFF", fontFamily: "var(--font-heading)" }}>Free</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6721FF" }}>
            Tools
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            Lahat ng kailangan mo para <span className="gradient-text">pumasa</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.accent}18`, color: f.accent }}>
                {f.icon}
              </div>
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Study Buddy — photo left, text right */}
      <section style={{ background: "rgba(103,33,255,0.04)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 w-full max-w-md lg:max-w-none relative rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(103,33,255,0.2)", boxShadow: "0 16px 48px rgba(103,33,255,0.2)" }}>
            <Image
              src={BUDDY_IMG}
              alt="Students studying and discussing together"
              width={640}
              height={420}
              className="w-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(103,33,255,0.1) 0%, transparent 60%)" }} />
          </div>
          <div className="flex-1 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>
              Study Buddy
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Mas masaya ang pag-aaral{" "}
              <span className="gradient-text">kapag magkasama</span>.
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-body)" }}>
              Mag-aral kasama ang friends mo sa real-time Study Rooms, o kausapin ang aming AI Tutor
              na parang guro mo — complete with Filipino teacher names pa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {["Real-time study rooms", "AI Tutor na may Filipino context", "Anonymous — walang full name"].map((b) => (
                <span key={b} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — with photo */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#00CBFF" }}>
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            In 4 Steps, Ready ka na.
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-12">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step) => (
              <div key={step.number}>
                <div className="text-5xl font-extrabold mb-2 leading-none"
                  style={{ fontFamily: "var(--font-heading)", color: "rgba(103,33,255,0.2)" }}>
                  {step.number}
                </div>
                <h3 className="font-bold mb-1.5" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex-1 w-full max-w-md lg:max-w-none rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(0,203,255,0.2)", boxShadow: "0 16px 48px rgba(0,203,255,0.12)" }}>
            <Image
              src={LIBRARY_IMG}
              alt="Students studying with laptops"
              width={640}
              height={420}
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Safety note */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl p-8 sm:p-10"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(0,195,154,0.12)", color: "#00C39A" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                Ligtas para sa mga kabataan
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-body)" }}>
                AralTayo is designed for all ages. Para sa mga students, sineseryoso namin ang inyong
                privacy at kaligtasan — ang inyong personal na impormasyon ay protektado at hindi
                ibinabahagi sa kahit sino.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Privacy-first", "Safe for all ages", "Libre magsimula", "10 free requests/day"].map((b) => (
                  <span key={b} className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: "rgba(0,195,154,0.1)", color: "#00C39A", border: "1px solid rgba(0,195,154,0.2)" }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold mb-5"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          Ready ka na bang <span className="gradient-text">mag-aral</span>?
        </h2>
        <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: "var(--text-body)" }}>
          Sumali na sa mga students sa buong Pilipinas na gumagamit ng AralTayo para sa kanilang pag-aaral.
        </p>
        <Link href="/signup" className="btn-glow text-base px-10 py-4 inline-block">
          Magsimula nang libre
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
            AralTayo
          </span>
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
