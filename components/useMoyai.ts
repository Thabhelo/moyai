"use client";
import { useEffect, useState } from "react";
import type { GridEvent, Telemetry } from "@/lib/sim";
import type { LedgerEntry } from "@/lib/ledger";

export type Report = { id: number; kind: string; note: string; ts: number };
export type MoyaiState = {
  now: Telemetry;
  history: { min: number; facilityMW: number; uncutMW: number }[];
  events: GridEvent[];
  ledger: LedgerEntry[];
  ledgerLength: number;
  brokenAt: number | null;
  reports: Report[];
  applied: { rec: string; ts: number }[];
  signups: { apply: number; invest: number };
};

// Every screen reads the same server state, so an action on one device shows on all of them.
export function useMoyai(county: string, intervalMs = 1000) {
  const [state, setState] = useState<MoyaiState | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      document.hidden ||
      fetch(`/api/state?county=${county}`)
        .then((r) => r.json())
        .then((s) => alive && s.now && setState(s))
        .catch(() => {}); // keep the last good state if one request fails
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [county, intervalMs]);
  return state;
}

export const post = (path: string, body: unknown = {}) => fetch(`/api/${path}`, { method: "POST", body: JSON.stringify(body) });
export const activeEvent = (s: MoyaiState) => s.events.find((e) => !e.verification);
