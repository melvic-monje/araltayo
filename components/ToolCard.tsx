"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";

interface ToolCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  glow: string;
}

export default function ToolCard({ href, icon, title, description, accent, glow }: ToolCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);

  function onEnter() {
    gsap.to(cardRef.current, {
      y: -4,
      boxShadow: `0 12px 36px ${glow}`,
      borderColor: `${accent}55`,
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(iconRef.current, {
      scale: 1.08,
      rotate: -4,
      duration: 0.4,
      ease: "back.out(2)",
    });
    gsap.to(arrowRef.current, {
      x: 5,
      duration: 0.3,
      ease: "power2.out",
    });
  }

  function onLeave() {
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: "0 0 0 rgba(0,0,0,0)",
      borderColor: "var(--border-subtle)",
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(iconRef.current, {
      scale: 1,
      rotate: 0,
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.to(arrowRef.current, {
      x: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  }

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="block p-5 rounded-2xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        willChange: 'transform',
      }}
    >
      <div
        ref={iconRef}
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${accent}1c`, color: accent }}
      >
        {icon}
      </div>
      <h3 className="font-semibold mb-1 text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold tracking-wide" style={{ color: accent }}>
        Get started
        <svg ref={arrowRef} className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
