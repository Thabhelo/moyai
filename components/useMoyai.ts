"use client";
import { useEffect, useState } from "react";
import type { GridEvent, Telemetry } from "@/lib/sim";
import type { LedgerEntry } from "@/lib/ledger";

export type MoyaiState = {
  now: Telemetry;
  history: Telemetry[];
  events: GridEvent[];
  ledger: LedgerEntry[];
  ledgerLength: number;
  brokenAt: number | null;
};

// Every view polls the same server state, so a dispatch on one screen shows up on all of them.
export function useMoyai(intervalMs = 1000) {
  const [state, setState] = useState<MoyaiState | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/state")
        .then((r) => r.json())
        .then((s) => alive && setState(s))
        .catch(() => {}); // keep the last good state if one poll fails
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);
  return state;
}

export const activeEvent = (s: MoyaiState) => s.events.find((e) => !e.verification);
export const lastFinished = (s: MoyaiState) => s.events.findLast((e) => e.verification);
