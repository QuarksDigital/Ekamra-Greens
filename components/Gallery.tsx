"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { CONTACT } from "@/lib/content";

type Tile = { name: string; alt: string; tall?: boolean };

// Ordered for rhythm: real celebrations interleaved with the venue in detail.
const TILES: Tile[] = [
  { name: "aerial-bride-trail", alt: "The bride in a flowing red veil walks through candle-bearers, seen from above" },
  { name: "aisle-couple", alt: "The bride and groom beneath chandeliers in a golden arched aisle", tall: true },
  { name: "hall-chandelier", alt: "A round chandelier set into the banquet ceiling" },
  { name: "entrance-arch-tunnel", alt: "A red arched tunnel of lights under a canopy of greenery and chandeliers" },
  { name: "haldi-dance", alt: "The couple dancing among guests in yellow at the haldi" },
  { name: "lawn-stage-red", alt: "A red arched stage glowing on the lawn at night", tall: true },
  { name: "entrance-florals", alt: "A floral gateway on the lawn" },
  { name: "mandap-gold", alt: "A golden latticed mandap hung with marigolds on the lawn at night" },
  { name: "varmala-stage", alt: "The varmala on a floral stage, dancers and sparklers either side" },
  { name: "bride-portrait", alt: "The bride in a red lehenga among palms", tall: true },
  { name: "corridor", alt: "A floral entrance corridor with chandeliers" },
  { name: "reception-stage", alt: "Cold pyros rise either side of the couple on the reception stage" },
  { name: "decor-objects", alt: "Brass and wooden decor pieces" },
  { name: "groom-dancers", alt: "The groom walks in flanked by dancers in red", tall: true },
  { name: "banquet-facade", alt: "The banquet building among palms" },
  { name: "baraat-car", alt: "The groom arrives standing in a flower-decked open car" },
  { name: "lawn-bar", alt: "A round bar lit up on the lawn at night" },
  { name: "lawn-balcony", alt: "The lawn seen from a first-floor balcony" },
  { name: "aerial-venue-wide", alt: "Ekamra Greens from high above, lights along its length", tall: true },
  { name: "pink-canopy-walk", alt: "A walkway under pink and white drapes, set with flowers" },
  { name: "haldi-steps", alt: "Steps dressed in marigolds and yellow lattice for the haldi" },
  { name: "lawn-dining", alt: "Dinner tables under chandelier frames on the lawn at night" },
  { name: "photo-booth", alt: "A pink photo booth wrapped in marigolds" },
  { name: "couple-entry", alt: "The couple makes their entrance through fog and fountains of sparks" },
  { name: "arrival-sign", alt: "The Ekamra Greens signboard at the gate" },
  { name: "garden-walk", alt: "A paved garden walk lined with plants" },
  { name: "haldi-smoke", alt: "The couple firing colour-smoke cannons at the haldi" },
];

// Deal tiles into columns, always topping up the shortest one, so columns end level.
function balance(tiles: Tile[], n: number) {
  const cols: Tile[][] = Array.from({ length: n }, () => []);
  const h = new Array(n).fill(0);
  for (const t of tiles) {
    const i = h.indexOf(Math.min(...h));
    cols[i].push(t);
    h[i] += t.tall ? 16 / 9 : 3 / 4;
  }
  return cols;
}

const DESKTOP = balance(TILES, 4);
const MOBILE = balance(TILES, 2);
const DRIFT = [8, -6, 12, -9];

function Column({ tiles, drift, sizes }: { tiles: Tile[]; drift: number; sizes: string }) {
  return (
    <div data-drift={drift} className="flex flex-col gap-[clamp(10px,1.6vw,24px)] will-change-transform">
      {tiles.map((t) => (
        <figure
          key={t.name}
          className={`group relative overflow-hidden bg-paper-deep ${t.tall ? "aspect-[9/16]" : "aspect-[4/3]"}`}
        >
          <Image
            src={`/img/${t.name}.webp`}
            alt={t.alt}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
        </figure>
      ))}
    </div>
  );
}

export default function Gallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((col) => {
        const amt = Number(col.dataset.drift);
        gsap.fromTo(
          col,
          { yPercent: amt * 0.5 },
          {
            yPercent: -amt * 0.5,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" ref={root} className="relative overflow-x-clip bg-paper px-[var(--gutter)] pb-[18vh] pt-[14vh]">
      <div className="mb-[9vh] flex flex-col items-center text-center">
        <h2 className="display text-[clamp(44px,7.4vw,110px)]">
          Our
          <br />
          evenings
        </h2>
        <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ink-soft md:text-[17px]">
          Real celebrations on the lawn and in the hall, from the haldi's colour to the details on
          every stage.
        </p>
      </div>

      <div className="hidden grid-cols-4 gap-[clamp(10px,1.6vw,24px)] md:grid">
        {DESKTOP.map((col, i) => (
          <Column key={i} tiles={col} drift={DRIFT[i]} sizes="25vw" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-[10px] md:hidden">
        {MOBILE.map((col, i) => (
          <Column key={i} tiles={col} drift={DRIFT[i]} sizes="50vw" />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 pb-[18vh] pt-[40vh]">
        <div className="sticky top-[calc(50vh-21px)] flex justify-center">
          <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="pill pointer-events-auto">
            <em>See more on</em> Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
