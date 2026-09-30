"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SRC = "/sound/bgMusic.mp3";
const VOLUME = 0.4;
const KEY = "ekamra:sound";

// The visitor's saved choice, read from storage without a render round-trip.
const listeners = new Set<() => void>();
const pref = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    try {
      return localStorage.getItem(KEY) !== "off";
    } catch {
      return true;
    }
  },
  set(value: boolean) {
    try {
      localStorage.setItem(KEY, value ? "on" : "off");
    } catch {}
    listeners.forEach((fn) => fn());
  },
};

// Background score. Sound is on by default and starts as the loading screen
// lifts; if the browser blocks unmuted autoplay, it starts on the visitor's
// first tap, click or key press instead. The choice to mute is remembered.
export default function Music() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const wantOn = useRef(true);
  const fade = useRef(0);
  const on = useSyncExternalStore(pref.subscribe, pref.get, () => true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    wantOn.current = pref.get();

    const el = new Audio(SRC);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    audio.current = el;
    el.addEventListener("play", () => setPlaying(true));
    el.addEventListener("pause", () => setPlaying(false));

    const gestures = ["pointerdown", "keydown", "touchend"] as const;
    const onGesture = () => {
      removeGestures();
      if (wantOn.current && el.paused) start();
    };
    const addGestures = () => gestures.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));
    const removeGestures = () => gestures.forEach((g) => window.removeEventListener(g, onGesture));

    const start = () => {
      el.play().then(
        () => rampTo(VOLUME),
        () => addGestures(),
      );
    };

    const onEntered = () => {
      if (wantOn.current) start();
    };
    window.addEventListener("ekamra:entered", onEntered);

    // Quiet while the tab is hidden, back when it returns.
    let resume = false;
    const onVisibility = () => {
      if (document.hidden) {
        resume = !el.paused;
        el.pause();
      } else if (resume && wantOn.current) {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("ekamra:entered", onEntered);
      document.removeEventListener("visibilitychange", onVisibility);
      removeGestures();
      cancelAnimationFrame(fade.current);
      el.pause();
      el.src = "";
      audio.current = null;
    };
  }, []);

  function rampTo(target: number, then?: () => void) {
    const el = audio.current;
    if (!el) return;
    cancelAnimationFrame(fade.current);
    const from = el.volume;
    const t0 = performance.now();
    const ms = 900;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = from + (target - from) * k;
      if (k < 1) fade.current = requestAnimationFrame(step);
      else then?.();
    };
    fade.current = requestAnimationFrame(step);
  }

  function toggle() {
    const el = audio.current;
    if (!el) return;
    const next = !on;
    wantOn.current = next;
    pref.set(next);
    if (next) {
      el.play().then(() => rampTo(VOLUME), () => {});
    } else {
      rampTo(0, () => el.pause());
    }
  }

  const sounding = on && playing;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute background music" : "Play background music"}
      className="pill fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-[var(--gutter)] z-50 !h-[42px] !w-[42px] justify-center !p-0"
    >
      <span className="flex h-[14px] items-end gap-[2.5px]" aria-hidden>
        {[0.55, 1, 0.7, 0.9].map((h, i) => (
          <span
            key={i}
            className={`sound-bar block w-[2px] rounded-full bg-current ${sounding ? "is-on" : ""}`}
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.14}s` }}
          />
        ))}
      </span>
    </button>
  );
}
