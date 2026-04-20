"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
};

/* Reveal — on mount, fade + slide up. Use for hero/above-the-fold. */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 24,
  duration = 0.9,
}: BaseProps & { y?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration, delay, ease: "power3.out" }
    );
    return () => { tween.kill(); };
  }, [delay, y, duration]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/* Stagger — on mount, stagger-reveal direct children. */
export function Stagger({
  children,
  className,
  style,
  delay = 0,
  stagger = 0.09,
  y = 20,
}: BaseProps & { stagger?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el.children,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration: 0.7, stagger, delay, ease: "power3.out" }
    );
    return () => { tween.kill(); };
  }, [delay, stagger, y]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/* ScrollReveal — fade+slide when element enters viewport. */
export function ScrollReveal({
  children,
  className,
  style,
  y = 30,
}: BaseProps & { y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { opacity: 0, y });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" });
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); };
  }, [y]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/* ScrollStagger — stagger-reveal children when container enters viewport. */
export function ScrollStagger({
  children,
  className,
  style,
  stagger = 0.09,
  y = 24,
}: BaseProps & { stagger?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el.children, { opacity: 0, y });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(el.children, { opacity: 1, y: 0, duration: 0.75, stagger, ease: "power3.out" });
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); };
  }, [stagger, y]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/* ProgressFill — animates width on mount from 0 → target */
export function ProgressFill({
  percent,
  className,
  style,
}: {
  percent: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el,
      { width: "0%" },
      { width: `${percent}%`, duration: 1.1, ease: "power2.out", delay: 0.15 }
    );
    return () => { tween.kill(); };
  }, [percent]);
  return <div ref={ref} className={className} style={style} />;
}
