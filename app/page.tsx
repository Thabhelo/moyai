"use client";
import { useEffect, useState } from "react";
import { COMMITMENTS, COUNTIES, PAST_EVENTS, RECS, REPORT_KINDS, US, levelOf, vulnerability, type County, type Level } from "@/lib/data";
import { Bar, Button, Card, LevelPill, Lines, Pill, Row } from "@/components/ui";
import { activeEvent, post, useMoyai, type MoyaiState } from "@/components/useMoyai";

type Role = "county" | "utility" | "operator" | "resident";
type Session = { role: Role; county: string };
type Page = "overview" | "live" | "cooling" | "grid" | "pays" | "community" | "jobs" | "alerts";

const ROLES: { id: Role; name: string; does: string }[] = [
  { id: "county", name: "County official", does: "See everything for your county" },
  { id: "utility", name: "Utility engineer", does: "Send grid signals and check the response" },
  { id: "operator", name: "Data center operator", does: "Apply savings and prove them" },
  { id: "resident", name: "Resident", does: "Plain answers about the data center near you" },
];
const PAGES: Record<Page, string> = { overview: "Overview", live: "Live readings", cooling: "Cooling", grid: "Grid relief", pays: "Who pays", community: "Batteries", jobs: "Local jobs", alerts: "Alerts" };
const ACCESS: Record<Exclude<Role, "resident">, Page[]> = {
  county: ["overview", "live", "cooling", "grid", "pays", "community", "jobs", "alerts"],
  utility: ["overview", "live", "grid", "pays"],
  operator: ["overview", "live", "cooling", "grid", "pays"],
};

const n0 = (n: number) => Math.round(n).toLocaleString("en-US");
const n1 = (n: number) => n.toFixed(1);
const usd = (n: number) => `$${n0(n)}`;

/** Numbers every page shares, worked out from the latest campus reading. */
function facts(s: MoyaiState) {
  const t = s.now;
  const heat = t.facilityMW / 89.6;
  const applied = RECS.filter((r) => s.applied.some((a) => a.rec === r.id));
  const live = s.events.filter((e) => e.verification);
  const met = PAST_EVENTS.filter((e) => e.met).length + live.filter((e) => e.verification!.compliant).length;
  const total = PAST_EVENTS.length + live.length;
  return {
    power: t.facilityMW,
    cooling: t.facilityMW * (1 - 1 / 1.12),
    water: 0.41 * heat - applied.reduce((a, r) => a + r.gal, 0) / 1e6,
    noise: 47 + 1.5 * Math.sin(t.min / 11),
    genHours: 92,
    reliability: (met / total) * 100,
    met,
    total,
    applied,
    logOk: s.brokenAt === null,
  };
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    try {
      setSession(JSON.parse(localStorage.getItem("moyai") ?? "null"));
    } catch {
      setSession(null);
    }
  }, []);
  const save = (s: Session | null) => {
    setSession(s);
    try {
      localStorage.setItem("moyai", JSON.stringify(s));
    } catch {}
  };
  if (session === undefined) return null;
  if (!session) return <SignIn onDone={save} />;
  const county = COUNTIES.find((c) => c.id === session.county) ?? COUNTIES[0];
  return <Shell role={session.role} county={county} onSwitch={() => save(null)} />;
}

