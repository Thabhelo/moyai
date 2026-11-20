"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { id: "community", href: "/community", name: "Community" },
  { id: "county", href: "/county", name: "County" },
  { id: "operator", href: "/operator", name: "Data center" },
];

export function Nav({ current }: { current?: string }) {
  return (
    <nav aria-label="Moyai" className="glass sticky top-0 z-20 border-b border-line">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-head text-lg font-semibold tracking-tight">Moyai</Link>
        <div className="flex gap-4 overflow-x-auto text-[13px] sm:gap-7">
          {LINKS.map((l) => (
            <Link key={l.id} href={l.href} aria-current={current === l.id ? "page" : undefined} className={`shrink-0 transition-colors hover:text-ink ${current === l.id ? "text-ink" : "text-ink2"}`}>
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
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 text-[13px] text-ink2 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-head text-2xl font-semibold text-ink">Moyai <span className="font-normal text-ink3">舫い</span></div>
            <p className="mt-1 max-w-sm">A mooring rope that ties boats together, so they weather storms as one.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => <Link key={l.id} href={l.href} className="hover:text-ink">{l.name}</Link>)}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-ink3">
          <span>Team Tornadoes · BESmart Innovation Challenge 2026</span>
          <span>Campus readings are simulated. Census figures are real.</span>
        </div>
      </div>
    </footer>
  );
}

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

/** A number that glides to its new value instead of jumping. */
export function Num({ value, digits = 0, prefix = "", suffix = "" }: { value: number; digits?: number; prefix?: string; suffix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    const start = performance.now();
    const a = from.current;
    let id = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 600);
      const v = a + (value - a) * (1 - (1 - k) ** 3);
      from.current = v;
      setShown(v);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <span className="num">{prefix}{shown.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}{suffix}</span>;
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
      const t = ms / 2600;
      const amp = h * 0.3;
      const turns = Math.max(3, w / 190);
      // Draw in short pieces, back strands first, so the strands pass over and under each other.
      const pieces: { z: number; x0: number; y0: number; x1: number; y1: number; c: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const phase = (i * Math.PI * 2) / 3;
        for (let x = 0; x < w; x += 6) {
          const a0 = (x / w) * turns * Math.PI * 2 + phase - t;
          const a1 = ((x + 7) / w) * turns * Math.PI * 2 + phase - t;
          const ease = Math.min(1, x / 160, (w - x) / 160); // strands gather at both edges
          pieces.push({ z: Math.cos(a0), x0: x, y0: h / 2 + Math.sin(a0) * amp * ease, x1: x + 7, y1: h / 2 + Math.sin(a1) * amp * ease, c: colors[i] });
        }
      }
      pieces.sort((p, q) => p.z - q.z);
      ctx.lineCap = "round";
      for (const p of pieces) {
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = 0.45 + 0.55 * ((p.z + 1) / 2);
        ctx.lineWidth = h * (0.07 + 0.05 * ((p.z + 1) / 2));
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
