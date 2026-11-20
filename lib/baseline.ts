export type Reading = { min: number; facilityMW: number; inEvent?: boolean };

// shortcut: US average water per kWh of data center electricity (LBNL 2024 report, p. 57); swap in a TVA-specific factor for Memphis once researched.
const GRID_WATER_L_PER_KWH = 4.52;
const L_PER_GAL = 3.785;

// shortcut: "meter before" baseline (mean of the last hour of normal operation); real DR programs use multi-day baselines with weather adjustment.
// Minutes inside earlier events are skipped, or a back-to-back event would be measured against already-cut load.
export function baselineMW(history: Reading[], eventStartMin: number, lookbackMin = 60) {
  const window = history.filter((r) => r.min < eventStartMin && !r.inEvent).slice(-lookbackMin);
  if (!window.length) throw new Error("no readings before event start");
  return window.reduce((s, r) => s + r.facilityMW, 0) / window.length;
}

export type Verification = {
  baselineMW: number;
  targetMW: number;
  avgShedMW: number;
  shedMWh: number;
  rampMinutes: number | null; // minutes until load first reached the target
  heldTarget: boolean; // stayed at or under target after reaching it
  compliant: boolean;
};

export const gridWaterGal = (mwh: number) => (mwh * 1000 * GRID_WATER_L_PER_KWH) / L_PER_GAL;

const TOLERANCE = 0.01; // 1% meter tolerance

export function verifyCurtailment(
  history: Reading[],
  event: { startMin: number; endMin: number; targetPct: number },
  dispatchWindowMin = 10,
): Verification {
  const base = baselineMW(history, event.startMin);
  const targetMW = base * (1 - event.targetPct);
  const during = history.filter((r) => r.min >= event.startMin && r.min < event.endMin);
  const hit = during.find((r) => r.facilityMW <= targetMW * (1 + TOLERANCE));
  const rampMinutes = hit ? hit.min - event.startMin : null;
  const heldTarget = !!hit && during.filter((r) => r.min >= hit.min).every((r) => r.facilityMW <= targetMW * (1 + TOLERANCE));
  const avgShedMW = during.length ? during.reduce((s, r) => s + (base - r.facilityMW), 0) / during.length : 0;
  const shedMWh = (avgShedMW * during.length) / 60; // one reading per minute
  return {
    baselineMW: base,
    targetMW,
    avgShedMW,
    shedMWh,
    rampMinutes,
    heldTarget,
    compliant: rampMinutes !== null && rampMinutes <= dispatchWindowMin && heldTarget,
  };
}
