"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// Asymmetric grid: one tall anchor image, two columns that drift at their own pace.
export default function Rituals() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
        const amt = Number(el.dataset.drift);
        gsap.fromTo(
          el,
          { yPercent: amt },
          {
            yPercent: -amt,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative bg-paper px-[var(--gutter)] pb-[16vh] pt-[18vh]">
      <p className="text-center font-display text-sm italic text-ink-soft">
        a venue made for <span className="not-italic tracking-[0.08em]">GATHERING</span>
      </p>
      <h2 className="display mt-4 text-center text-[clamp(46px,8vw,120px)]">
        <em>Room for</em> every
        <br />
        ritual.
      </h2>

      <div className="mt-[10vh] grid grid-cols-2 gap-[10px] md:grid-cols-[1.35fr_0.8fr_0.8fr]">
        <figure className="relative col-span-2 aspect-[4/5] overflow-hidden md:col-span-1 md:row-span-2 md:aspect-auto">
          <Image src="/img/stage-seat.webp" alt="A floral stage with a vintage sofa" fill sizes="(min-width:768px) 46vw, 100vw" className="object-cover" />
        </figure>

        <div data-drift="6" className="flex flex-col gap-[10px]">
          <figure className="relative aspect-[3/4] overflow-hidden">
            <Image src="/img/couple.webp" alt="A bride and groom exchange garlands on a floral stage" fill sizes="(min-width:768px) 27vw, 50vw" className="object-cover object-[62%_50%]" />
          </figure>
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="relative aspect-[3/4] w-[46%] overflow-hidden">
              <Image src="/img/lamps.webp" alt="Brass lamps and florals on a console" fill sizes="14vw" className="object-cover" />
            </div>
            <a href="#spaces" className="pill">
              <em>Discover the</em> spaces
            </a>
          </div>
        </div>

        <div data-drift="14" className="flex flex-col gap-[10px]">
          <figure className="relative aspect-[3/4] overflow-hidden">
            <Image src="/img/table-setting.webp" alt="A dressed round table with gold chairs" fill sizes="(min-width:768px) 27vw, 50vw" className="object-cover" />
          </figure>
          <figure className="relative aspect-[3/4] overflow-hidden">
            <Image src="/img/night-tree-lights.webp" alt="The old tree on the lawn strung with lights at night" fill sizes="(min-width:768px) 27vw, 50vw" className="object-cover" />
          </figure>
        </div>
      </div>
    </section>
  );
}
