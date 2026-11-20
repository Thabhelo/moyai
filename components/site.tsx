"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { id: "community", href: "/community", name: "Community" },
  { id: "county", href: "/county", name: "County" },
  { id: "operator", href: "/operator", name: "Data center" },
  { id: "training", href: "/training", name: "Training" },
];

export function Nav({ current }: { current?: string }) {
  // One listener for the whole page: tells the card under the pointer where the pointer is, for the glow and the tilt.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.(".plush") as HTMLElement | null;
      if (!el) return;
      const b = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - b.left}px`);
      el.style.setProperty("--my", `${e.clientY - b.top}px`);
      el.style.setProperty("--px", `${(e.clientX - b.left) / b.width}`);
      el.style.setProperty("--py", `${(e.clientY - b.top) / b.height}`);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);
  return (
    <nav aria-label="Moyai" className="fixed inset-x-0 top-4 z-20 px-4">
      <div className="scrollbar" aria-hidden />
      <div className="glass mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 rounded-full pl-7 pr-2.5">
        <Link href="/" className="logo text-[1.7rem] font-medium tracking-tight">moyai</Link>
        <div className="seg flex overflow-x-auto rounded-full p-1 text-[0.9rem] sm:text-base">
          {LINKS.map((l) => (
            <Link key={l.id} href={l.href} aria-current={current === l.id ? "page" : undefined} className="shrink-0 rounded-full px-3 py-2 text-ink2 transition-colors hover:text-ink sm:px-5">
              {l.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="onink overflow-hidden rounded-[40px]">
        <div className="mx-auto max-w-5xl px-8 pt-16 sm:px-14 sm:pt-20">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <Reveal>
              <div className="text-5xl text-ink3">舫い</div>
              <p className="mt-4 max-w-xs text-lg leading-snug">Moyai is Japanese for a mooring rope that ties boats together in a storm.</p>
            </Reveal>
            <Reveal delay={120}>
              <ul className="grid grid-cols-2 gap-x-12 gap-y-3 text-lg">
                {LINKS.map((l) => (
                  <li key={l.id}><Link href={l.href} className="ulink">{l.name}</Link></li>
                ))}
                <li><a href="https://prd.moyai.fyi" target="_blank" rel="noopener" className="ulink">Product requirements</a></li>
              </ul>
            </Reveal>
          </div>
          <Rope className="mt-14 h-12 w-full" />
          <p className="py-6 text-sm text-ink2">Team Tornadoes · BESmart Innovation Challenge 2026</p>
        </div>
        <div aria-hidden className="wordmark grow-in select-none text-center text-[clamp(7rem,31vw,27rem)] font-medium leading-[0.72] tracking-[-0.055em]">moyai</div>
      </div>
    </footer>
  );
}

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}

/** A number that glides to its new value instead of jumping. */
export function Num({ value, digits = 0, prefix = "", suffix = "" }: { value: number; digits?: number; prefix?: string; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const [seen, setSeen] = useState(false);
  const el = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()));
    io.observe(el.current!);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    const start = performance.now();
    const a = from.current;
    let id = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900);
      const v = a + (value - a) * (1 - (1 - k) ** 3);
      from.current = v;
      setShown(v);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, seen]);
  return <span ref={el} className="num">{prefix}{shown.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}{suffix}</span>;
}

/** The mooring rope: three strands twisting together across the page. Drawn on one canvas, paused off screen. */
export function Rope({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let id = 0;
    let visible = true;
    const draw = (ms: number) => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const css = getComputedStyle(canvas);
      const colors = [css.getPropertyValue("--hot"), css.getPropertyValue("--ink"), css.getPropertyValue("--ink3")];
      const t = ms / 4200 + scrollY / 260; // drifts on its own and turns as the page scrolls
      const amp = h * 0.34;
      const turns = Math.max(2, w / 300);
      // Draw in short pieces, back strands first, so the strands pass over and under each other.
      const pieces: { z: number; x0: number; y0: number; x1: number; y1: number; c: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const phase = (i * Math.PI * 2) / 3;
        for (let x = 0; x < w; x += 4) {
          const a0 = (x / w) * turns * Math.PI * 2 + phase - t;
          const a1 = ((x + 5) / w) * turns * Math.PI * 2 + phase - t;
          const ease = Math.min(1, x / 240, (w - x) / 240); // strands gather at both edges
          pieces.push({ z: Math.cos(a0), x0: x, y0: h / 2 + Math.sin(a0) * amp * ease, x1: x + 5, y1: h / 2 + Math.sin(a1) * amp * ease, c: colors[i] });
        }
      }
      pieces.sort((p, q) => p.z - q.z);
      ctx.lineCap = "round";
      for (const p of pieces) {
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = 0.25 + 0.75 * ((p.z + 1) / 2);
        ctx.lineWidth = 1.25 + 1.5 * ((p.z + 1) / 2); // hairline strands, a touch heavier in front
        ctx.beginPath();
        ctx.moveTo(p.x0, p.y0);
        ctx.lineTo(p.x1, p.y1);
        ctx.stroke();
      }
      if (!still && visible) id = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(id);
      if (visible) id = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(id);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className={className} />;
}
