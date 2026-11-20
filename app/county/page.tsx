"use client";
import { Stat } from "@/components/Stat";
import { lastFinished, useMoyai } from "@/components/useMoyai";

export default function County() {
  const s = useMoyai();
  if (!s) return <main className="p-8">Loading…</main>;
  const done = lastFinished(s);
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">County compliance</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="City water for cooling" value={`${s.now.potableWaterGPM} GPM`} note="permit limit 0" />
        <Stat
          label="Audit log"
          value={s.brokenAt === null ? "Intact" : `Broken at #${s.brokenAt}`}
          note={`${s.ledgerLength} entries`}
        />
        {done && (
          <a href={`/api/certificate/${done.id}`} className="rounded-lg border border-zinc-200 p-4 underline dark:border-zinc-800">
            Signed certificate, event {done.id}
          </a>
        )}
      </div>
      <button
        onClick={() => fetch("/api/tamper", { method: "POST" })}
        className="self-start rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
      >
        Demo: tamper with a reading
      </button>
      <ol className="flex flex-col gap-1 font-mono text-xs">
        {s.ledger.toReversed().map((e) => (
          <li key={e.seq}>
            #{e.seq} {e.type} {e.ts.slice(11, 16)} {e.hash.slice(0, 12)}…
          </li>
        ))}
      </ol>
    </main>
  );
}
