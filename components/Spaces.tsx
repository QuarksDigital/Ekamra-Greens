"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { OCCASIONS, SPACES } from "@/lib/content";

export default function Spaces() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
        const img = row.querySelector("[data-row-img]");
        gsap.fromTo(
          img,
          { clipPath: "inset(18% 18% 18% 18%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: { trigger: row, start: "top 85%", end: "top 35%", scrub: 0.6 },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="spaces" ref={root} className="bg-paper px-[var(--gutter)] pb-[14vh] pt-[12vh]">
      <div className="flex flex-col items-center text-center">
        <p className="font-display text-sm italic text-ink-soft">
          three spaces, <span className="not-italic tracking-[0.08em]">ONE ADDRESS</span>
        </p>
        <h2 className="display mt-4 text-[clamp(44px,7.4vw,110px)]">
          The <em>grounds</em>
        </h2>
      </div>

      <div className="mt-[9vh] border-t border-ink/15">
        {SPACES.map((s, i) => (
          <article
            key={s.name}
            data-row
            className="grid gap-6 border-b border-ink/15 py-10 md:grid-cols-[1.1fr_1fr_0.9fr] md:items-center md:gap-10 md:py-14"
          >
            <div>
              <span className="font-display text-sm italic text-crimson">{`${i + 1} of ${SPACES.length}`}</span>
              <h3 className="display mt-2 text-[clamp(40px,5.2vw,76px)]">{s.name}</h3>
              <p className="mt-2 font-display text-lg italic text-ink-soft">{s.accent}</p>
            </div>
            <p className="max-w-[46ch] text-base leading-relaxed text-ink-soft md:text-[17px]">{s.body}</p>
            <div data-row-img className="relative aspect-[4/3] overflow-hidden">
              <Image src={s.image} alt={s.alt} fill sizes="(min-width:768px) 30vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] hover:scale-[1.04]" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-[10vh] text-center">
        <p className="label text-ink-soft">Celebrations we host</p>
        <ul className="mx-auto mt-6 flex max-w-5xl flex-wrap items-baseline justify-center gap-x-6 gap-y-2 font-display text-[clamp(22px,2.8vw,38px)]">
          {OCCASIONS.map((o, i) => (
            <li key={o} className="flex items-baseline gap-6">
              <span className={i % 2 ? "italic" : "uppercase tracking-[-0.01em]"}>{o}</span>
              {i < OCCASIONS.length - 1 && <span className="text-gold" aria-hidden>◆</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
