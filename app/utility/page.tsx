"use client";
import { useState } from "react";
import { Stat } from "@/components/Stat";
import { activeEvent, lastFinished, useMoyai } from "@/components/useMoyai";

export default function Utility() {
  const s = useMoyai();
  const [error, setError] = useState("");
  if (!s) return <main className="p-8">Loading…</main>;
  const live = activeEvent(s);
  const done = lastFinished(s);
  const dispatch = async () => {
    const r = await fetch("/api/event", { method: "POST", body: JSON.stringify({ targetPct: 0.25, durationMin: 120 }) });
    setError(r.ok ? "" : (await r.json()).error);
  };
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Utility dispatch</h1>
      <button
        onClick={dispatch}
        disabled={!!live}
        className="self-start rounded-md bg-orange-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {live ? "Grid alert in progress" : "Send grid alert: cut 25% for 2 hours"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Facility load" value={`${s.now.facilityMW.toFixed(1)} MW`} />
        {live && <Stat label="Committed level" value={`${(live.baselineMW * (1 - live.targetPct)).toFixed(1)} MW`} />}
        {done?.verification && (
          <Stat
            label={`Event ${done.id} result`}
            value={done.verification.compliant ? "Verified" : "Not met"}
            note={`ramp ${done.verification.rampMinutes ?? "–"} min, ${done.verification.shedMWh.toFixed(1)} MWh shed`}
          />
        )}
      </div>
    </main>
  );
}
