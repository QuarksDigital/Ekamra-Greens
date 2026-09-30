"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Part = { t: string; italic?: boolean } | { img: string; alt: string };

// The headline carries small photo capsules between its words, like an
// editorial spread, so image and statement read as one sentence.
const LINES: Part[][] = [
  [{ t: "Every" }, { img: "/img/haldi-colours.webp", alt: "The couple dancing through clouds of haldi colour" }, { t: "celebration" }],
  [{ t: "deserves a" }, { img: "/img/white-stage.webp", alt: "A white arched wedding stage lit at night" }, { t: "setting", italic: true }],
  [{ t: "worth" }, { img: "/img/aisle-walk.webp", alt: "The bride and groom walking down a floral aisle" }, { t: "remembering.", italic: true }],
];

// Keep each photo on the same line as the word before it.
function group(line: Part[]) {
  const out: Part[][] = [];
  for (const p of line) {
    if ("img" in p && out.length) out[out.length - 1].push(p);
    else out.push([p]);
  }
  return out;
}

export default function Statement() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    // Wide screens: the capsules grow in width and push the words apart. Phones:
    // the capsule keeps its full size and the photo opens inside it instead, so
    // the lines never re-wrap mid-scroll.
    mm.add({ wide: "(min-width: 768px)", narrow: "(max-width: 767px)" }, (c) => {
      const { wide } = c.conditions as { wide: boolean };
      gsap.utils.toArray<HTMLElement>("[data-line]").forEach((line) => {
        const inner = line.querySelector("[data-line-inner]");
        const caps = line.querySelectorAll("[data-cap]");
        const imgs = line.querySelectorAll("[data-cap-img]");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: line, start: "top 92%", end: "top 45%", scrub: 0.6 },
        });
        tl.fromTo(inner, { yPercent: 105 }, { yPercent: 0, duration: 1, ease: "power2.out" }, 0);
        if (wide) tl.fromTo(caps, { width: "0.9em" }, { width: "2.1em", duration: 1 }, 0.15);
        else
          tl.fromTo(
            caps,
            { clipPath: "inset(0% 28.5% round 999px)" },
            { clipPath: "inset(0% 0% round 999px)", duration: 1 },
            0.15,
          );
        tl.fromTo(imgs, { scale: 1.4 }, { scale: 1, duration: 1 }, 0.15);
      });
    }, root);
    const ctx = gsap.context(() => {
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
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} className="bg-paper px-[var(--gutter)] pb-[12vh] pt-[18vh] text-center">
      <h2 className="display mx-auto max-w-[16ch] text-[clamp(28px,10.4vw,40px)] leading-[1.02] text-ink md:max-w-none md:text-[clamp(40px,7.2vw,116px)]">
        {LINES.map((line, i) => (
          <span key={i} data-line className="block overflow-hidden pb-[0.08em]">
            <span data-line-inner className="inline-flex flex-wrap items-center justify-center gap-x-[0.22em]">
              {group(line).map((g, j) => (
                <span key={j} className="inline-flex items-center gap-x-[0.22em] whitespace-nowrap">
                  {g.map((p, k) =>
                    "img" in p ? (
                      <span
                        key={k}
                        data-cap
                        className="relative inline-block h-[0.74em] w-[2.1em] shrink-0 overflow-hidden rounded-full align-middle"
                      >
                        <span data-cap-img className="absolute inset-0 block">
                          <Image src={p.img} alt={p.alt} fill sizes="240px" className="object-cover" />
                        </span>
                      </span>
                    ) : (
                      <span key={k}>{p.italic ? <em>{p.t}</em> : p.t}</span>
                    ),
                  )}
                </span>
              ))}
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
