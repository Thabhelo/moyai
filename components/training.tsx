"use client";
import { useState } from "react";
import { Card, Metric, Ring, Row } from "@/components/kit";
import { Footer, Nav, Reveal } from "@/components/site";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const STEPS = [
  { name: "Apply", body: "Open to anyone who lives in a ZIP code next to the data center. No degree is needed. A high school equivalency class and fair-chance hiring are part of the program." },
  { name: "Train, and get paid for it", body: "Trainees earn a stipend while they learn, with help for childcare and transit. Local colleges and the electrical workers union teach the courses." },
  { name: "Get hired", body: "The host agreement commits the operator to 300 local hires. Graduates go to the front of that line." },
  { name: "Invest automatically", body: "A worker can choose to send a small share of each paycheck into the community battery. The battery earns money when the grid uses it, and owners are paid from that." },
];

const TRACKS = [
  { name: "Electrician", body: "Installs and maintains the high-voltage equipment that brings power into the site.", weeks: 40 },
  { name: "Data center technician", body: "Keeps the liquid cooling and the server halls running day to day.", weeks: 24 },
  { name: "Commissioning technician", body: "Tests new equipment before it goes live.", weeks: 16 },
];

// Same demo figures as the Batteries page: $1.2M of yearly grid revenue on a $14.4M battery.
const RETURN = 1_200_000 / 14_400_000;
const YEARLY_CAP = 2500;

export function Training() {
  const [pay, setPay] = useState(63190);
  const [share, setShare] = useState(3);
  const yearly = Math.min(YEARLY_CAP, (pay * share) / 100);
  const capped = (pay * share) / 100 > YEARLY_CAP;
  const owned5 = yearly * 5;
  return (
    <>
      <Nav current="training" />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-28 pt-36 sm:px-10">
        <header className="enter max-w-3xl pb-6">
          <p className="text-ink2">Local jobs</p>
          <h1 className="mt-1 text-4xl font-bold sm:text-6xl">Training local people for data center jobs</h1>
          <p className="mt-5 text-xl text-ink2">
            New data centers cannot find enough electricians and technicians. Moyai trains people who already live next to the site, and gives them a way to own part of the battery that serves it.
          </p>
        </header>

        <Reveal>
          <Card title="Where the program stands">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric name="Local hires" value="184" of="of 300 promised" pct={61} tone="warn" word="Pending" />
              <Metric name="Training seats filled" value="42" of="of 60" pct={70} tone="ok" word="Enrolling" />
              <Metric name="Graduates" value="28" of="of 42 enrolled" pct={67} tone="ok" word="On track" />
              <Metric name="Graduates placed in jobs" value="21" of="of 28" pct={75} tone="ok" word="On track" />
            </div>
          </Card>
        </Reveal>

        <section className="grid gap-6 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.name} delay={(i % 2) * 120}>
              <div className="plush flex h-full gap-5 rounded-[28px] bg-card p-6 sm:p-8">
                <span className="num flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--fill)] text-xl font-semibold">{i + 1}</span>
                <div>
                  <h2 className="text-2xl font-semibold">{s.name}</h2>
                  <p className="mt-2 text-ink2">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        <Reveal>
          <Card title="Three courses">
            <div className="grid gap-4 md:grid-cols-3">
              {TRACKS.map((t) => (
                <div key={t.name} className="flex flex-col gap-3 rounded-[20px] bg-canvas p-5">
                  <Ring pct={(t.weeks / 40) * 100} size={76} label={`${t.name} course length`}>{t.weeks}</Ring>
                  <div>
                    <div className="text-lg font-semibold">{t.name}</div>
                    <div className="text-sm text-ink3">{t.weeks} weeks</div>
                    <p className="mt-2 text-ink2">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-ink3">U.S. median pay in 2024 was $63,190 a year for electricians and $61,010 for heating and cooling mechanics (Bureau of Labor Statistics). Course lengths are demo figures.</p>
          </Card>
        </Reveal>

        <Reveal>
          <Card title="Automatic investing from a paycheck">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-5">
                <label className="text-ink2">
                  Yearly pay <span className="num text-lg text-ink">{usd(pay)}</span>
                  <input type="range" min={30000} max={110000} step={500} value={pay} onChange={(e) => setPay(+e.target.value)} />
                </label>
                <label className="text-ink2">
                  Share of each paycheck <span className="num text-lg text-ink">{share}%</span>
                  <input type="range" min={1} max={10} value={share} onChange={(e) => setShare(+e.target.value)} />
                </label>
                <p className="text-ink2">The worker picks the share once. Payroll moves that amount into battery shares every payday, and the worker can change it or stop at any time.</p>
              </div>
              <div>
                <Row label="Invested each year">{usd(yearly)}{capped && " (yearly limit)"}</Row>
                <Row label="Battery shares owned after 5 years">{usd(owned5)}</Row>
                <Row label="Paid to you each year by then">{usd(owned5 * RETURN)}</Row>
                <Row label="Yearly return on shares">{(RETURN * 100).toFixed(1)}%</Row>
              </div>
            </div>
            <p className="mt-5 text-sm text-ink3">Example only, not an offer. U.S. crowdfunding rules limit most people to the greater of $2,500 or 5% of their income or net worth a year, so this example stops at $2,500. A real offering needs a registered funding portal and legal review.</p>
          </Card>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
