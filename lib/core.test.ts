import { describe, expect, it } from "vitest";
import { append, newSigner, signJson, verifyChain, verifyJson, type LedgerEntry } from "./ledger";
import { baselineMW, verifyCurtailment, type Reading } from "./baseline";
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
    const slow = [...flat(0, 60, 100), ...flat(60, 70, 90), ...flat(70, 180, 74)];
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
    expect(cert.body.ledgerHead).toBe(s.ledger.at(-1)!.hash);
  });
});
