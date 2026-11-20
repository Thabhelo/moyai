import type { ReactNode } from "react";
import { LEVEL_WORD, type Level } from "@/lib/data";

export function Card({ title, demo = true, children, className = "" }: { title?: string; demo?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={`plush rounded-[28px] bg-card p-5 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium">{title}</h2>
          {demo && <span className="shrink-0 text-xs text-ink3">Demo data</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ tone, children }: { tone: Level | "info"; children: ReactNode }) {
  return <span className={`pill-${tone} inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium`}>{children}</span>;
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

export function Button({ children, onClick, disabled, quiet }: { children: ReactNode; onClick?: () => void; disabled?: boolean; quiet?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-full px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${quiet ? "bg-accent-soft text-accent" : "bg-accent text-on-accent"}`}>
      {children}
    </button>
  );
}
