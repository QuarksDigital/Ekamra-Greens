"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

// One Lenis instance drives the page; GSAP's ticker owns the frame loop so
// ScrollTrigger scrubs stay locked to the smoothed scroll position.
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Pinned sections add their scroll length after Lenis first measures the
    // page, so re-measure whenever ScrollTrigger lays the page out again.
    let raf = 0;
    const remeasure = () => {
      lenis.resize();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => lenis.resize());
    };
    ScrollTrigger.addEventListener("refresh", remeasure);
    const bodyWatch = new ResizeObserver(remeasure);
    bodyWatch.observe(document.body);
    // Refresh once the pinned sections below have mounted, and again on load.
    // Timers, not animation frames, so this also runs in a background tab.
    const onLoad = () => ScrollTrigger.refresh();
    const settle = window.setTimeout(onLoad, 400);
    if (document.readyState !== "complete") window.addEventListener("load", onLoad, { once: true });

    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.6 });
    };
    document.addEventListener("click", onAnchor);

    return () => {
      document.removeEventListener("click", onAnchor);
      ScrollTrigger.removeEventListener("refresh", remeasure);
      bodyWatch.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      window.clearTimeout(settle);
      gsap.ticker.remove(tick);
      lenis.destroy();
      const w = window as unknown as { __lenis?: Lenis };
      if (w.__lenis === lenis) delete w.__lenis;
    };
  }, []);

  return null;
}
