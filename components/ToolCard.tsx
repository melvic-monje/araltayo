"use client";

import Link from "next/link";
import { useState } from "react";

interface ToolCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  glow: string;
}

export default function ToolCard({ href, icon, title, description, accent, glow }: ToolCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block p-5 rounded-2xl transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: hovered ? `1px solid ${accent}40` : '1px solid var(--border-subtle)',
        boxShadow: hovered ? `0 8px 32px ${glow}` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${accent}18`, color: accent }}>
        {icon}
      </div>
      <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
        Get started
        <svg className="w-3.5 h-3.5 transition-transform" style={{ transform: hovered ? 'translateX(4px)' : 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
