"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const MIN_MS = 1800;
const MAX_MS = 7000;
const R = 86;
const O = 92;
const D = 126;
const RING_LEN = 2 * Math.PI * R;
const DIA_LEN = 4 * Math.SQRT2 * D;

// The emblem draws itself ring by ring while the hero's first frames stream in,
// then the whole screen lifts away like a curtain.
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const lenis = () => (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    document.documentElement.style.overflow = "hidden";
    const stopLenis = window.setTimeout(() => lenis()?.stop(), 0);
    window.scrollTo(0, 0);

    const reduced = prefersReducedMotion();
    const shown = { v: 0 };
    let target = 0;
    let finished = false;
    const started = performance.now();

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.fromTo(
          "[data-ring]",
          { strokeDashoffset: RING_LEN },
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.18 },
        );
        gsap.fromTo(
          "[data-diamond]",
          { strokeDashoffset: DIA_LEN },
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", delay: 0.7 },
        );
        gsap.to(mark.current, { rotate: 45, duration: 1.4, ease: "expo.inOut", delay: 1.2 });
      }
    }, el);

    const tick = () => {
      shown.v += (target - shown.v) * 0.12;
      if (count.current) count.current.textContent = String(Math.round(shown.v * 100)).padStart(2, "0");
    };
    gsap.ticker.add(tick);

    let unlocked = false;
    let safety = 0;
    // Page scroll never depends on the exit animation finishing (a background
    // tab pauses animation frames), so a timer guarantees the release too.
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      document.documentElement.style.overflow = "";
      lenis()?.start();
      window.dispatchEvent(new Event("ekamra:entered"));
      setGone(true);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      target = 1;
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(() => {
        safety = window.setTimeout(unlock, 2400);
        const out = gsap.timeline({ onComplete: unlock });
        if (reduced) {
          out.to(el, { autoAlpha: 0, duration: 0.3 });
        } else {
          out
            .to(mark.current, { scale: 0.82, duration: 0.5, ease: "power2.in" })
            .to("[data-loader-meta]", { autoAlpha: 0, duration: 0.3 }, "<")
            .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.05, ease: "expo.inOut" }, "-=0.1");
        }
      }, wait + 250);
    };

    const onProgress = (e: Event) => {
      target = Math.max(target, (e as CustomEvent<number>).detail);
      if (target >= 1) finish();
    };
    window.addEventListener("ekamra:progress", onProgress);
    const cap = window.setTimeout(finish, MAX_MS);

    return () => {
      window.removeEventListener("ekamra:progress", onProgress);
      window.clearTimeout(cap);
      window.clearTimeout(stopLenis);
      window.clearTimeout(safety);
      gsap.ticker.remove(tick);
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="loader fixed inset-0 z-[200] grid place-items-center bg-paper"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      role="status"
      aria-live="polite"
      aria-label="Loading Ekamra Greens"
    >
      <svg ref={mark} viewBox="-190 -190 380 380" className="h-[92px] w-[92px] md:h-[112px] md:w-[112px]" fill="none" aria-hidden>
        <g stroke="var(--color-wine)" strokeWidth={8} strokeLinecap="round">
          {[
            [0, -O],
            [O, 0],
            [0, O],
            [-O, 0],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              data-ring
              cx={cx}
              cy={cy}
              r={R}
              strokeDasharray={RING_LEN}
              transform={`rotate(${-90 + i * 90} ${cx} ${cy})`}
            />
          ))}
        </g>
        <path
          data-diamond
          d={`M0 ${-D} L${D} 0 L0 ${D} L${-D} 0 Z`}
          stroke="var(--color-gold)"
          strokeWidth={7}
          strokeDasharray={DIA_LEN}
        />
      </svg>

      <div data-loader-meta className="absolute inset-x-0 bottom-[6vh] flex items-end justify-between px-[var(--gutter)]">
        <span className="font-display text-sm italic text-ink-soft">Exquisite lawn and grand banquets</span>
        <span className="display text-[40px] tabular-nums leading-none text-ink">
          <span ref={count}>00</span>
        </span>
      </div>
    </div>
  );
}