function SignIn({ onDone }: { onDone: (s: Session) => void }) {
  const [role, setRole] = useState<Role>("county");
  const [county, setCounty] = useState("shelby");
  const [zip, setZip] = useState("38109");
  const match = COUNTIES.find((c) => c.zip === zip.trim());
  return (
    <main className="enter mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-4xl font-semibold">Moyai</h1>
        <p className="mt-2 text-lg">Verified grid relief for the communities that host AI data centers.</p>
        <p className="mt-2 text-ink2">Moyai checks that a data center really cuts power and water use when it says it does. The county, the utility and the neighbors all see the same proof.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)} aria-pressed={role === r.id} className={`rounded-xl p-4 text-left ${role === r.id ? "bg-accent text-white dark:text-[#0e1615]" : "bg-card"}`}>
            <div className="font-medium">{r.name}</div>
            <div className={`text-sm ${role === r.id ? "opacity-85" : "text-ink2"}`}>{r.does}</div>
          </button>
        ))}
      </div>
      {role === "resident" ? (
        <label className="flex flex-col gap-1 text-sm text-ink2">
          Your ZIP code
          <input value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" maxLength={5} className="num rounded-lg bg-card px-3 py-2 text-base text-ink" />
          {!match && <span>We do not cover that ZIP code yet. Try 38109.</span>}
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm text-ink2">
          Your county
          <select value={county} onChange={(e) => setCounty(e.target.value)} className="rounded-lg bg-card px-3 py-2 text-base text-ink">
            {COUNTIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-center gap-3">
        <Button disabled={role === "resident" && !match} onClick={() => onDone({ role, county: role === "resident" ? match!.id : county })}>Sign in</Button>
        <span className="text-sm text-ink3">Demo sign-in. No password needed.</span>
      </div>
    </main>
  );
}

function Shell({ role, county, onSwitch }: { role: Role; county: County; onSwitch: () => void }) {
  const s = useMoyai(county.id);
  const pages = role === "resident" ? [] : ACCESS[role];
  const [page, setPage] = useState<Page>("overview");
  const alerts = s ? s.reports.length + 2 : 0;
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
      {role !== "resident" && (
        <nav aria-label="Pages" className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto bg-card px-2 py-1 md:static md:w-52 md:shrink-0 md:flex-col md:gap-1 md:bg-transparent md:px-3 md:py-6">
          <div className="hidden px-3 pb-4 font-head text-xl font-semibold md:block">Moyai</div>
          {pages.map((p) => (
            <button key={p} onClick={() => setPage(p)} aria-current={page === p ? "page" : undefined} className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${page === p ? "bg-accent-soft font-medium text-accent" : "text-ink2"}`}>
              {PAGES[p]}
              {p === "alerts" && alerts > 0 && <span className="num text-xs">{alerts}</span>}
            </button>
          ))}
        </nav>
      )}
      <div className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <span className="text-ink2">Signed in to </span>
            <span className="font-medium">{county.name}</span>
            <span className="text-ink3"> · {ROLES.find((r) => r.id === role)!.name}</span>
          </div>
          <button onClick={onSwitch} className="text-accent underline-offset-4 hover:underline">Switch (demo only)</button>
        </header>
        {!s ? (
          <div className="h-40 animate-pulse rounded-xl bg-card" aria-label="Loading" />
        ) : role === "resident" ? (
          <Resident s={s} county={county} />
        ) : (
          <main key={page} className="enter flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">{PAGES[page]}</h1>
            {page === "overview" && <Overview s={s} county={county} />}
            {page === "live" && <Live s={s} />}
            {page === "cooling" && <Cooling s={s} canApply={role === "operator" || role === "county"} />}
            {page === "grid" && <Grid s={s} />}
            {page === "pays" && <Pays />}
            {page === "community" && <Community s={s} county={county} />}
            {page === "jobs" && <Jobs county={county} />}
            {page === "alerts" && <Alerts s={s} />}
          </main>
        )}
      </div>
    </div>
  );
}

function Overview({ s, county }: { s: MoyaiState; county: County }) {
  const f = facts(s);
  const strip: [string, Level, string?][] = [
    ["Power", levelOf(f.power, 110)],
    ["Water", levelOf(f.water, 0.5)],
    ["Cooling", "ok"],
    ["Noise", levelOf(f.noise, 55)],
    ["Generator hours", levelOf(f.genHours, 100)],
    ["Grid relief", f.reliability >= 85 ? "ok" : "warn", `${n0(f.reliability)}% met`],
    ["Cost protection", "ok", "$0 to homes"],
    ["Local jobs", "warn", "184 of 300"],
  ];
  return (
    <>
      <Card title="Status today">
        <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          {strip.map(([name, level, word]) => (
            <div key={name} className="flex flex-col items-start gap-1 border-line py-2">
              <span className="text-sm text-ink2">{name}</span>
              {word ? <Pill tone={level}>{word}</Pill> : <LevelPill level={level} />}
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today in plain numbers">
          <p className="text-lg">
            The campus is using as much power as <b className="num font-medium">{n0((f.power * 1000) / 1.2)}</b> homes and as much water as <b className="num font-medium">{n0((f.water * 1e6) / 82)}</b> people.
          </p>
          <p className="mt-2 text-sm text-ink3">Based on 1.2 kilowatts per home and 82 gallons per person a day.</p>
        </Card>
        <Card title={`Who lives here: ${county.place}`} demo={false}>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="num text-4xl font-medium">{vulnerability(county)}</span>
            <span className="text-sm text-ink2">Community Vulnerability Score, out of 100. Higher means residents have less room to absorb new costs.</span>
          </div>
          <Compare label="Poverty" value={county.poverty} us={US.poverty} max={40} text={`${county.poverty}%`} />
          <Compare label="Median household income" value={county.income} us={US.income} max={100000} text={usd(county.income)} />
          <Compare label="Bachelor's degree or higher" value={county.bachelors} us={US.bachelors} max={50} text={`${county.bachelors}%`} />
          <p className="mt-3 text-sm text-ink2">
            <span className="num">{n0(county.pop)}</span> people in ZIP <span className="num">{county.zip}</span>
            {county.zipInferred && " (ZIP inferred from the site location)"}. {county.race.map(([g, p]) => `${p}% ${g}`).join(", ")}.
          </p>
          <p className="mt-2 text-xs text-ink3">U.S. Census ACS 2020-2024. The dark tick marks the U.S. figure. Reported operator: {county.operator}. Readings in this app come from a simulated host campus, not from that company.</p>
        </Card>
      </div>
    </>
  );
}

function Compare({ label, value, us, max, text }: { label: string; value: number; us: number; max: number; text: string }) {
  return (
    <div className="py-1.5">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink2">{label}</span>
        <span className="num">{text}</span>
      </div>
      <Bar value={value} max={max} mark={us} />
    </div>
  );
}

function Live({ s }: { s: MoyaiState }) {
  const f = facts(s);
  const h = s.history.slice(-48 * 3);
  const mw = h.map((t) => t.facilityMW);
  const cards: { name: string; value: string; unit: string; limit: string; level: Level; line: number[] }[] = [
    { name: "Power draw", value: n1(f.power), unit: "megawatts (MW)", limit: "Permit 110 MW", level: levelOf(f.power, 110), line: mw },
    { name: "Cooling power", value: n1(f.cooling), unit: `MW, ${n0((f.cooling / f.power) * 100)}% of the load`, limit: "No limit set", level: "ok", line: mw.map((v) => v * 0.107) },
    { name: "Water taken", value: f.water.toFixed(2), unit: "million gallons a day", limit: "Permit 0.50", level: levelOf(f.water, 0.5), line: mw.map((v) => (0.41 * v) / 89.6) },
    { name: "Energy efficiency", value: "1.12", unit: "total power ÷ computing power (PUE)", limit: "Target 1.40 or lower", level: "ok", line: mw.map(() => 1.12) },
    { name: "Night noise at the fence", value: n0(f.noise), unit: "decibels (dB)", limit: "Limit 55 dB", level: levelOf(f.noise, 55), line: h.map((t) => 47 + 1.5 * Math.sin(t.min / 11)) },
    { name: "Backup generator run time", value: n0(f.genHours), unit: "hours this year", limit: "Air permit 100 hours", level: levelOf(f.genHours, 100), line: h.map((_, i) => 90 + (i / h.length) * 2) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.name} title={c.name}>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="num text-3xl font-medium">{c.value}</div>
              <div className="text-sm text-ink2">{c.unit}</div>
            </div>
            <LevelPill level={c.level} />
          </div>
          <Lines series={[{ values: c.line }]} label={`${c.name}, recent trend`} />
          <div className="text-xs text-ink3">{c.limit}</div>
        </Card>
      ))}
    </div>
  );
}

function Cooling({ s, canApply }: { s: MoyaiState; canApply: boolean }) {
  const f = facts(s);
  const mw = f.applied.reduce((a, r) => a + r.mw, 0);
  const gal = f.applied.reduce((a, r) => a + r.gal, 0);
  return (
    <>
      <Card title="Verified savings this month">
        <div className="grid grid-cols-3 gap-4">
          <Big value={n0(118000 + gal)} unit="gallons of water saved" />
          <Big value={n0(212 + mw * 24)} unit="megawatt-hours (MWh) of cooling saved" />
          <Big value={n1(1.9 + mw)} unit="MW cut from peak demand" />
        </div>
        <p className="mt-3 text-sm text-ink2">Each saving is checked against what the campus would have used in the same weather with the same computing load.</p>
      </Card>
      <Card title="Recommended changes">
        <ul>
          {RECS.map((r) => {
            const at = s.applied.find((a) => a.rec === r.id)?.ts;
            const status = !at ? "Recommended" : Date.now() - at > 15000 ? "Verified" : "Applied";
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 first:border-0">
                <div className="min-w-0 flex-1 basis-64">
                  <div>{r.action}</div>
                  <div className="text-sm text-ink2">
                    {r.why}. Saves about <span className="num">{r.mw}</span> MW and <span className="num">{n0(r.gal)}</span> gallons a day.
                  </div>
                </div>
                {at ? <Pill tone={status === "Verified" ? "ok" : "info"}>{status}</Pill> : canApply ? <Button quiet onClick={() => post("apply", { rec: r.id })}>Mark applied</Button> : <Pill tone="info">Recommended</Pill>}
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="text-sm text-ink2">Honest limit: cooling savings alone cannot promise unchanged bills. A 100 MW campus that uses 10 MW for cooling and cuts it by 20% still draws 98 MW. Bills also depend on utility rates and on who pays for grid upgrades.</p>
    </>
  );
}

const Big = ({ value, unit }: { value: string; unit: string }) => (
  <div>
    <div className="num text-2xl font-medium sm:text-3xl">{value}</div>
    <div className="text-sm text-ink2">{unit}</div>
  </div>
);

function Grid({ s }: { s: MoyaiState }) {
  const f = facts(s);
  const live = activeEvent(s);
  const [error, setError] = useState("");
  const send = async () => {
    const r = await post("event", { targetPct: 0.3, durationMin: 30 });
    setError(r.ok ? "" : "A grid signal is already running.");
  };
  const done = s.events.filter((e) => e.verification).toReversed();
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="The promise" className="lg:col-span-2">
          <p className="text-lg">Drop to 70% of normal power within 10 minutes of a grid signal, for up to 40 hours a year.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={send} disabled={!!live}>{live ? "Signal running, load is dropping" : "Send grid peak signal"}</Button>
            <span className="text-sm text-ink3">{error || "1 second here is 1 minute at the campus."}</span>
          </div>
        </Card>
        <Card title="Kept its promise">
          <div className="num text-4xl font-medium">{n1(f.reliability)}%</div>
          <div className="text-sm text-ink2">
            <span className="num">{f.met}</span> of <span className="num">{f.total}</span> signals met
          </div>
          <div className="mt-2"><Pill tone={f.reliability >= 85 && f.logOk ? "ok" : "warn"}>{f.reliability >= 85 && f.logOk ? "Ready to connect sooner" : "Needs review"}</Pill></div>
        </Card>
      </div>
      <Card title="Power draw, last 3 hours">
        <div className="mb-1 flex items-baseline gap-4 text-sm">
          <span><span className="num text-2xl font-medium">{n1(s.now.facilityMW)}</span> MW now</span>
          <span className="text-ink2">Expected without a signal: <span className="num">{n1(s.now.uncutMW)}</span> MW (dashed)</span>
        </div>
        <Lines height={150} label="Power draw against the expected level" series={[{ values: s.history.map((t) => t.uncutMW), dashed: true, muted: true }, { values: s.history.map((t) => t.facilityMW) }]} />
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div><span className="num">{n1(Math.max(0, s.now.batteryMW))}</span> MW from the battery (<span className="num">{n0(s.now.batterySoc * 100)}</span>% full)</div>
          <div><span className="num">{n1(s.now.computeShedMW)}</span> MW of AI training paused</div>
          <div><span className="num">{n1(s.now.uncutMW - s.now.facilityMW > 0.5 ? s.now.uncutMW - s.now.facilityMW : 0)}</span> MW relief in total</div>
        </div>
      </Card>
      <Card title="Signal log">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-ink3">
              <tr>{["Date", "Reason", "MW asked", "MW delivered", "Response", "Result"].map((h) => <th key={h} className="py-1 pr-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody>
              {live && <LogRow date="Now" reason="Grid peak signal" asked={live.baselineMW * live.targetPct} result="Running" />}
              {done.map((e) => (
                <LogRow key={e.id} date="Today" reason="Grid peak signal" asked={e.baselineMW * e.targetPct} delivered={e.verification!.avgShedMW} ramp={e.verification!.rampMinutes} result={e.verification!.compliant ? "Met" : "Short"} cert={e.id} />
              ))}
              {PAST_EVENTS.map((e) => <LogRow key={e.date} date={e.date} reason={e.reason} asked={e.asked} delivered={e.delivered} ramp={e.ramp} result={e.met ? "Met" : "Short"} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function LogRow({ date, reason, asked, delivered, ramp, result, cert }: { date: string; reason: string; asked: number; delivered?: number; ramp?: number | null; result: "Met" | "Short" | "Running"; cert?: number }) {
  return (
    <tr className="border-t border-line">
      <td className="num py-2 pr-3">{date}</td>
      <td className="pr-3">{reason}</td>
      <td className="num pr-3">{n1(asked)}</td>
      <td className="num pr-3">{delivered === undefined ? "…" : n1(delivered)}</td>
      <td className="num pr-3">{ramp == null ? "…" : `${ramp} min`}</td>
      <td>
        <Pill tone={result === "Met" ? "ok" : result === "Short" ? "bad" : "info"}>{result === "Running" ? "Running" : `Verified ${result}`}</Pill>
        {cert && <a href={`/api/certificate/${cert}`} target="_blank" className="ml-2 text-accent underline-offset-4 hover:underline">Signed proof</a>}
      </td>
    </tr>
  );
}

function Pays() {
  return (
    <>
      <Card title="Grid upgrades for this campus">
        <div className="mb-3 flex items-baseline gap-3">
          <span className="num text-4xl font-medium">$0</span>
          <span className="text-ink2">of upgrade costs added to household power rates</span>
        </div>
        <Row label="New substation and power line">$48,000,000</Row>
        <Row label="Share paid by the operator">100%</Row>
        <Row label="Large-user rate with a minimum bill">Yes</Row>
      </Card>
      <Card title="Promises in the host agreement">
        <ul>
          {COMMITMENTS.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2.5 first:border-0">
              <div className="min-w-0 flex-1 basis-56">
                <div>{c.name}</div>
                <div className="text-sm text-ink2">{c.detail}. Evidence: {c.evidence.toLowerCase()}</div>
              </div>
              <Pill tone={c.status === "Met" ? "ok" : c.status === "Breached" ? "bad" : c.status === "At risk" ? "warn" : "info"}>{c.status}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

const BATTERY_COST = 14_400_000;
const BATTERY_REVENUE = 1_200_000;

function Community({ s, county }: { s: MoyaiState; county: County }) {
  const [invest, setInvest] = useState(500);
  const [share, setShare] = useState(5);
  const pool = (share / 100) * BATTERY_COST; // what residents can buy in total
  const yearly = (invest / pool) * (share / 100) * BATTERY_REVENUE;
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Community battery">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="num text-4xl font-medium">{n0(s.now.batterySoc * 100)}%</span>
            <span className="text-ink2">charged</span>
          </div>
          <Bar value={s.now.batterySoc * 100} max={100} mark={30} />
          <p className="mb-2 mt-2 text-sm text-ink2">The tick marks the 30% kept back for local outages.</p>
          <Row label="Size">12 MW for 2 hours</Row>
          <Row label="Times it helped the grid this year">{PAST_EVENTS.length + s.events.length}</Row>
          <Row label="Earned from the grid this year">{usd(412000)}</Row>
        </Card>
        <Card title="Bill protection">
          <div className="num text-4xl font-medium">$6</div>
          <p className="text-ink2">credit on every household bill each month</p>
          <p className="mt-3">This protection covers every resident of {county.name}, whether or not you own shares.</p>
        </Card>
      </div>
      <Card title="Own a share of the battery">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <label className="text-sm text-ink2">
              You invest <span className="num text-base text-ink">{usd(invest)}</span>
              <input type="range" min={100} max={2500} step={50} value={invest} onChange={(e) => setInvest(Math.min(2500, +e.target.value))} />
            </label>
            <label className="text-sm text-ink2">
              Share of the battery open to residents <span className="num text-base text-ink">{share}%</span>
              <input type="range" min={1} max={10} value={share} onChange={(e) => setShare(+e.target.value)} />
            </label>
          </div>
          <div>
            <Row label="You receive each year">{usd(yearly)}</Row>
            <Row label="Yearly return">{n1((yearly / invest) * 100)}%</Row>
            <Row label="Neighbors who can join at this amount">{n0(pool / invest)}</Row>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink3">Example only, not an offer. U.S. crowdfunding rules cap a raise at $5 million a year and limit most people to the greater of $2,500 or 5% of their income or net worth. A real offering needs a registered funding portal and legal review.</p>
      </Card>
    </>
  );
}

function Jobs({ county }: { county: County }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Local hiring promise">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="num text-4xl font-medium">184</span>
            <span className="text-ink2">of 300 promised local hires</span>
          </div>
          <Bar value={184} max={300} />
          <p className="mt-2 text-sm text-ink2"><span className="num">61%</span> of hires live in ZIP <span className="num">{county.zip}</span> or next to it.</p>
        </Card>
        <Card title="Paid training">
          <div className="grid grid-cols-4 gap-2">
            {[["60", "open seats"], ["42", "enrolled"], ["28", "graduated"], ["21", "placed"]].map(([v, l]) => <Big key={l} value={v} unit={l} />)}
          </div>
          <p className="mt-3 text-sm text-ink2">Three tracks: high-voltage electrician, liquid-cooling technician, and commissioning (testing new equipment before it goes live).</p>
        </Card>
      </div>
      <Card title="Partners and support" demo={false}>
        <p>Local historically Black colleges, community colleges and the electrical workers union run the training.</p>
        <p className="mt-2 text-ink2">Support offered: high school equivalency classes, fair-chance hiring, paid stipends, and help with childcare and transit.</p>
      </Card>
    </>
  );
}

function Alerts({ s }: { s: MoyaiState }) {
  const kind = (id: string) => REPORT_KINDS.find((k) => k.id === id)?.en ?? id;
  return (
    <>
      <Card title="Needs attention">
        <ul>
          {s.reports.map((r) => (
            <Alert key={r.id} tone="warn" tag="Resident report" when={new Date(r.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} text={`${kind(r.kind)}${r.note ? `: ${r.note}` : ""}`} />
          ))}
          <Alert tone="warn" tag="Forecast" when="In 72 hours" text="Power draw is forecast to reach 96% of the permit during Thursday's heat" />
          <Alert tone="warn" tag="Permit" when="Today" text="Backup generators have used 92 of 100 permitted hours" />
          <Alert tone="ok" tag="Monthly report" when="Nov 1" text="October savings verified: 118,000 gallons of water and 212 MWh" />
        </ul>
      </Card>
      <Card title="Record book" demo={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Pill tone={s.brokenAt === null ? "ok" : "bad"}>{s.brokenAt === null ? "Intact" : `Changed at entry ${s.brokenAt}`}</Pill>
            <span className="ml-2 text-sm text-ink2"><span className="num">{s.ledgerLength}</span> entries. Each entry carries a fingerprint of the one before it, so an edited reading shows up at once.</span>
          </div>
          <div className="flex gap-2">
            <Button quiet onClick={() => post("tamper")}>Demo: edit an old reading</Button>
            <Button quiet onClick={() => post("reset")}>Reset demo</Button>
          </div>
        </div>
        <ol className="num mt-3 text-xs text-ink2">
          {s.ledger.toReversed().slice(0, 5).map((e) => (
            <li key={e.seq} className="truncate border-t border-line py-1">#{e.seq} · {e.type.replace("_", " ")} · {e.hash.slice(0, 20)}</li>
          ))}
        </ol>
      </Card>
    </>
  );
}

const Alert = ({ tone, tag, when, text }: { tone: Level; tag: string; when: string; text: string }) => (
  <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line py-2.5 first:border-0">
    <Pill tone={tone}>{tag}</Pill>
    <span className="min-w-0 flex-1 basis-56">{text}</span>
    <span className="num text-xs text-ink3">{when}</span>
  </li>
);

const COPY = {
  en: {
    q: "Is the data center near me following the rules?", yes: "Yes", no: "Not entirely",
    yesWhy: "Power, water and noise are all inside their permits today.", noWhy: "A past reading in its record book was changed. The county has been told.",
    today: (h: string, p: string) => `Today it used as much electricity as ${h} homes and as much water as ${p} people.`,
    bill: "Your power bill", billBody: "$0 of the grid upgrade costs were added to household rates. This protection covers everyone.",
    water: "Water saved this month", waterBody: (g: string) => `${g} gallons, by cooling the buildings in smarter ways.`,
    battery: "Community battery", batteryBody: "It last helped the grid on Nov 12 and has earned the community $412,000 this year.",
    jobs: "Local jobs", jobsBody: "184 neighbors hired so far. Paid training has 60 open seats. Ask at your community college.",
    report: "Report a problem", note: "Add a note (optional)", send: "Send report", sent: "Thank you. The county can see your report now.",
    lang: "Español", big: "Larger text", demo: "Demo data",
  },
  es: {
    q: "¿El centro de datos cerca de mí cumple las reglas?", yes: "Sí", no: "No del todo",
    yesWhy: "Hoy la electricidad, el agua y el ruido están dentro de sus permisos.", noWhy: "Alguien cambió una lectura en su libro de registros. El condado ya fue avisado.",
    today: (h: string, p: string) => `Hoy usó tanta electricidad como ${h} hogares y tanta agua como ${p} personas.`,
    bill: "Su factura de luz", billBody: "$0 de los costos de mejora de la red se sumaron a las tarifas de los hogares. Esta protección cubre a todos.",
    water: "Agua ahorrada este mes", waterBody: (g: string) => `${g} galones, al enfriar los edificios de forma más inteligente.`,
    battery: "Batería comunitaria", batteryBody: "Ayudó a la red por última vez el 12 de noviembre y ha ganado $412,000 para la comunidad este año.",
    jobs: "Empleos locales", jobsBody: "184 vecinos contratados hasta ahora. Hay 60 cupos de capacitación pagada. Pregunte en su colegio comunitario.",
    report: "Reportar un problema", note: "Agregue una nota (opcional)", send: "Enviar reporte", sent: "Gracias. El condado ya puede ver su reporte.",
    lang: "English", big: "Texto más grande", demo: "Datos de demostración",
  },
};

function Resident({ s, county }: { s: MoyaiState; county: County }) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [large, setLarge] = useState(false);
  const [kind, setKind] = useState("noise");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const t = COPY[lang];
  const f = facts(s);
  const ok = f.logOk && f.power <= 110 && f.water <= 0.5 && f.noise <= 55;
  const send = async () => {
    const r = await post("report", { county: county.id, kind, note });
    if (r.ok) {
      setSent(true);
      setNote("");
    }
  };
  return (
    <main lang={lang} className={`enter mx-auto flex max-w-xl flex-col gap-4 ${large ? "large" : ""}`}>
      <div className="flex justify-end gap-4 text-sm">
        <button onClick={() => setLarge(!large)} aria-pressed={large} className="text-accent">{t.big}</button>
        <button onClick={() => setLang(lang === "en" ? "es" : "en")} className="text-accent">{t.lang}</button>
      </div>
      <Card>
        <p className="text-ink2">{t.q}</p>
        <div className="my-1 font-head text-5xl font-semibold" style={{ color: ok ? "var(--ok)" : "var(--warn)" }}>{ok ? t.yes : t.no}</div>
        <p>{ok ? t.yesWhy : t.noWhy}</p>
        <p className="mt-3 text-ink2">{t.today(n0((f.power * 1000) / 1.2), n0((f.water * 1e6) / 82))}</p>
        <p className="mt-2 text-xs text-ink3">{t.demo}</p>
      </Card>
      {([[t.bill, t.billBody], [t.water, t.waterBody(n0(118000 + f.applied.reduce((a, r) => a + r.gal, 0)))], [t.battery, t.batteryBody], [t.jobs, t.jobsBody]] as const).map(([title, body]) => (
        <Card key={title}>
          <h2 className="font-medium">{title}</h2>
          <p className="text-ink2">{body}</p>
        </Card>
      ))}
      <Card>
        <h2 className="mb-2 font-medium">{t.report}</h2>
        <div className="flex flex-wrap gap-2">
          {REPORT_KINDS.map((k) => (
            <button key={k.id} onClick={() => { setKind(k.id); setSent(false); }} aria-pressed={kind === k.id} className={`rounded-full px-3 py-1.5 text-sm ${kind === k.id ? "bg-accent text-white dark:text-[#0e1615]" : "bg-accent-soft text-accent"}`}>{k[lang]}</button>
          ))}
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder={t.note} aria-label={t.note} className="my-3 w-full rounded-lg bg-canvas px-3 py-2" />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={send}>{t.send}</Button>
          {sent && <span role="status" className="text-sm" style={{ color: "var(--ok)" }}>{t.sent}</span>}
        </div>
      </Card>
    </main>
  );
}
