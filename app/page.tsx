"use client";
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
    href: "/community", who: "Community", line: "Is the data center following the rules?",
    art: [0, 1, 2].map((i) => <circle key={i} className="bob" style={{ animationDelay: `${i * 0.25}s` }} cx={14 + i * 22} cy={30} r={7} fill={i === 1 ? "var(--hot)" : "var(--ink)"} />),
  },
  {
    href: "/county", who: "County", line: "Who pays, and what was promised?",
    art: [0, 1, 2].map((i) => <rect key={i} className="bar" style={{ animationDelay: `${i * 0.3}s` }} x={8 + i * 22} y={[18, 8, 26][i]} width={10} height={[30, 40, 22][i]} rx={5} fill={i === 1 ? "var(--hot)" : "var(--ink)"} />),
  },
  {
    href: "/operator", who: "Data center", line: "Cut power on a grid signal and get it verified",
    art: [<path key="l" className="dash" pathLength={1} d="M4,16 H30 C36,16 34,40 40,40 H68" {...stroke} />, <circle key="d" cx={30} cy={16} r={5} fill="var(--hot)" />],
  },
];

export default function Landing() {
  const s = useMoyai("shelby");
  const f = s && facts(s);
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="relative flex min-h-svh flex-col items-center justify-center text-center">
          <Shader className="fade absolute inset-0 -z-10 h-full w-full" />
          <div className="hero-out w-full">
            <h1 aria-label="Moyai" className="font-head text-[clamp(6rem,27vw,23rem)] font-extrabold leading-[0.9] tracking-[-0.05em]">
              {"Moyai".split("").map((ch, i) => (
                <span key={i} className="mask" aria-hidden>
                  <span className="rise" style={{ animationDelay: `${i * 80}ms` }}>{ch}</span>
                </span>
              ))}
            </h1>
            <Rope className="fade my-[1vh] h-[clamp(48px,7vw,84px)] w-full" />
            <p className="fade px-6 text-2xl text-ink2 sm:text-3xl" style={{ animationDelay: "0.5s" }}>
              Data center accountability <span className="text-ink">for communities that host them.</span>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-32 sm:px-10">
          <Reveal>
            <h2 className="text-5xl font-bold sm:text-7xl">The load drops<br /><span className="text-ink3">when the grid asks.</span></h2>
          </Reveal>
          <Reveal className="plush grow-in mt-12 rounded-[40px] bg-card p-8 sm:p-14">
            <svg viewBox="0 0 600 230" role="img" aria-label="Power draw falls to 70 percent four minutes after the grid asks" className="w-full">
              <path d="M0,62 C150,50 300,74 600,60" fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round" />
              <path className="draw" pathLength={1} d="M0,62 C110,52 220,72 330,64 C352,62 356,168 380,170 C450,176 520,164 600,170" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
              <g className="after-draw">
                <circle className="pulse" cx="330" cy="64" r="6" fill="var(--hot)" />
                <circle cx="330" cy="64" r="6" fill="var(--hot)" />
                <text x="330" y="38" textAnchor="middle" fill="var(--ink2)" fontSize="15">Grid signal</text>
                <text x="470" y="206" textAnchor="middle" fill="var(--ink)" fontSize="17" fontWeight="700">30% less power 4 minutes after the signal</text>
              </g>
            </svg>
          </Reveal>
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
                  <span className="mt-1 block font-head text-[1.7rem] font-bold leading-tight tracking-tight">{d.line}</span>
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
