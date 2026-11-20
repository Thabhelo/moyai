"use client";
import { Stat } from "@/components/Stat";
import { useMoyai } from "@/components/useMoyai";

export default function Operator() {
  const s = useMoyai();
  if (!s) return <main className="p-8">Loading…</main>;
  const n = s.now;
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Operator view</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Facility load" value={`${n.facilityMW.toFixed(1)} MW`} note={`baseline ${n.baselineMW.toFixed(1)} MW`} />
        <Stat label="Battery" value={`${(n.batterySoc * 100).toFixed(0)}%`} note={n.batteryMW < 0 ? `charging ${(-n.batteryMW).toFixed(1)} MW` : `${n.batteryMW.toFixed(1)} MW out`} />
        <Stat label="Compute paused" value={`${n.computeShedMW.toFixed(1)} MW`} />
        <Stat label="Coolant supply / return" value={`${n.supplyC.toFixed(0)} / ${n.returnC.toFixed(1)} °C`} />
        <Stat label="Loop flow" value={`${n.flowGPM.toFixed(0)} GPM`} />
        <Stat label="City water for cooling" value={`${n.potableWaterGPM} GPM`} note="closed loop" />
      </div>
      <p className="text-sm text-zinc-500">Simulated time {new Date(n.ts).toLocaleString()}</p>
    </main>
  );
}
