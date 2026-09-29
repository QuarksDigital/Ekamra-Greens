"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import PUZZLES from "@/lib/puzzles.json";

type Orient = "h" | "v";
type Car = { r: number; c: number; o: Orient };

const N = 6;
const EXIT_ROW = 2;
// Grid placement on the board photo, in % of the board (clears the hedge and wall).
const GX = 9;
const GY = 8;
const GS = 88; // grid side

const SPRITES = ["suv", "maroon", "hatch", "minibus", "truck"];
const NAMES: Record<string, string> = {
  wedding: "Wedding car",
  suv: "Black SUV",
  maroon: "Maroon sedan",
  hatch: "Silver hatchback",
  minibus: "White minibus",
  truck: "Catering truck",
};

const cellsOf = (car: Car) =>
  car.o === "h" ? [[car.r, car.c], [car.r, car.c + 1]] : [[car.r, car.c], [car.r + 1, car.c]];

function occupancy(cars: Car[], skip: number) {
  const g = new Set<string>();
  cars.forEach((car, i) => {
    if (i !== skip) cellsOf(car).forEach(([r, c]) => g.add(`${r},${c}`));
  });
  return g;
}

// How far a car may slide along its lane, in cells, from its current spot.
function range(cars: Car[], i: number) {
  const g = occupancy(cars, i);
  const car = cars[i];
  let lo = 0;
  let hi = 0;
  if (car.o === "h") {
    while (car.c + lo - 1 >= 0 && !g.has(`${car.r},${car.c + lo - 1}`)) lo--;
    while (car.c + hi + 2 < N && !g.has(`${car.r},${car.c + hi + 2}`)) hi++;
  } else {
    while (car.r + lo - 1 >= 0 && !g.has(`${car.r + lo - 1},${car.c}`)) lo--;
    while (car.r + hi + 2 < N && !g.has(`${car.r + hi + 2},${car.c}`)) hi++;
  }
  return [lo, hi] as const;
}

const load = (level: number): Car[] =>
  PUZZLES[level].cars.map((c) => ({ r: c.r, c: c.c, o: c.o as Orient }));

