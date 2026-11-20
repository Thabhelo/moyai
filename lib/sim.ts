import { append, newSigner, signJson, verifyChain, type LedgerEntry } from "./ledger";
import { baselineMW, gridWaterGal, verifyCurtailment, type Reading, type Verification } from "./baseline";

// A simulated 100 MW AI campus with closed-loop direct-to-chip cooling. 1 real second = 1 simulated minute.
const SIM_MIN_PER_SEC = 1;
const IT_MW = 80; // 80% of 100 MW IT capacity
const PUE = 1.12; // liquid cooling, closed loop
const BATTERY_MW = 12;
const BATTERY_MWH = 24; // 2-hour battery, matches typical curtailment length
const RAMP_MIN = 4; // inside the 10-minute dispatch window
const HISTORY_MIN = 24 * 60;
const SIM_EPOCH = Date.parse("2026-08-14T12:00:00-05:00"); // a summer afternoon in Memphis

export type Telemetry = Reading & {
  ts: string;
  inEvent: boolean;
  uncutMW: number; // what the facility would draw with no event
  batteryMW: number; // + discharging, - charging
  batterySoc: number; // 0..1
  computeShedMW: number;
  supplyC: number;
  returnC: number;
  flowGPM: number;
  potableWaterGPM: number;
};

export type GridEvent = {
  id: number;
  startMin: number;
  endMin: number;
  targetPct: number;
  baselineMW: number;
  // battery energy is only shifted (it recharges from the grid later), so water counts paused compute only
  verification?: Verification & { gridWaterAvoidedGal: number };
  ledgerHead?: string; // hash of the verification entry, so the certificate is pinned to the log at event end
};

type State = {
  startedAt: number;
  min: number;
  soc: number;
  history: Telemetry[];
  events: GridEvent[];
  ledger: LedgerEntry[];
  signer: ReturnType<typeof newSigner>;
};

// shortcut: state lives in one server process (kept on globalThis to survive dev reloads); move to Redis/Postgres before running more than one instance.
const g = globalThis as unknown as { moyai?: State };

function fresh(): State {
  const s: State = { startedAt: Date.now(), min: 0, soc: 1, history: [], events: [], ledger: [], signer: newSigner() };
  for (let m = -90; m <= 0; m++) step(s, m); // 90 min of warm-up so the baseline has data
  return s;
}

const state = () => (g.moyai ??= fresh());
export const reset = () => (g.moyai = fresh());

const tsOf = (min: number) => new Date(SIM_EPOCH + min * 60_000).toISOString();
const load = (min: number) => IT_MW * PUE * (1 + 0.03 * Math.sin(min / 37) + 0.015 * Math.sin(min / 7)); // smooth daily wobble

function step(s: State, min: number) {
  const base = load(min);
  const ev = s.events.find((e) => min >= e.startMin && min < e.endMin);
  let shed = 0;
  let batteryMW = 0;
  if (ev) {
    const targetMW = ev.baselineMW * (1 - ev.targetPct) * 0.99; // aim 1% under the committed level
    shed = Math.max(0, base - targetMW) * Math.min(1, (min - ev.startMin + 1) / RAMP_MIN);
    batteryMW = Math.min(shed, BATTERY_MW, s.soc * BATTERY_MWH * 60);
    s.soc = Math.max(0, s.soc - batteryMW / 60 / BATTERY_MWH);
  } else if (s.soc < 1) {
    batteryMW = -Math.min(BATTERY_MW / 4, (1 - s.soc) * BATTERY_MWH * 60); // slow recharge off-event, drawn from the grid
    s.soc = Math.min(1, s.soc - batteryMW / 60 / BATTERY_MWH);
  }
  const facilityMW = base - shed - Math.min(0, batteryMW);
  const heat = facilityMW / (IT_MW * PUE);
  const t: Telemetry = {
    min,
    ts: tsOf(min),
    inEvent: !!ev,
    facilityMW,
    uncutMW: base,
    batteryMW,
    batterySoc: s.soc,
    computeShedMW: Math.max(0, shed - batteryMW),
    supplyC: 32,
    returnC: 32 + 10 * heat,
    flowGPM: 9000 * heat,
    potableWaterGPM: 0, // closed loop: filled once, no evaporation
  };
  s.history.push(t);
  if (s.history.length > HISTORY_MIN) s.history.shift();
  // every minute during an event, so the log alone can back the verified ramp time
  if (min % 15 === 0 || ev) append(s.ledger, t.ts, "reading", { facilityMW: +facilityMW.toFixed(3), potableWaterGPM: 0 });
  if (ev && min === ev.endMin - 1) finish(s, ev);
}

function finish(s: State, ev: GridEvent) {
  const computeMWh = s.history.filter((t) => t.min >= ev.startMin).reduce((sum, t) => sum + t.computeShedMW, 0) / 60;
  ev.verification = { ...verifyCurtailment(s.history, ev), gridWaterAvoidedGal: gridWaterGal(computeMWh) };
  append(s.ledger, tsOf(ev.endMin), "event_end", { eventId: ev.id });
  ev.ledgerHead = append(s.ledger, tsOf(ev.endMin), "verification", { eventId: ev.id, ...ev.verification }).hash;
}

/** Advance the simulation to the current wall-clock time. */
export function tick() {
  const s = state();
  const target = Math.floor(((Date.now() - s.startedAt) / 1000) * SIM_MIN_PER_SEC);
  while (s.min < target) step(s, ++s.min);
  return s;
}

export function startEvent(targetPct = 0.3, durationMin = 120) {
  // a non-integer duration would never hit the end minute and lock the sim; a string would concatenate
  if (typeof targetPct !== "number" || !(targetPct > 0 && targetPct < 1) || !Number.isInteger(durationMin) || durationMin < 5 || durationMin > 600)
    throw new RangeError("targetPct must be a number between 0 and 1, durationMin a whole number from 5 to 600");
  const s = tick();
  if (s.events.some((e) => !e.verification)) throw new Error("an event is already running");
  const startMin = s.min + 1;
  const ev: GridEvent = { id: s.events.length + 1, startMin, endMin: startMin + durationMin, targetPct, baselineMW: baselineMW(s.history, startMin) };
  s.events.push(ev);
  append(s.ledger, tsOf(ev.startMin), "event_start", { eventId: ev.id, targetPct, durationMin });
  return ev;
}

export function certificate(eventId: number) {
  const s = tick();
  const ev = s.events.find((e) => e.id === eventId);
  if (!ev?.verification || !ev.ledgerHead) return null;
  const body = {
    facility: "Host campus (simulated), Shelby County, TN, ZIP 38109",
    eventId,
    window: { start: tsOf(ev.startMin), end: tsOf(ev.endMin) },
    targetPct: ev.targetPct,
    ...ev.verification,
    ledgerHead: ev.ledgerHead,
    logIntact: verifyChain(s.ledger) === null,
  };
  return {
    body,
    signature: signJson(body, s.signer.privateKey),
    publicKey: s.signer.publicKey.export({ type: "spki", format: "pem" }),
  };
}
