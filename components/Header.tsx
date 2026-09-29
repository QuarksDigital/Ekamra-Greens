"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import Emblem from "./Emblem";
import { CONTACT, NAV } from "@/lib/content";

export default function Header() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    if (open) {
      lenis?.stop();
      gsap.set(el, { display: "grid" });
      gsap.fromTo(
        el,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" },
      );
      gsap.fromTo(
        el.querySelectorAll("[data-menu-item]"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.05, delay: 0.1 },
      );
      firstLink.current?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      gsap.to(el, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.6,
        ease: "expo.inOut",
        onComplete: () => gsap.set(el, { display: "none" }),
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[var(--gutter)] pt-[18px]">
        <button
          type="button"
          className="pill pointer-events-auto"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <a href="#visit" className="pill pointer-events-auto" onClick={() => setOpen(false)}>
          <em>Plan your</em> celebration
        </a>
      </header>

      <div
        id="site-menu"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="fixed inset-0 z-40 hidden grid-rows-[1fr_auto] bg-wine px-[var(--gutter)] pb-8 pt-28 text-paper"
        style={{ clipPath: "inset(0% 0% 100% 0%)" }}
      >
        <nav className="flex flex-col justify-center gap-1 md:gap-2">
          {NAV.map((item, i) => (
            <div key={item.href} className="overflow-hidden">
              <a
                ref={i === 0 ? firstLink : undefined}
                data-menu-item
                href={item.href}
                onClick={() => setOpen(false)}
                className="display group flex items-baseline gap-4 text-[clamp(44px,8.4vw,120px)] no-underline transition-colors duration-500 hover:text-gold"
              >
                <span>{item.label}</span>
                <em className="font-display text-[0.32em] opacity-60 transition-opacity group-hover:opacity-100">
                  {item.note}
                </em>
              </a>
            </div>
          ))}
        </nav>
        <div className="grid gap-6 border-t border-paper/20 pt-6 text-sm md:grid-cols-[auto_1fr_auto] md:items-end">
          <Emblem className="h-12 w-12" ring="var(--color-paper)" strokeWidth={10} />
          <p className="max-w-md leading-relaxed text-paper/75">{CONTACT.address}</p>
          <div className="flex flex-col gap-1 md:items-end">
            <a href={CONTACT.phoneHref} className="hover:text-gold">
              {CONTACT.phone}
            </a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="hover:text-gold">
              Instagram ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
