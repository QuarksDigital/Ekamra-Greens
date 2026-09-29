"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { CONTACT } from "@/lib/content";

type Tile = { name: string; alt: string; tall?: boolean };

// Ordered for rhythm: aerial views of real evenings interleaved with the venue in detail.
const TILES: Tile[] = [
  { name: "aerial-bride-trail", alt: "The bride in a flowing red veil walks through candle-bearers, seen from above" },
  { name: "aerial-lawn-stage", alt: "The lawn full of guests with the stage glowing at the far end", tall: true },
  { name: "hall-chandelier", alt: "A round chandelier set into the banquet ceiling" },
  { name: "mirror", alt: "A gilded mirror display on the lawn at night" },
  { name: "aerial-crowd-dance", alt: "Guests with flower props dancing around the bride" },
  { name: "aerial-venue-night", alt: "The whole venue lit up at night from above", tall: true },
  { name: "entrance-florals", alt: "A floral gateway on the lawn" },
  { name: "aerial-bride-circle", alt: "Guests gather around the bride on the lawn, seen from above" },
  { name: "tree-night", alt: "The lawn's old tree lit at night" },
  { name: "aerial-stage-lights", alt: "Stage lights beaming over the crowd on the lawn", tall: true },
  { name: "corridor", alt: "A floral entrance corridor with chandeliers" },
  { name: "aerial-guests-torches", alt: "Guests holding torches on the lawn at night" },
  { name: "decor-objects", alt: "Brass and wooden decor pieces" },
  { name: "aerial-lawn-walkway", alt: "The lit walkway and lawn packed with guests", tall: true },
  { name: "banquet-facade", alt: "The banquet building among palms" },
  { name: "aerial-bride-center", alt: "The bride at the centre of a ring of guests and torches" },
  { name: "room-blue", alt: "A guest room with blue cushions" },
  { name: "lawn-balcony", alt: "The lawn seen from a first-floor balcony" },
  { name: "aerial-venue-wide", alt: "Ekamra Greens from high above, lights along its length", tall: true },
  { name: "hall-long", alt: "The length of the banquet hall" },
  { name: "aerial-bride-lawn", alt: "Overhead view of the bride crossing the lit lawn" },
  { name: "lawn-wide", alt: "A wide view across the green lawn" },
  { name: "table-setting", alt: "A round table dressed for dinner" },
  { name: "parking-forecourt", alt: "The paved parking forecourt at the Ekamra Greens gate" },
  { name: "arrival-sign", alt: "The Ekamra Greens signboard at the gate" },
  { name: "garden-walk", alt: "A paved garden walk lined with plants" },
  { name: "lawn-side", alt: "Hedges and trees along the lawn" },
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
          <em>From</em> our
          <br />
          evenings
        </h2>
        <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ink-soft md:text-[17px]">
          Real celebrations on the lawn and in the hall, from the drone above the crowd to the details on
          every table.
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
