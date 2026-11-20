import type { ReactNode } from "react";
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

export function Button({ children, onClick, disabled, quiet }: { children: ReactNode; onClick?: () => void; disabled?: boolean; quiet?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-full px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${quiet ? "bg-accent-soft text-accent" : "bg-accent text-on-accent"}`}>
      {children}
    </button>
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
