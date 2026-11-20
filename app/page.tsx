"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Footer, Nav, Num, Reveal, Rope } from "@/components/site";
import { Shader } from "@/components/shader";
import { Ring } from "@/components/kit";
import { useMoyai } from "@/components/useMoyai";
import { facts } from "@/components/workspace";

const stroke = { fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round" as const };

// One small moving picture per audience: neighbors, the county's ledger, the load dropping.
const DOORS = [
  {
    href: "/community", who: "Residents", line: "Results in plain language: water saved, power used and bill protection",
    art: [0, 1, 2].map((i) => <circle key={i} className="bob" style={{ animationDelay: `${i * 0.25}s` }} cx={14 + i * 22} cy={30} r={7} fill={i === 1 ? "var(--hot)" : "var(--ink)"} />),
  },
  {
    href: "/county", who: "County staff", line: "Their own data center only: the evidence, permit limits and commitments",
    art: [0, 1, 2].map((i) => <rect key={i} className="bar" style={{ animationDelay: `${i * 0.3}s` }} x={8 + i * 22} y={[18, 8, 26][i]} width={10} height={[30, 40, 22][i]} rx={5} fill={i === 1 ? "var(--hot)" : "var(--ink)"} />),
  },
  {
    href: "/operator", who: "Operators", line: "Recommendations and verified savings",
    art: [<path key="l" className="dash" pathLength={1} d="M4,16 H30 C36,16 34,40 40,40 H68" {...stroke} />, <circle key="d" cx={30} cy={16} r={5} fill="var(--hot)" />],
  },
];

// The four bottlenecks named in the challenge prompt, each with what Moyai does.
const ANSWERS: { problem: string; answer: string; href?: string }[] = [
  { problem: "Power cannot be delivered fast enough", answer: "Utilities approve new capacity sooner when they can see measured load data and verified power cuts." },
  { problem: "Connecting to the grid takes years", answer: "A data center that provably lowers its use at peak times can connect without waiting for new power lines." },
  { problem: "Cooling uses a lot of energy and water", answer: "Moyai recommends cooling changes and checks each saving against normal use in the same weather." },
  { problem: "Too few electricians and technicians", answer: "Paid training for people who live next to the site, tied to the operator's local hiring promise.", href: "/training" },
];

// From the team deck: poverty rates next to three AI campuses, the four steps, and the three functions.
const PRICE = [{ pct: 32, place: "Memphis, TN" }, { pct: 27, place: "Richland Parish, LA" }, { pct: 26.5, place: "Abilene, TX" }];
const STEPS = [
  { name: "Measure", body: "Cooling power, water, total power, peak demand and heat recovered." },
  { name: "Reduce", body: "Recommend cooling settings, pump and fan speeds, maintenance and heat recovery." },
  { name: "Verify", body: "Compare every change against a baseline adjusted for weather and computing load." },
  { name: "Protect", body: "Track who pays for grid upgrades, so facility costs stay off household bills." },
];
const FUNCTIONS = [
  { fn: "Cooling optimization", benefit: "Less water, lower power demand" },
  { fn: "Public verification", benefit: "Proof that operators keep their promises" },
  { fn: "Cost tracking", benefit: "Facility costs do not shift to households" },
];

export default function Landing() {
  const s = useMoyai("shelby");
  const f = s && facts(s);
  return (
    <>
      <Nav />
      <main className="home overflow-x-clip">
        <section className="text-center">
          <div className="hero-photo relative mx-auto h-svh w-full overflow-hidden">
            <img
              src="/hero.webp"
              srcSet="/hero-1200.webp 1200w, /hero.webp 2400w"
              sizes="100vw"
              width={2400}
              height={1339}
              fetchPriority="high"
              alt="moyai, Team Tornadoes. A power pylon and its lines in soft green."
              className="hero-img h-full w-full object-cover"
            />
            {/* The rope runs along the bottom edge of the hero, over the photo. */}
            <Rope className="fade absolute inset-x-0 bottom-[3svh] h-[clamp(40px,6vw,72px)] w-full" />
          </div>
          <h1 className="sr-only">Moyai</h1>
          <div className="w-full pt-28">
            <p className="px-6 text-2xl text-ink2 sm:text-3xl">
              Data center accountability <span className="text-ink">for communities that host them.</span>
            </p>
            <p className="mt-4 px-6 text-base text-ink3">Powering the AI buildout</p>
            <div className="fade mt-10 flex flex-col items-center gap-4 px-6" style={{ animationDelay: "0.8s" }}>
              <Link href="/county" className="cta rounded-full bg-ink px-6 py-3 text-lg font-semibold text-canvas">See Shelby County live</Link>
              <p className="flex items-center gap-2 text-sm text-ink2">
                <span className="h-2 w-2 rounded-full bg-hot" aria-hidden />
                {f ? <>Drawing {f.power.toFixed(1)} MW right now</> : "Connecting to the campus"}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal><p className="text-lg text-ink2">The problem</p></Reveal>
          <Tagline lines={["AI data centers use huge amounts of power and water,", "much of it for cooling. Residents cannot see that use,", "and they pay higher bills because of it."]} />
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-32 sm:px-10">
          <Reveal>
            <h2 className="text-5xl font-bold sm:text-6xl">Who pays the price?</h2>
            <p className="mt-5 max-w-2xl text-xl text-ink2">Many households near major AI projects already face financial strain. This is the share of residents living in poverty next to three of them.</p>
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {PRICE.map((x, i) => (
              <Reveal key={x.place} delay={i * 120}>
                <div className="font-head text-7xl font-bold tracking-tight sm:text-8xl"><Num value={x.pct} digits={x.pct % 1 ? 1 : 0} suffix="%" /></div>
                <p className="mt-2 text-xl">{x.place}</p>
              </Reveal>
            ))}
          </div>
          <Reveal><p className="mt-8 text-sm text-ink3">Source: U.S. Census American Community Survey 2020-2024. The U.S. rate is 12.5%.</p></Reveal>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal><p className="text-lg text-ink2">Our solution</p></Reveal>
          <Tagline lines={["Moyai helps data centers cut their resource use,", "proves it publicly,", "and protects neighbors from the costs."]} />
          <Reveal>
            <p className="mt-8 max-w-2xl text-xl text-ink2">Cooling optimization is the action. Community cost protection is the outcome.</p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal><h2 className="text-5xl font-bold sm:text-6xl">How it works</h2></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {STEPS.map((a, i) => (
              <Reveal key={a.name} delay={(i % 2) * 120}>
                <div className="plush flex h-full flex-col gap-3 rounded-[28px] bg-card p-8">
                  <span className="flex items-center gap-3 text-ink2"><span className="num flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fill)] text-ink">{i + 1}</span>{a.name}</span>
                  <span className="font-head text-2xl font-semibold leading-snug">{a.body}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal><h2 className="text-5xl font-bold sm:text-6xl">Three functions, three benefits</h2></Reveal>
          <div className="mt-12">
            {FUNCTIONS.map((x, i) => (
              <Reveal key={x.fn} delay={i * 100}>
                <div className="grid gap-2 border-t border-line py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
                  <span className="text-xl text-ink2">{x.fn}</span>
                  <span className="font-head text-3xl font-semibold leading-tight">{x.benefit}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal>
            <h2 className="text-5xl font-bold sm:text-6xl">What holds new data centers back, and what Moyai does about it</h2>
            <p className="mt-6 max-w-2xl text-xl text-ink2">AI data centers are being built faster than the power lines, water systems and workforce around them can keep up. These four delays slow every new site.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {ANSWERS.map((a, i) => (
              <Reveal key={a.problem} delay={(i % 2) * 120}>
                <div className="plush flex h-full flex-col gap-3 rounded-[28px] bg-card p-8">
                  <span className="text-ink2">{a.problem}</span>
                  <span className="font-head text-2xl font-semibold leading-snug">{a.answer}</span>
                  {a.href && <Link href={a.href} className="ulink mt-auto self-start pt-2">See the training program →</Link>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal>
            <p className="flex items-center gap-2 text-ink2"><span className="relative flex h-2.5 w-2.5"><span className="pulse absolute inset-0 rounded-full bg-hot" /><span className="relative h-2.5 w-2.5 rounded-full bg-hot" /></span>Public and live</p>
            <h2 className="mt-2 text-5xl font-bold sm:text-7xl">Everyone sees the same record.</h2>
          </Reveal>
          <div className="relative mt-14">
            <Shader className="absolute -inset-x-[20vw] -inset-y-24 -z-10 h-[calc(100%+12rem)] w-[calc(100%+40vw)]" />
            <div className="grid gap-6 md:grid-cols-3">
              <Reveal><Glass ring={f ? (f.power / 110) * 100 : 0} value={f ? <Num value={f.power} digits={1} /> : "–"} unit="megawatts drawn right now, of 110 permitted" /></Reveal>
              <Reveal delay={120}><Glass ring={f ? f.reliability : 0} value={f ? <Num value={f.reliability} suffix="%" /> : "–"} unit="of grid signals answered in time" /></Reveal>
              <Reveal delay={240}><Glass ring={0} value="$0" unit="of grid upgrade costs on household bills" /></Reveal>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-10 sm:px-10">
          <Reveal><h2 className="text-5xl font-bold sm:text-6xl">Who sees what</h2></Reveal>
        </section>
        <section className="doors mx-auto grid max-w-5xl gap-6 px-6 pb-32 sm:px-10 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <Reveal key={d.href} delay={i * 120}>
              <Link href={d.href} className="door plush flex min-h-72 flex-col justify-between rounded-[32px] bg-card p-9">
                <span className="flex items-start justify-between">
                  <svg viewBox="0 0 72 52" className="h-14 w-20" aria-hidden>{d.art}</svg>
                  <span className="go flex h-12 w-12 items-center justify-center rounded-full text-xl" aria-hidden>→</span>
                </span>
                <span>
                  <span className="block text-lg text-ink2">{d.who}</span>
                  <span className="mt-1 block font-head text-2xl font-bold leading-tight tracking-tight">{d.line}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </section>

      </main>
      <Footer />
    </>
  );
}

// A progress metric on liquid glass: the ring fills toward the limit, the figure counts up.
function Glass({ value, unit, ring }: { value: React.ReactNode; unit: string; ring: number }) {
  return (
    <div className="glass plush flex h-full flex-col gap-6 rounded-[32px] p-9">
      <Ring pct={ring} size={64} label={unit}>{" "}</Ring>
      <div>
        <div className="font-head text-6xl font-bold tracking-tight">{value}</div>
        <p className="mt-2 text-lg text-ink2">{unit}</p>
      </div>
    </div>
  );
}

// Words start muted and turn solid one at a time, in reading order, as the heading scrolls up the screen.
function Tagline({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLElement>("[data-w]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return words.forEach((w) => w.setAttribute("data-on", ""));
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = (innerHeight * 0.85 - el.getBoundingClientRect().top) / (innerHeight * 0.45);
      const lit = Math.round(Math.min(1, Math.max(0, progress)) * words.length);
      words.forEach((w, i) => w.toggleAttribute("data-on", i < lit));
    };
    const onScroll = () => { frame ||= requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  return (
    <h2 ref={ref} className="tagline max-w-[680px] text-5xl font-bold sm:text-7xl">
      {lines.map((line, l) => (
        <span key={l} className="block">
          {line.split(" ").map((w, i) => <span key={i} data-w>{w} </span>)}
        </span>
      ))}
    </h2>
  );
}
