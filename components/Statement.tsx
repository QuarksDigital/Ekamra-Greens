"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Part = { t: string; italic?: boolean } | { img: string; alt: string };

// The headline carries small photo capsules between its words, like an
// editorial spread, so image and statement read as one sentence.
const LINES: Part[][] = [
  [{ t: "Every" }, { img: "/img/entrance-florals.webp", alt: "A floral gateway" }, { t: "celebration" }],
  [{ t: "deserves a" }, { img: "/img/couple.webp", alt: "A bride and groom on stage" }, { t: "setting", italic: true }],
  [{ t: "worth" }, { img: "/img/night-tree-lights.webp", alt: "The lawn's tree lit at night" }, { t: "remembering.", italic: true }],
];

export default function Statement() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-line]").forEach((line) => {
        const inner = line.querySelector("[data-line-inner]");
        const caps = line.querySelectorAll("[data-cap]");
        const imgs = line.querySelectorAll("[data-cap-img]");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: line, start: "top 92%", end: "top 45%", scrub: 0.6 },
        });
        tl.fromTo(inner, { yPercent: 105 }, { yPercent: 0, duration: 1, ease: "power2.out" }, 0)
          .fromTo(caps, { width: "0.9em" }, { width: "2.1em", duration: 1 }, 0.15)
          .fromTo(imgs, { scale: 1.4 }, { scale: 1, duration: 1 }, 0.15);
      });
      gsap.fromTo(
        "[data-after]",
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-after]", start: "top 95%", end: "top 70%", scrub: 0.6 },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="bg-paper px-[var(--gutter)] pb-[12vh] pt-[18vh] text-center">
      <h2 className="display mx-auto max-w-[16ch] text-[clamp(40px,7.2vw,116px)] leading-[1.02] text-ink md:max-w-none">
        {LINES.map((line, i) => (
          <span key={i} data-line className="block overflow-hidden pb-[0.08em]">
            <span data-line-inner className="inline-flex flex-wrap items-center justify-center gap-x-[0.22em]">
              {line.map((p, j) =>
                "img" in p ? (
                  <span
                    key={j}
                    data-cap
                    className="relative inline-block h-[0.74em] w-[2.1em] shrink-0 overflow-hidden rounded-full align-middle"
                  >
                    <span data-cap-img className="absolute inset-0 block">
                      <Image src={p.img} alt={p.alt} fill sizes="240px" className="object-cover" />
                    </span>
                  </span>
                ) : (
                  <span key={j}>{p.italic ? <em>{p.t}</em> : p.t}</span>
                ),
              )}
            </span>
          </span>
        ))}
      </h2>

      <div data-after className="mx-auto mt-[6vh] flex max-w-3xl flex-col items-center gap-7">
        <p className="max-w-[52ch] text-base leading-relaxed text-ink-soft md:text-[17px]">
          On Infosys Avenue in Chandrasekharpur, Ekamra Greens brings together an open green lawn, a grand
          banquet hall and rooms for your family, so every ritual of your celebration can happen in one
          beautiful place.
        </p>
        <a href="#visit" className="pill">
          <em>Book a</em> site visit
        </a>
      </div>
    </section>
  );
}
