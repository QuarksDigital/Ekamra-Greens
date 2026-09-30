"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import Emblem from "./Emblem";

const FRAME_COUNT = 328;
const src = (i: number) => `/hero/f/${String(i).padStart(3, "0")}.webp`;

// Coarse-to-fine load order: every 32nd frame first, then 16th, 8th ... so an
// early scrub already has evenly spaced frames to show while the rest arrive.
function loadOrder(n: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  for (let step = 32; step >= 1; step = step / 2) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLParagraphElement>(null);
  const outro = useRef<HTMLParagraphElement>(null);
  const shade = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cvs = canvas.current!;
    const ctx = cvs.getContext("2d")!;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    const ready: boolean[] = new Array(FRAME_COUNT).fill(false);
    const state = { f: 0 };
    let drawn = -1;
    let cancelled = false;

    const nearestReady = (target: number) => {
      if (ready[target]) return target;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (target - d >= 0 && ready[target - d]) return target - d;
        if (target + d < FRAME_COUNT && ready[target + d]) return target + d;
      }
      return -1;
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const { clientWidth: w, clientHeight: h } = cvs;
      cvs.width = Math.round(w * dpr);
      cvs.height = Math.round(h * dpr);
      drawn = -1;
      draw();
    };

    const draw = () => {
      const target = Math.round(state.f);
      const i = nearestReady(target);
      if (i < 0 || i === drawn) return;
      const img = images[i];
      const cw = cvs.width;
      const ch = cvs.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = i;
    };

    // Stream frames in, with a small pool so the first frame lands fast.
    const order = loadOrder(FRAME_COUNT);
    let cursor = 0;
    // The loading screen waits for this coarse pass: enough frames to scrub smoothly.
    const COARSE = 24;
    let settled = 0;
    const report = () => {
      settled++;
      window.dispatchEvent(new CustomEvent("ekamra:progress", { detail: Math.min(1, settled / COARSE) }));
    };
    const pump = () => {
      if (cancelled || cursor >= order.length) return;
      const i = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.onload = () => {
        images[i] = img;
        ready[i] = true;
        report();
        if (Math.abs(i - Math.round(state.f)) <= Math.abs(drawn - Math.round(state.f)) || drawn < 0) {
          drawn = -1;
          draw();
        }
        pump();
      };
      img.onerror = () => {
        report();
        pump();
      };
      images[i] = img;
    };
    for (let k = 0; k < 6; k++) pump();

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(cvs);

    if (prefersReducedMotion()) {
      gsap.set(frame.current, { clipPath: "inset(0px 0px 0px 0px)" });
      return () => {
        cancelled = true;
        ro.disconnect();
      };
    }

    const ctxGsap = gsap.context(() => {
      // Phones keep the film full-bleed, top to bottom, the whole way through;
      // the framed open and close only suit wide screens.
      const phone = () => window.innerWidth < 768;
      const FULL = "inset(0px 0px 0px 0px)";
      const startInset = () => {
        if (phone()) return FULL;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const side = Math.max(24, w * 0.07);
        return `inset(76px ${side}px ${h * 0.07}px ${side}px)`;
      };
      const endInset = () => {
        if (phone()) return FULL;
        const w = window.innerWidth;
        const h = window.innerHeight;
        return `inset(${h * 0.16}px ${w * 0.2}px ${h * 0.24}px ${w * 0.2}px)`;
      };

      gsap.set(frame.current, { clipPath: startInset() });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 5.2}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. The frame opens to full bleed; the name steps back.
      tl.fromTo(frame.current, { clipPath: startInset }, { clipPath: "inset(0px 0px 0px 0px)", duration: 1 }, 0)
        .fromTo(media.current, { scale: 1.1 }, { scale: 1, duration: 1 }, 0)
        .to(title.current, { autoAlpha: 0, yPercent: -18, filter: "blur(10px)", duration: 0.7 }, 0)
        .to(cue.current, { autoAlpha: 0, duration: 0.3 }, 0)
        // 2. Only once it is full does the walk play, bound to the scroll.
        .to(state, { f: FRAME_COUNT - 1, duration: 6, onUpdate: draw }, 1)
        // 3. The film settles, shrinks and is carried away up the page.
        .to(frame.current, { clipPath: endInset, duration: 1.1 }, 7.1)
        .to(media.current, { scale: 1.06, duration: 1.1 }, 7.1)
        .fromTo(shade.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 7.2)
        .fromTo(outro.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 7.4);
    }, section);

    return () => {
      cancelled = true;
      ro.disconnect();
      ctxGsap.revert();
    };
  }, []);

  // Plain wrapper: GSAP pins the section inside it, so React never loses track of its node.
  return (
    <div>
    <section id="top" ref={section} className="relative h-lvh w-full overflow-hidden bg-paper" aria-label="Ekamra Greens">
      <div ref={frame} className="absolute inset-0 overflow-hidden will-change-[clip-path]">
        <div ref={media} className="absolute inset-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(0)} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(27_10_8/0.05)_0%,rgb(27_10_8/0.45)_100%)]" />
        </div>
        {/* Phones: the closing line sits on the film, so darken its foot */}
        <div
          ref={shade}
          className="invisible absolute inset-0 bg-[linear-gradient(to_top,rgb(20_8_6/0.8),rgb(20_8_6/0)_50%)] opacity-0 md:hidden"
        />

        <div
          ref={title}
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center text-paper"
        >
          <Emblem className="h-14 w-14 md:h-[72px] md:w-[72px]" ring="var(--color-paper)" strokeWidth={10} />
          <h1 className="display text-[clamp(44px,8.5vw,128px)] [text-shadow:0_2px_30px_rgb(20_6_4/0.35)]">
            Ekamra Greens
          </h1>
          <p className="font-display text-[clamp(17px,1.7vw,24px)] italic tracking-[0.01em] text-paper/90">
            Exquisite lawn and grand banquets
          </p>
        </div>
      </div>

      <p
        ref={cue}
        className="label absolute bottom-[3.2vh] left-1/2 hidden -translate-x-1/2 text-ink-soft md:block"
      >
        Scroll to walk in
      </p>
      <p
        ref={outro}
        className="invisible absolute bottom-[calc(8vh+100lvh-100svh)] left-1/2 w-[min(90vw,720px)] -translate-x-1/2 text-center font-display text-[clamp(22px,2.6vw,38px)] leading-tight text-paper opacity-0 [text-shadow:0_2px_24px_rgb(20_6_4/0.5)] md:text-ink md:[text-shadow:none]"
      >
        Your celebration, <em>from the first step</em> to the last vow.
      </p>
    </section>
    </div>
  );
}
