"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const STEPS = [
  {
    word: "arrival",
    src: "/img/entry-door.webp",
    alt: "The floral entrance to the Ekamra Greens banquet",
    note: "Guests arrive through florals, lamplight and a shaded drive.",
  },
  {
    word: "lawn",
    src: "/img/tent-night.webp",
    alt: "A lit canopy on the lawn at night",
    note: "The lawn turns golden after sunset, ready for the pheras.",
  },
  {
    word: "banquet",
    src: "/img/hall-axis.webp",
    alt: "The long banquet hall under chandeliers",
    note: "Inside, the grand hall carries the celebration into the night.",
  },
];

export default function Stepper() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const panes = gsap.utils.toArray<HTMLElement>("[data-pane]");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (STEPS.length + 0.4)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (st) => setActive(Math.min(STEPS.length - 1, Math.floor(st.progress * STEPS.length * 0.999 + 0.15))),
        },
      });
      panes.forEach((pane, i) => {
        if (i === 0) return;
        const img = pane.querySelector("[data-img]");
        tl.fromTo(pane, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i - 1 + 0.2)
          .fromTo(img, { xPercent: 18, scale: 1.12 }, { xPercent: 0, scale: 1, duration: 1 }, i - 1 + 0.2)
          .to(panes[i - 1].querySelector("[data-img]"), { xPercent: -12, duration: 1 }, i - 1 + 0.2);
      });
      tl.to({}, { duration: 0.4 });
    }, root);
    return () => ctx.revert();
  }, []);

  // Plain wrapper: GSAP pins the section inside it, so React never loses track of its node.
  return (
    <div>
      <section id="moments" ref={root} className="relative h-svh overflow-hidden bg-ink text-paper">
        {STEPS.map((s, i) => (
          <div key={s.word} data-pane className="absolute inset-0 overflow-hidden" style={{ zIndex: i }}>
            <div data-img className="absolute inset-0 will-change-transform">
              <Image src={s.src} alt={s.alt} fill sizes="100vw" className="object-cover" priority={i === 0} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(20_8_6/0.7),rgb(20_8_6/0.05)_55%)]" />
          </div>
        ))}

        <ol className="absolute left-[var(--gutter)] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li
              key={s.word}
              className={`h-[6px] w-[6px] rounded-full transition-all duration-500 ${
                i === active ? "scale-[1.35] bg-paper" : "bg-paper/40"
              }`}
            >
              <span className="sr-only">{s.word}</span>
            </li>
          ))}
        </ol>

        <div className="absolute inset-x-0 bottom-0 z-10 px-[var(--gutter)] pb-[5vh] text-center">
          <p className="mx-auto mb-5 max-w-[40ch] text-[15px] font-medium text-paper/90 md:text-base" aria-live="polite">
            {STEPS[active].note}
          </p>
          <h2 className="display text-[clamp(28px,4.3vw,68px)] leading-[1.02] md:whitespace-nowrap">
            <em className="text-paper/60">From</em>{" "}
            <span className={active === 0 ? "text-paper" : "text-paper/45"}>arrival,</span>{" "}
            <em className="text-paper/60">to the</em>{" "}
            <span className={active === 1 ? "text-paper" : "text-paper/45"}>lawn,</span>{" "}
            <em className="text-paper/60">to the</em>{" "}
            <span className={active === 2 ? "text-paper" : "text-paper/45"}>banquet.</span>
          </h2>
        </div>
      </section>
    </div>
  );
}
