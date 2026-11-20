import { DurableObject } from "cloudflare:workers";
import { certificate, reset, startEvent, tick } from "../lib/sim";
import { verifyChain } from "../lib/ledger";

type Env = { CAMPUS: DurableObjectNamespace<Campus>; ASSETS: Fetcher; DEMO_KEY?: string };

const COUNTIES = ["shelby", "richland", "taylor", "laramie", "pottawattamie", "wasco"];
const KINDS = ["noise", "exhaust", "water", "traffic", "power"];
const RECS = ["setpoint", "economizer", "precool", "coils", "effluent"];
const COURSES = ["electrician", "technician", "commissioning"];
const ZIPS = ["38109", "71269", "79601", "82007", "51501", "97058"];

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
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS signups (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, detail TEXT NOT NULL, ts INTEGER NOT NULL)");
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
        signups: {
          apply: sql.exec("SELECT COUNT(*) AS n FROM signups WHERE kind = 'apply'").one().n,
          invest: sql.exec("SELECT COUNT(*) AS n FROM signups WHERE kind = 'invest'").one().n,
        },
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
    if (path === "signup" && post) {
      // A training application (course and ZIP code) or a paycheck share to invest (1 to 10 percent).
      const ok =
        body.kind === "apply"
          ? COURSES.includes(body.course as string) && ZIPS.includes(body.zip as string)
          : body.kind === "invest" && Number.isInteger(body.pct) && (body.pct as number) >= 1 && (body.pct as number) <= 10;
      if (!ok) return json({ error: "check the course, ZIP code or share" }, 400);
      const detail = body.kind === "apply" ? `${body.course}:${body.zip}` : `${body.pct}`;
      sql.exec("INSERT INTO signups (kind, detail, ts) VALUES (?, ?, ?)", body.kind, detail, Date.now());
      return json({ place: sql.exec("SELECT COUNT(*) AS n FROM signups WHERE kind = ?", body.kind).one().n });
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
      sql.exec("DELETE FROM signups");
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  }
}

// Resetting wipes resident reports and tampering edits the log, so the public cannot call either.
// They need the DEMO_KEY secret (.dev.vars locally, `wrangler secret put DEMO_KEY` in production); with no secret set they are off.
const DEMO_ONLY = ["/api/tamper", "/api/reset"];
async function demoAllowed(req: Request, env: Env) {
  const given = req.headers.get("x-demo-key") ?? "";
  if (!env.DEMO_KEY || !given) return false;
  const [a, b] = await Promise.all([given, env.DEMO_KEY].map((v) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(v))));
  return crypto.subtle.timingSafeEqual(a, b);
}

export default {
  async fetch(req: Request, env: Env) {
    const { pathname } = new URL(req.url);
    // Pages are static files; only /api/* needs the campus.
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (DEMO_ONLY.includes(pathname) && !(await demoAllowed(req, env))) return json({ error: "Demo controls need the presenter key." }, 403);
    return env.CAMPUS.get(env.CAMPUS.idFromName("campus")).fetch(req);
  },
} satisfies ExportedHandler<Env>;
