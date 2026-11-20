# Moyai

Verified grid relief for host communities. Team Tornadoes, BESmart Innovation Challenge 2026 (Charlotte, NC). The demo facility is a simulated host campus in Shelby County, TN (Memphis, ZIP 38109).

Moyai checks, in real time, that an AI data center actually cuts its power when the grid asks. It records every reading in a tamper-evident log and issues a signed certificate the utility and county can check. Residents see the same facts in plain English and Spanish.

**All telemetry is simulated**: a 100 MW AI campus with closed-loop cooling and a 2-hour battery. What's real: the curtailment math, the hash-chained audit log and the Ed25519 signatures.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vitest · pnpm

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # core logic tests
```

1 real second = 1 simulated minute, so a 2-hour grid event takes 2 real minutes.

## Views

| Route | Who | What |
|---|---|---|
| `/operator` | Facility team | Load, battery, paused compute, coolant temps and flow, city water = 0 |
| `/utility` | Utility dispatcher | "Send grid alert" button, committed level, verified result |
| `/county` | County planner | Water vs permit, audit log status, signed certificate link, tamper demo |
| `/public` | Residents | Plain-language status, English/Español |

## API

| Method | Route | Does |
|---|---|---|
| GET | `/api/state` | Advances the sim to now; returns the latest reading, last 3 h, events, the ledger tail and the first broken ledger entry (`brokenAt`) |
| POST | `/api/event` | Starts a curtailment event `{ targetPct: 0.3, durationMin: 120 }` |
| GET | `/api/certificate/:id` | Signed certificate for a finished event |
| POST | `/api/tamper` | Demo: edits an old reading so the log shows it as broken |
| POST | `/api/reset` | Restarts the simulation |

## Code

- `lib/sim.ts`: the simulated campus. Battery covers the cut first, then paused AI training covers the rest.
- `lib/baseline.ts`: baseline and curtailment verification. Passes if load reaches the committed level (70% of baseline) within the 10-minute dispatch window and stays there. Also estimates the water saved at power plants (US average, 4.52 L/kWh, until a TVA factor is researched).
- `lib/ledger.ts`: SHA-256 hash chain plus Ed25519 signing.
- `components/useMoyai.ts`: every view polls `/api/state` each second, so a dispatch on one screen shows on all of them.

## Demo script (60 s)

1. Open `/utility` and `/public` side by side (the second on a phone if possible).
2. Click **Send grid alert**. The load drops to 70% of baseline within 10 simulated minutes, and the battery and paused compute share the cut.
3. Residents' view switches to "using less power to help the grid."
4. When the event ends, `/county` shows "Verified" and the signed certificate.
5. Click **Demo: tamper with a reading**. The audit log flips to "Broken at #N."

## Known shortcuts

- State lives in memory in one server process. **Demo from one machine** (`pnpm build && pnpm start`) or a single-instance host. On Vercel, separate serverless instances won't share state. Move the state to Redis/Postgres for that.
- The baseline is "the hour before the event." Real demand-response programs use multi-day, weather-adjusted baselines.
- The signing key is created fresh each time the server starts.

## Team split

| Person | Owns |
|---|---|
| 1 | Charts (live load vs baseline line on `/utility` and `/operator`), likely with Recharts |
| 2 | County view polish + certificate page |
| 3 | Resident view, Spanish copy, community battery co-ownership screen |
| 4 | Pitch, slides, fact checks (see `../reports/`) |
