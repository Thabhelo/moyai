# Moyai

Verified grid relief for host communities. Team Tornadoes, BESmart Innovation Challenge 2026 (Charlotte, NC).

Moyai checks, in real time, that an AI data center actually cuts its power when the grid asks. It records every reading in a tamper-evident log and issues a signed certificate the utility and county can check. Residents see the same facts in plain English and Spanish.

**All telemetry is simulated**: a 100 MW AI campus with closed-loop cooling and a 2-hour battery. What's real: the curtailment math, the hash-chained audit log and the Ed25519 signatures.

## Stack

Next.js 16 (static export) · TypeScript · Tailwind CSS 4 · Cloudflare Workers · Durable Objects with SQLite · Vitest · pnpm

The pages are static files served from Cloudflare's edge. One Worker (`worker/index.ts`) answers `/api/*` and passes each request to a Durable Object, a small always-consistent server that holds the simulated campus and a SQLite database of resident reports and applied cooling changes.

## Run it

```bash
pnpm install
pnpm preview      # builds, then serves site + API at http://localhost:8787
pnpm test         # core logic tests
pnpm deploy       # builds and publishes to Cloudflare
```

1 real second = 1 simulated minute, so a 30-minute grid signal takes 30 seconds.

## Deploys

Every push to `main` runs the tests and the build in GitHub Actions (`.github/workflows/ci.yml`), then publishes to https://moyai.fyi. The deploy step needs two repository secrets: `CLOUDFLARE_API_TOKEN` (a Cloudflare token with the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`. Without them the step is skipped with a warning.

## Pages

No sign-in. Each audience has its own address, and every page reads the same live record.

| Address | Who | Sees |
|---|---|---|
| `/` | Everyone | Landing page with three live numbers |
| `/community` | Residents | One plain-language page in English or Spanish, with a problem report form |
| `/county` | County government | Overview, Live readings, Who pays, Grid relief, Cooling, Batteries, Local jobs, Alerts |
| `/operator` | Data center and grid operations | Operations, Grid relief (sends the grid signal), Cooling (marks changes applied), Live readings, Our promises |
| `/training` | Everyone | How local people are trained as electricians and technicians, and the paycheck auto-invest example |

Census figures in `lib/data.ts` are real (U.S. Census ACS 2020-2024). Every other number is labeled "Demo data". The look is Plush UI (github.com/dominikmartn/plush-ui, MIT): its tokens, Open Runde font, and its real progress ring, progress bar and tabs, installed in `components/ui/` through the shadcn tool. On top sit a WebGL colour field (`components/shader.tsx`), liquid-glass surfaces and a pointer glow, all hand-written.

## API

| Method | Route | Does |
|---|---|---|
| GET | `/api/state?county=shelby` | Advances the sim to now; returns the latest reading, last 3 h, events, the ledger tail, the first broken ledger entry, that county's resident reports and applied cooling changes |
| POST | `/api/event` | Starts a grid signal `{ targetPct: 0.3, durationMin: 30 }` |
| GET | `/api/certificate/:id` | Signed certificate for a finished event |
| POST | `/api/report` | Saves a resident report `{ county, kind, note }` |
| POST | `/api/apply` | Marks a cooling recommendation applied `{ rec }` |
| POST | `/api/tamper` | Demo: edits an old reading so the log shows it as broken |
| POST | `/api/reset` | Restarts the simulation and clears reports |

## Code

- `lib/sim.ts`: the simulated campus. Battery covers the cut first, then paused AI training covers the rest.
- `lib/baseline.ts`: baseline and curtailment verification. Passes if load reaches the committed level (70% of baseline) within the 10-minute dispatch window and stays there. Also estimates the water saved at power plants (US average, 4.52 L/kWh, until a TVA factor is researched).
- `lib/ledger.ts`: SHA-256 hash chain plus Ed25519 signing.
- `worker/index.ts`: the Cloudflare Worker and Durable Object.
- `lib/data.ts`: the six host communities, cooling recommendations and demo figures.
- `app/page.tsx`: the landing page. `components/workspace.tsx`: the county, data center and community screens. `components/site.tsx`: navigation, footer and the rope animation. `components/useMoyai.ts` polls `/api/state` each second, so an action on one device shows on all of them.

## Demo script (3 minutes)

1. Open `/`. The rope ties the data center, the grid and the neighbors together.
2. County: show the community profile, the status strip and "Near limit" under Live readings.
3. Data center, Cooling: click **Mark applied**. The verified savings rise.
4. Data center, Grid relief: click **Send grid peak signal**. The load drops, the event is logged as Verified Met and the score rises from 87.5% to 88.9%.
5. County, Who pays: $0 added to household rates, plus the promises tracker.
6. Community: read the plain answer and send a noise report.
7. County, Alerts: the report is there.

## Known shortcuts

- The simulated campus lives in the Durable Object's memory. It restarts if nobody has the app open for a while. Resident reports and applied changes are in SQLite and stay.
- The baseline is "the hour before the event." Real demand-response programs use multi-day, weather-adjusted baselines.
- The signing key is created fresh each time the Durable Object starts.
- There is no sign-in yet. Anyone can open any workspace, and county scoping is not enforced on the server.

## Team split

| Person | Owns |
|---|---|
| 1 | Charts (live load vs baseline line on `/utility` and `/operator`), likely with Recharts |
| 2 | County view polish + certificate page |
| 3 | Resident view, Spanish copy, community battery co-ownership screen |
| 4 | Pitch, slides, fact checks (see `../reports/`) |
