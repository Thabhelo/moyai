"use client";
import { useEffect, useState, type ReactNode } from "react";
import { LEVEL_WORD, type Level } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";

export function Card({ title, children, className = "" }: { title?: string; demo?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={`plush rounded-[28px] bg-card p-6 sm:p-8 ${className}`}>
      {title && (
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ tone, children }: { tone: Level | "info"; children: ReactNode }) {
  return <span className={`pill-${tone} inline-block whitespace-nowrap text-sm font-semibold`}>{children}</span>;
}
export const LevelPill = ({ level }: { level: Level }) => <Pill tone={level}>{LEVEL_WORD[level]}</Pill>;

export function Bar({ value, max, mark }: { value: number; max: number; mark?: number }) {
  return (
    <div className="relative h-2 rounded-full bg-accent-soft">
      <div className="h-2 rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      {mark !== undefined && <div className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${(mark / max) * 100}%` }} title="U.S." />}
    </div>
  );
}

/** Line chart drawn as plain SVG: no chart library to download. */
export function Lines({ series, height = 56, label }: { series: { values: number[]; dashed?: boolean; muted?: boolean }[]; height?: number; label: string }) {
  const all = series.flatMap((s) => s.values);
  if (all.length < 2) return <div style={{ height }} />;
  const min = Math.min(...all);
  const span = Math.max(...all) - min || 1;
  const path = (v: number[]) => v.map((y, i) => `${i ? "L" : "M"}${((i / (v.length - 1)) * 300).toFixed(1)},${(4 + (1 - (y - min) / span) * 92).toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label={label} className="w-full" style={{ height }}>
      {series.map((s, i) => (
        <path key={i} d={path(s.values)} fill="none" stroke={s.muted ? "var(--ink3)" : "var(--accent)"} strokeWidth={s.muted ? 1.25 : 2} strokeDasharray={s.dashed ? "4 4" : undefined} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2 first:border-0">
      <span className="text-ink2">{label}</span>
      <span className="num text-right">{children}</span>
    </div>
  );
}

/**
 * Every press shows something: a spinner while the work runs, then a tick.
 * The handler may return a promise; resolving to false means it did not go through.
 */
export function Button({ children, onClick, disabled, quiet }: { children: ReactNode; onClick?: () => unknown; disabled?: boolean; quiet?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const click = async () => {
    if (phase === "busy") return;
    setPhase("busy");
    let ok = true;
    try {
      // Hold the spinner for a moment even when the answer is instant, so the press is always seen.
      const [out] = await Promise.all([onClick?.(), new Promise((r) => setTimeout(r, 450))]);
      ok = out !== false;
    } catch {
      ok = false;
      toast("That did not go through. Please try again.", "bad");
    }
    setPhase(ok ? "done" : "idle");
    if (ok) setTimeout(() => setPhase("idle"), 1100);
  };
  return (
    <button onClick={click} disabled={disabled} aria-busy={phase === "busy"} data-phase={phase} className={`btn relative rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50 ${quiet ? "bg-accent-soft text-accent" : "bg-accent text-on-accent"}`}>
      <span className="btn-label">{children}</span>
      {phase !== "idle" && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          {phase === "busy" ? <span className="spinner" /> : (
            <svg className="tick" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          )}
        </span>
      )}
    </button>
  );
}

type Toast = { id: number; text: string; tone: "ok" | "bad" };
/** Shows a short message at the bottom of the screen, from anywhere in the app. */
export const toast = (text: string, tone: Toast["tone"] = "ok") => dispatchEvent(new CustomEvent("moyai-toast", { detail: { text, tone } }));

/** The stack of messages; rendered once, by the nav. */
export function Toasts() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    let n = 0;
    const add = (e: Event) => {
      const t = { ...(e as CustomEvent).detail, id: ++n } as Toast;
      setList((l) => [...l.slice(-2), t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 5000);
    };
    addEventListener("moyai-toast", add);
    return () => removeEventListener("moyai-toast", add);
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div key={t.id} className="toast glass flex max-w-xl items-center gap-3 rounded-full py-3 pl-4 pr-6 text-[15px]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.tone === "ok" ? "var(--hot)" : "var(--bad)" }} />
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Progress metric: a name, a figure, a Plush progress bar toward its limit, and a status word. */
export function Metric({ name, value, of, pct, tone, word }: { name: string; value: string; of?: string; pct: number; tone: Level | "info"; word: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-canvas p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink2">{name}</span>
        <Pill tone={tone}>{word}</Pill>
      </div>
      <div className="num text-2xl font-semibold">{value}{of && <span className="text-base font-normal text-ink3"> {of}</span>}</div>
      <Progress value={pct} aria-label={name} />
    </div>
  );
}

/** A Plush progress ring with a short label in the middle. */
export function Ring({ pct, size = 84, children, label }: { pct: number; size?: number; children?: ReactNode; label: string }) {
  return (
    <ProgressRing value={pct} aria-label={label} style={{ "--plush-ring-size": `${size}px` } as React.CSSProperties}>
      {children ?? `${Math.round(pct)}%`}
    </ProgressRing>
  );
}
