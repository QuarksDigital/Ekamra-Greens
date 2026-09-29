"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Mode = "idle" | "link" | "drag";

// A dot that tracks the pointer exactly and a ring that follows with inertia.
// Blends by difference so it reads on paper and on photographs alike.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return;
    document.documentElement.classList.add("has-cursor");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    let visible = false;
    let mode: Mode = "idle";
    let pressed = false;

    const setDot = gsap.quickSetter(dot.current, "css") as (v: object) => void;
    const setRing = gsap.quickSetter(ring.current, "css") as (v: object) => void;

    const apply = () => {
      const r = ring.current!;
      const size = mode === "drag" ? 76 : mode === "link" ? 58 : 34;
      gsap.to(r, {
        width: size,
        height: size,
        backgroundColor: mode === "drag" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
        scale: pressed ? 0.86 : 1,
        duration: 0.45,
        ease: "expo.out",
      });
      gsap.to(dot.current, { autoAlpha: visible && mode === "idle" ? 1 : 0, duration: 0.2 });
      gsap.to(label.current, { autoAlpha: mode === "drag" ? 1 : 0, duration: 0.2 });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        gsap.to([ring.current], { autoAlpha: 1, duration: 0.3 });
        apply();
      }
      setDot({ x: pos.x, y: pos.y });
      const t = (e.target as HTMLElement | null)?.closest?.("[data-cursor], a, button, [role=button], label, summary");
      const next: Mode = !t ? "idle" : t.getAttribute("data-cursor") === "drag" ? "drag" : "link";
      if (next !== mode) {
        mode = next;
        apply();
      }
    };
    const onLeave = () => {
      visible = false;
      gsap.to([ring.current, dot.current], { autoAlpha: 0, duration: 0.25 });
    };
    const onDown = () => {
      pressed = true;
      apply();
    };
    const onUp = () => {
      pressed = false;
      apply();
    };

    const follow = () => {
      // Frame-rate independent easing toward the pointer: the inertia.
      const k = 1 - Math.pow(1 - 0.16, gsap.ticker.deltaRatio());
      ringPos.x += (pos.x - ringPos.x) * k;
      ringPos.y += (pos.y - ringPos.y) * k;
      setRing({ x: ringPos.x, y: ringPos.y });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    gsap.ticker.add(follow);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      gsap.ticker.remove(follow);
    };
  }, []);

  return (
    <div aria-hidden className="cursor-layer pointer-events-none fixed inset-0 z-[300] mix-blend-difference">
      <div
        ref={ring}
        className="invisible absolute left-0 top-0 grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white opacity-0"
      >
        <span ref={label} className="label invisible text-[10px] tracking-[0.16em] text-black opacity-0">
          Drag
        </span>
      </div>
      <div
        ref={dot}
        className="invisible absolute left-0 top-0 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0"
      />
    </div>
  );
}
