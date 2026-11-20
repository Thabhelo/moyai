import { describe, expect, it } from "vitest";
import { append, newSigner, signJson, verifyChain, verifyJson, type LedgerEntry } from "./ledger";
import { baselineMW, gridWaterGal, verifyCurtailment, type Reading } from "./baseline";
import { certificate, reset, startEvent, tick } from "./sim";

describe("ledger", () => {
  it("detects an edited entry", () => {
    const chain: LedgerEntry[] = [];
    for (let i = 0; i < 5; i++) append(chain, `t${i}`, "reading", { facilityMW: 90 + i });
    expect(verifyChain(chain)).toBeNull();
    chain[2].payload.facilityMW = 1;
    expect(verifyChain(chain)).toBe(2);
  });

  it("signatures fail on changed data", () => {
    const { privateKey, publicKey } = newSigner();
    const sig = signJson({ shed: 22 }, privateKey);
    expect(verifyJson({ shed: 22 }, sig, publicKey)).toBe(true);
    expect(verifyJson({ shed: 23 }, sig, publicKey)).toBe(false);
  });
});

describe("curtailment verification", () => {
  const flat = (from: number, to: number, mw: number): Reading[] =>
    Array.from({ length: to - from }, (_, i) => ({ min: from + i, facilityMW: mw }));

  it("passes a fast, held 25% cut", () => {
    const h = [...flat(0, 60, 100), ...flat(60, 63, 90), ...flat(63, 180, 74)];
    const v = verifyCurtailment(h, { startMin: 60, endMin: 180, targetPct: 0.25 });
    expect(baselineMW(h, 60)).toBe(100);
    expect(v.rampMinutes).toBe(3);
    expect(v.compliant).toBe(true);
  });

  it("fails a cut that is too slow or bounces back", () => {
    const slow = [...flat(0, 60, 100), ...flat(60, 72, 90), ...flat(72, 180, 74)]; // 12 min > 10-min window
    expect(verifyCurtailment(slow, { startMin: 60, endMin: 180, targetPct: 0.25 }).compliant).toBe(false);
    const bounce = [...flat(0, 60, 100), ...flat(60, 120, 74), ...flat(120, 180, 95)];
    expect(verifyCurtailment(bounce, { startMin: 60, endMin: 180, targetPct: 0.25 }).compliant).toBe(false);
  });
});

describe("simulated campus", () => {
  it("runs an event end to end and issues a certificate", () => {
    const s = reset();
    const ev = startEvent(0.25, 30);
    s.startedAt -= 40_000; // jump 40 simulated minutes ahead
    tick();
    expect(ev.verification?.compliant).toBe(true);
    expect(s.history.every((t) => t.potableWaterGPM === 0)).toBe(true);
    expect(verifyChain(s.ledger)).toBeNull();
    const cert = certificate(ev.id)!;
    expect(cert.body.ledgerHead).toBe(s.ledger.findLast((e) => e.type === "verification")!.hash);
    expect(cert.body.logIntact).toBe(true);

    // battery energy is shifted, not avoided: water counts paused compute only
    const computeMWh = s.history.filter((t) => t.min >= ev.startMin && t.min < ev.endMin).reduce((x, t) => x + t.computeShedMW, 0) / 60;
    expect(ev.verification!.gridWaterAvoidedGal).toBeCloseTo(gridWaterGal(computeMWh));
    expect(computeMWh).toBeLessThan(ev.verification!.shedMWh);

    // later ticks don't change the certificate, and tampering shows on it
    s.startedAt -= 20_000;
    tick();
    s.ledger[1].payload.facilityMW = 0;
    const later = certificate(ev.id)!;
    expect(later.body.ledgerHead).toBe(cert.body.ledgerHead);
    expect(later.body.logIntact).toBe(false);
  });

  it("measures a back-to-back event against normal load, and logs it minute by minute", () => {
    const s = reset();
    const e1 = startEvent(0.25, 30);
    s.startedAt -= 35_000;
    tick();
    const e2 = startEvent(0.25, 30);
    s.startedAt -= 35_000;
    tick();
    expect(Math.abs(e2.baselineMW - e1.baselineMW)).toBeLessThan(3);
    const during = s.history.filter((t) => t.min >= e2.startMin && t.min < e2.endMin);
    const realCut = during.reduce((x, t) => x + (t.uncutMW - t.facilityMW) / t.uncutMW, 0) / during.length;
    expect(realCut).toBeGreaterThan(0.2);
    expect(realCut).toBeLessThan(0.3);
    const logged = s.ledger.filter((l) => l.type === "reading" && l.ts >= during[0].ts && l.ts <= during.at(-1)!.ts);
    expect(logged.length).toBe(30);
  });

  it("rejects inputs that would lock or stretch an event", () => {
    reset();
    expect(() => startEvent(0.25, 2.5)).toThrow(RangeError);
    expect(() => startEvent(0.25, "10" as unknown as number)).toThrow(RangeError);
    expect(() => startEvent("0.25" as unknown as number, 10)).toThrow(RangeError);
    const ok = startEvent(0.25, 10);
    expect(ok.endMin - ok.startMin).toBe(10);
  });
});
