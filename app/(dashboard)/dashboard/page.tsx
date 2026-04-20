import { createClient } from "@/lib/supabase-server";
import ToolCard from "@/components/ToolCard";
import { Reveal, Stagger } from "@/components/Motion";

const TOOLS = [
  {
    href: "/dashboard/quiz",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Quiz Generator",
    description: "Turn your notes into multiple-choice quizzes and test yourself.",
    accent: "var(--accent-purple)",
    glow: "rgba(245,158,11,0.22)",
  },
  {
    href: "/dashboard/reviewer",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Reviewer",
    description: "Generate a structured study reviewer from your notes.",
    accent: "var(--accent-cyan)",
    glow: "rgba(95,178,168,0.2)",
  },
  {
    href: "/dashboard/flashcards",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: "Flashcards",
    description: "Create flashcard sets to memorize terms and definitions.",
    accent: "var(--accent-green)",
    glow: "rgba(127,176,105,0.2)",
  },
  {
    href: "/dashboard/explain",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Explainer",
    description: "Ask AI to explain any topic clearly, at your level.",
    accent: "var(--accent-yellow)",
    glow: "rgba(229,182,90,0.2)",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("display_name").eq("id", user!.id).single();

  return (
    <div className="max-w-3xl">
      <Reveal className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-purple)' }}>
          Dashboard
        </p>
        <h1 className="text-4xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Kumusta,{" "}
          <span className="gradient-text italic">{profile?.display_name ?? "Estudyante"}</span>!
        </h1>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>What would you like to study today?</p>
      </Reveal>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" delay={0.25} stagger={0.08}>
        {TOOLS.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </Stagger>

      <Reveal delay={0.7} className="rounded-2xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AralTayo</span> is a free AI study platform
          for Filipino K-12 and college students. You get{" "}
          <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>10 AI requests per day</span> — paste
          your notes into any tool to get started.
        </p>
      </Reveal>
    </div>
  );
}