export default function Forecourt() {
  const [level, setLevel] = useState(0);
  const [cars, setCars] = useState<Car[]>(() => load(0));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const carEls = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ i: number; start: number; lo: number; hi: number; cell: number; pos: number } | null>(null);

  const sprites = useMemo(
    () => cars.map((_, i) => (i === 0 ? "wedding" : SPRITES[(i - 1 + level * 2) % SPRITES.length])),
    // sprites follow the layout, not every move
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, cars.length],
  );
  // Each car keeps a fixed facing so the lot reads naturally; the wedding car faces the exit.
  const facing = useMemo(
    () => cars.map((car, i) => (i === 0 ? -90 : car.o === "h" ? (i % 2 ? 90 : -90) : i % 3 ? 0 : 180)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, cars.length],
  );

  const cellPx = () => ((board.current?.clientWidth ?? 600) * GS) / 100 / N;

  const reset = useCallback((lv: number) => {
    carEls.current.forEach((el) => el && gsap.set(el, { clearProps: "transform,opacity" }));
    setLevel(lv);
    setCars(load(lv));
    setMoves(0);
    setWon(false);
  }, []);

  const commit = useCallback(
    (i: number, delta: number) => {
      if (delta === 0) return;
      const next = cars.map((car, k) =>
        k === i ? (car.o === "h" ? { ...car, c: car.c + delta } : { ...car, r: car.r + delta }) : car,
      );
      setCars(next);
      setMoves((m) => m + 1);
      if (i === 0 && next[0].c === N - 2) {
        setWon(true);
        const el = carEls.current[0];
        if (el) {
          gsap.to(el, {
            x: cellPx() * 3.2,
            duration: 1.1,
            ease: "power2.in",
            delay: 0.15,
          });
        }
      }
    },
    [cars],
  );

  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (won) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [lo, hi] = range(cars, i);
    const along = cars[i].o === "h" ? e.clientX : e.clientY;
    drag.current = { i, start: along, lo, hi, cell: cellPx(), pos: 0 };
    setDragging(i);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const car = cars[d.i];
    const along = car.o === "h" ? e.clientX : e.clientY;
    let pos = (along - d.start) / d.cell;
    // Past the limit the car resists a little instead of stopping dead.
    if (pos < d.lo) pos = d.lo - Math.min(0.12, (d.lo - pos) * 0.15);
    if (pos > d.hi) pos = d.hi + Math.min(0.12, (pos - d.hi) * 0.15);
    d.pos = pos;
    const el = carEls.current[d.i];
    if (el) gsap.set(el, car.o === "h" ? { x: pos * d.cell } : { y: pos * d.cell });
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(null);
    const car = cars[d.i];
    const snap = Math.max(d.lo, Math.min(d.hi, Math.round(d.pos)));
    const el = carEls.current[d.i];
    if (!el) return;
    gsap.to(el, {
      [car.o === "h" ? "x" : "y"]: snap * d.cell,
      duration: 0.35,
      ease: "back.out(1.6)",
      onComplete: () => {
        gsap.set(el, { x: 0, y: 0 });
        commit(d.i, snap);
      },
    });
  };

  const onKey = (i: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (won) return;
    const car = cars[i];
    const dir =
      car.o === "h"
        ? e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0
        : e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    const [lo, hi] = range(cars, i);
    if ((dir < 0 && lo < 0) || (dir > 0 && hi > 0)) commit(i, dir);
  };

  useEffect(() => {
    carEls.current = carEls.current.slice(0, cars.length);
  }, [cars.length]);

  const cell = GS / N;

  return (
    <section id="parking" className="bg-paper px-[var(--gutter)] pb-[16vh] pt-[6vh]">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-[6vw]">
        <div>
          <h2 className="display text-[clamp(40px,5.6vw,84px)]">
            The forecourt,
            <br />
            <em>in miniature.</em>
          </h2>
          <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ink-soft md:text-[17px]">
            Every celebration begins at our paved forecourt by the gate. Play with it here: slide the
            cars along their lanes and clear a way for the wedding car to reach the celebration.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {PUZZLES.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => reset(i)}
                className={`pill ${i === level ? "!bg-wine !text-paper" : ""}`}
                aria-pressed={i === level}
              >
                <em>Level</em> {i + 1}
              </button>
            ))}
            <button type="button" onClick={() => reset(level)} className="label ml-2 underline-offset-4 hover:underline">
              Reset
            </button>
          </div>

          <dl className="mt-8 flex gap-10">
            <div>
              <dt className="label text-ink-soft">Your moves</dt>
              <dd className="display mt-1 text-5xl tabular-nums">{moves}</dd>
            </div>
            <div>
              <dt className="label text-ink-soft">Fewest possible</dt>
              <dd className="display mt-1 text-5xl tabular-nums text-ink-soft">{PUZZLES[level].moves}</dd>
            </div>
          </dl>

          <figure className="mt-10 hidden md:block">
            <div className="relative aspect-[3/2] w-[78%] overflow-hidden">
              <Image src="/img/parking-forecourt.webp" alt="The paved forecourt at the Ekamra Greens gate" fill sizes="30vw" className="object-cover" />
            </div>
            <figcaption className="mt-3 font-display text-sm italic text-ink-soft">The real forecourt, at the gate.</figcaption>
          </figure>
        </div>

        <div className="relative">
          <div
            ref={board}
            className="relative aspect-square w-full select-none overflow-hidden shadow-[0_30px_60px_-30px_rgb(27_22_20/0.45)]"
            role="group"
            aria-label="Parking puzzle. Drag cars along their lanes, or focus a car and use the arrow keys."
          >
            <Image src="/game/board.webp" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="pointer-events-none object-cover" priority={false} />

            {/* Painted bay lines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {Array.from({ length: N + 1 }, (_, k) => (
                <g key={k} stroke="rgb(255 250 240 / 0.28)" strokeWidth="0.25">
                  <line x1={GX + k * cell} y1={GY} x2={GX + k * cell} y2={GY + GS} />
                  <line x1={GX} y1={GY + k * cell} x2={GX + GS} y2={GY + k * cell} />
                </g>
              ))}
              {/* Exit: painted chevrons out through the right edge of the exit lane */}
              {[0, 1].map((k) => (
                <path
                  key={k}
                  d={`M ${GX + GS - 3.2 + k * 2.6} ${GY + EXIT_ROW * cell + cell * 0.26} l 2 ${cell * 0.24} l -2 ${cell * 0.24}`}
                  fill="none"
                  stroke="#f4cf6a"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>

            {cars.map((car, i) => {
              const w = (car.o === "h" ? 2 : 1) * cell;
              const h = (car.o === "h" ? 1 : 2) * cell;
              const lifted = dragging === i;
              return (
                <button
                  key={`${level}-${i}`}
                  ref={(el) => {
                    carEls.current[i] = el;
                  }}
                  type="button"
                  data-cursor="drag"
                  aria-label={`${NAMES[sprites[i]]}, ${car.o === "h" ? "slides left and right" : "slides up and down"}, row ${car.r + 1}, column ${car.c + 1}`}
                  onPointerDown={onPointerDown(i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={onKey(i)}
                  className={`absolute touch-none outline-offset-[-4px] ${won ? "cursor-default" : lifted ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{
                    left: `${GX + car.c * cell}%`,
                    top: `${GY + car.r * cell}%`,
                    width: `${w}%`,
                    height: `${h}%`,
                    zIndex: lifted ? 20 : i === 0 ? 10 : 5,
                  }}
                >
                  <span
                    className="absolute block transition-[filter,scale] duration-300"
                    style={{
                      width: car.o === "h" ? "50%" : "100%",
                      height: car.o === "h" ? "200%" : "100%",
                      left: car.o === "h" ? "25%" : "0",
                      top: car.o === "h" ? "-50%" : "0",
                      rotate: `${facing[i]}deg`,
                      scale: lifted ? "1.05" : "1",
                      filter: lifted
                        ? "drop-shadow(0 18px 14px rgb(10 6 4 / 0.5))"
                        : "drop-shadow(0 6px 5px rgb(10 6 4 / 0.55))",
                    }}
                  >
                    <Image
                      src={`/game/${sprites[i]}.webp`}
                      alt=""
                      fill
                      sizes="160px"
                      draggable={false}
                      className="pointer-events-none object-contain p-[5%]"
                    />
                  </span>
                </button>
              );
            })}

            {won && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/45 p-6 backdrop-blur-[2px]">
                <div className="max-w-sm bg-paper px-8 py-9 text-center shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)]">
                  <p className="display text-4xl">
                    The couple <em>has arrived.</em>
                  </p>
                  <p className="mt-4 text-base text-ink-soft">
                    You cleared the forecourt in {moves} {moves === 1 ? "move" : "moves"}
                    {moves <= PUZZLES[level].moves ? ", a perfect run." : "."}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button type="button" className="pill" onClick={() => reset(level)}>
                      <em>Play</em> again
                    </button>
                    {level < PUZZLES.length - 1 && (
                      <button type="button" className="pill" onClick={() => reset(level + 1)}>
                        <em>Next</em> level
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="mt-4 flex items-center justify-between font-display text-sm italic text-ink-soft">
            <span>Drag a car along its lane.</span>
            <span>The wedding car leaves by the gold arrows.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
