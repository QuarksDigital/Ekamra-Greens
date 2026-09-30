"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import Emblem from "./Emblem";

const FRAME_COUNT = 328;
// The film's own frame rate: once scrolling starts it keeps playing at this pace.
const FPS = 24;
// Intro timing in seconds at normal pace: the frame opens, then the film runs.
const OPEN = 1.2;
const FILM_START = OPEN;
const FILM_END = FILM_START + (FRAME_COUNT - 1) / FPS;
// Brisk scrolling can play the intro up to this much faster than normal (plus 1x).
const MAX_BOOST = 6;
const src = (i: number) => `/hero/f/${String(i).padStart(3, "0")}.webp`;

// Coarse-to-fine load order: every 32nd frame first, then 16th, 8th ... so early
// playback already has evenly spaced frames to show while the rest arrive.
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

    // The intro is a timed sequence, not a scroll length: while it runs the page
    // holds still at the top and scroll input only steers it (direction and
    // speed). It keeps playing on its own between inputs, and once it reaches
    // the end the page scroll is released, so no empty scrolling follows.
    const phone = () => window.innerWidth < 768;
    const FULL = "inset(0px 0px 0px 0px)";
    const startInset = () => {
      if (phone()) return FULL;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const side = Math.max(24, w * 0.07);
      return `inset(76px ${side}px ${h * 0.07}px ${side}px)`;
    };
    // Phones keep the film full-bleed top to bottom; the framed close suits wide screens.
    const endInset = () => {
      if (phone()) return FULL;
      const w = window.innerWidth;
      const h = window.innerHeight;
      return `inset(${h * 0.16}px ${w * 0.2}px ${h * 0.24}px ${w * 0.2}px)`;
    };

    let tl!: gsap.core.Timeline;
    const ctxGsap = gsap.context(() => {
      tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      // 1. The frame opens to full bleed; the name steps back.
      tl.fromTo(frame.current, { clipPath: startInset }, { clipPath: FULL, duration: OPEN, ease: "power2.inOut" }, 0)
        .fromTo(media.current, { scale: 1.1 }, { scale: 1, duration: OPEN, ease: "power2.out" }, 0)
        .to(title.current, { autoAlpha: 0, yPercent: -18, filter: "blur(10px)", duration: OPEN * 0.7 }, 0)
        .to(cue.current, { autoAlpha: 0, duration: 0.3 }, 0)
        // 2. The walk plays at the film's own pace (frames are drawn from the playhead).
        .to({}, { duration: FILM_END - FILM_START }, FILM_START)
        // 3. The film settles and shrinks, and the closing line rises.
        .to(frame.current, { clipPath: endInset, duration: 1.1, ease: "power2.inOut" }, FILM_END + 0.1)
        .to(media.current, { scale: 1.06, duration: 1.1 }, FILM_END + 0.1)
        .fromTo(shade.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, FILM_END + 0.2)
        .fromTo(outro.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, FILM_END + 0.4);
    }, section);
    const END = tl.duration();

    let t = 0; // playhead in seconds
    let dir = 0; // 1 forward, -1 backward, 0 idle
    let boost = 0; // extra playback rate from brisk scrolling, easing back to 0
    let locked = false; // page scroll held while the intro plays
    let entered = false; // the loading screen has lifted

    const render = () => {
      tl.time(t);
      state.f = gsap.utils.clamp(0, FRAME_COUNT - 1, (t - FILM_START) * FPS);
      draw();
    };
    const lock = () => {
      locked = true;
      document.documentElement.style.overflow = "hidden";
    };
    const unlock = () => {
      locked = false;
      document.documentElement.style.overflow = "";
    };
    const atTop = () => window.scrollY <= 2;
    const menuOpen = () => {
      const m = document.getElementById("site-menu");
      return !!m && getComputedStyle(m).display !== "none";
    };

    // Returns true when the input belongs to the intro and must not scroll the page.
    const claim = (down: boolean, amount: number) => {
      if (!entered || menuOpen()) return false;
      if (!locked) {
        // Back at the very top, scrolling can pick the intro up again in either direction.
        if (!atTop() || (down ? t >= END : t <= 0)) return false;
        lock();
      }
      dir = down ? 1 : -1;
      boost = Math.min(MAX_BOOST, boost + amount);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      if (claim(px > 0, Math.min(Math.abs(px), 400) * 0.004)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y; // finger moving up = scrolling down
      touchY = y;
      if (Math.abs(dy) < 1) return;
      if (claim(dy > 0, Math.min(Math.abs(dy), 120) * 0.02)) {
        if (e.cancelable) e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    const KEYS_DOWN = ["ArrowDown", "PageDown", " ", "End"];
    const KEYS_UP = ["ArrowUp", "PageUp", "Home"];
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const down = KEYS_DOWN.includes(e.key);
      if (!down && !KEYS_UP.includes(e.key)) return;
      if (claim(down, 1)) e.preventDefault();
    };

    // An in-page link (menu, "Plan your celebration") skips the intro so the jump works.
    const onAnchor = (e: MouseEvent) => {
      if (!locked) return;
      if (!(e.target as HTMLElement).closest?.('a[href^="#"]')) return;
      t = END;
      dir = 0;
      render();
      unlock();
    };

    const onEntered = () => {
      entered = true;
      if (atTop()) {
        lock();
      } else {
        // Reloaded further down the page: show the intro as already finished.
        t = END;
        render();
      }
    };

    const onResize = () => {
      // Re-measure the framed insets; force the redraw since the playhead may not have moved.
      tl.invalidate();
      tl.render(t, true, true);
    };

    let last = performance.now();
    const play = () => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (!dir) return;
      t = gsap.utils.clamp(0, END, t + dir * (1 + boost) * dt);
      boost *= Math.pow(0.08, dt); // a brisk scroll settles back to normal pace in about a second
      render();
      if (dir > 0 && t >= END) {
        dir = 0;
        unlock();
      } else if (dir < 0 && t <= 0) {
        dir = 0; // back at the title; the page stays put until the next scroll down
      }
    };

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("click", onAnchor, true);
    window.addEventListener("ekamra:entered", onEntered);
    window.addEventListener("resize", onResize);
    gsap.ticker.add(play);
    // Remounted after the loading screen already lifted (e.g. a hot reload): start now.
    if (!document.querySelector(".loader")) onEntered();

    return () => {
      cancelled = true;
      ro.disconnect();
      gsap.ticker.remove(play);
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", onAnchor, true);
      window.removeEventListener("ekamra:entered", onEntered);
      window.removeEventListener("resize", onResize);
      if (locked) unlock();
      ctxGsap.revert();
    };
  }, []);

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
