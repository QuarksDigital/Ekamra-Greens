"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import Emblem from "./Emblem";

const ROWS = ["Where the lamps", "meet the lawn,", "and every vow", "finds its", "stage."];

export default function Quote() {
  const root = useRef<HTMLElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Phones drift less, so the full width of every row stays on screen.
      const drift = window.innerWidth < 768 ? 3 : 8;
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;
        gsap.fromTo(
          row,
          { xPercent: drift * dir },
          {
            xPercent: -drift * dir,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });
      gsap.fromTo(
        mark.current,
        { rotate: -90 },
        {
          rotate: 90,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative flex min-h-[140vh] flex-col items-center justify-center overflow-hidden bg-paper py-[14vh]">
      <blockquote className="display relative z-10 w-full text-center text-[clamp(24px,8.6vw,52px)] leading-[0.95] md:text-[clamp(52px,10.4vw,168px)]">
        {ROWS.map((r) => (
          <span key={r} data-row className="block whitespace-nowrap will-change-transform">
            {r}
          </span>
        ))}
      </blockquote>
      {/* Faint rotating mark behind the words: present, never in the way of reading */}
      <div ref={mark} className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.14]">
        <Emblem className="h-[clamp(180px,26vw,380px)] w-[clamp(180px,26vw,380px)]" ring="var(--color-wine)" strokeWidth={8} />
      </div>
      <p className="label mt-12 text-ink-soft">The Ekamra Greens promise</p>
    </section>
  );
}
