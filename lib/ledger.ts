import { createHash, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";

export type LedgerEntry = {
  seq: number;
  ts: string; // simulated time, ISO
  type: "reading" | "event_start" | "event_end" | "verification";
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
};

const GENESIS = "0".repeat(64);

const digest = (e: Omit<LedgerEntry, "hash">) =>
  createHash("sha256").update(JSON.stringify([e.seq, e.ts, e.type, e.payload, e.prevHash])).digest("hex");

export function append(chain: LedgerEntry[], ts: string, type: LedgerEntry["type"], payload: Record<string, unknown>) {
  const prev = chain.at(-1);
  const base = { seq: (prev?.seq ?? -1) + 1, ts, type, payload, prevHash: prev?.hash ?? GENESIS };
  const entry = { ...base, hash: digest(base) };
  chain.push(entry);
  return entry;
}

/** Returns the seq of the first broken entry, or null if the whole chain checks out. */
export function verifyChain(chain: LedgerEntry[]): number | null {
  let prevHash = GENESIS;
  for (const e of chain) {
    if (e.prevHash !== prevHash || e.hash !== digest(e)) return e.seq;
    prevHash = e.hash;
  }
  return null;
}

// shortcut: one in-memory Ed25519 key per server process; use a real key store (HSM/KMS) before anyone relies on these signatures.
export const newSigner = () => generateKeyPairSync("ed25519");

export const signJson = (data: unknown, key: KeyObject) =>
  sign(null, Buffer.from(JSON.stringify(data)), key).toString("base64");

export const verifyJson = (data: unknown, signature: string, key: KeyObject) =>
  verify(null, Buffer.from(JSON.stringify(data)), key, Buffer.from(signature, "base64"));
