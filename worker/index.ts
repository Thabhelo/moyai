import { DurableObject } from "cloudflare:workers";
import { certificate, reset, startEvent, tick } from "../lib/sim";
import { verifyChain } from "../lib/ledger";

type Env = { CAMPUS: DurableObjectNamespace<Campus>; ASSETS: Fetcher };

const COUNTIES = ["shelby", "richland", "taylor", "laramie", "pottawattamie", "wasco"];
const KINDS = ["noise", "exhaust", "water", "traffic", "power"];
const RECS = ["setpoint", "economizer", "precool", "coils", "effluent"];

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

// One Durable Object holds the simulated campus in memory and keeps resident reports
// and applied cooling changes in its built-in SQLite database, so they survive restarts.
export class Campus extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, county TEXT NOT NULL, kind TEXT NOT NULL, note TEXT NOT NULL, ts INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS applied (rec TEXT PRIMARY KEY, ts INTEGER NOT NULL)");
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\//, "");
    const sql = this.ctx.storage.sql;
    const post = req.method === "POST";
    const body = post ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {};

    if (path === "state" && !post) {
      const s = tick();
      const county = url.searchParams.get("county") ?? "";
      return json({
        now: s.history.at(-1),
        history: s.history.slice(-180).map((t) => ({ min: t.min, facilityMW: t.facilityMW, uncutMW: t.uncutMW })),
        events: s.events,
        ledger: s.ledger.slice(-8),
        ledgerLength: s.ledger.length,
        brokenAt: verifyChain(s.ledger),
        reports: sql.exec("SELECT id, kind, note, ts FROM reports WHERE county = ? ORDER BY id DESC LIMIT 20", county).toArray(),
        applied: sql.exec("SELECT rec, ts FROM applied").toArray(),
      });
    }
    if (path === "event" && post) {
      try {
        return json(startEvent(body.targetPct as number, body.durationMin as number));
      } catch (e) {
        return json({ error: (e as Error).message }, e instanceof RangeError ? 400 : 409);
      }
    }
    if (path.startsWith("certificate/") && !post) {
      const cert = certificate(Number(path.slice(12)));
      return cert ? json(cert) : json({ error: "no finished event with that id" }, 404);
    }
    if (path === "report" && post) {
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 280) : "";
      if (!COUNTIES.includes(body.county as string) || !KINDS.includes(body.kind as string)) return json({ error: "unknown county or problem type" }, 400);
      sql.exec("INSERT INTO reports (county, kind, note, ts) VALUES (?, ?, ?, ?)", body.county, body.kind, note, Date.now());
      return json({ ok: true });
    }
    if (path === "apply" && post) {
      if (!RECS.includes(body.rec as string)) return json({ error: "unknown recommendation" }, 400);
      sql.exec("INSERT OR IGNORE INTO applied (rec, ts) VALUES (?, ?)", body.rec, Date.now());
      return json({ ok: true });
    }
    if (path === "tamper" && post) {
      // Demo only: quietly edit an old meter reading so the audit log shows it was changed.
      const reading = tick().ledger.findLast((e) => e.type === "reading");
      if (!reading) return json({ error: "no readings yet" }, 409);
      reading.payload.facilityMW = Number(reading.payload.facilityMW) - 5;
      return json({ tamperedSeq: reading.seq });
    }
    if (path === "reset" && post) {
      reset();
      sql.exec("DELETE FROM reports");
      sql.exec("DELETE FROM applied");
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  }
}

export default {
  fetch(req: Request, env: Env) {
    // Pages are static files; only /api/* needs the campus.
    if (!new URL(req.url).pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    return env.CAMPUS.get(env.CAMPUS.idFromName("campus")).fetch(req);
  },
} satisfies ExportedHandler<Env>;
