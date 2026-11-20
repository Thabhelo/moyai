"use client";
import Link from "next/link";
import { Footer, Nav, Num, Reveal, Rope } from "@/components/site";
import { useMoyai } from "@/components/useMoyai";
import { facts } from "@/components/workspace";

const DOORS = [
  { href: "/community", who: "Community", line: "Is it following the rules?" },
  { href: "/county", who: "County", line: "Who pays, and what was promised?" },
  { href: "/operator", who: "Data center", line: "Cut power when the grid asks. Prove it." },
];

export default function Landing() {
  const s = useMoyai("shelby");
  const f = s && facts(s);
  return (
    <>
      <Nav />
      <main>
        <section className="flex min-h-[calc(100svh-3rem)] flex-col items-center justify-center overflow-hidden text-center">
          <h1 aria-label="Moyai" className="font-head text-[clamp(6rem,27vw,23rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
            {"Moyai".split("").map((ch, i) => (
              <span key={i} className="mask" aria-hidden>
                <span className="rise" style={{ animationDelay: `${i * 70}ms` }}>{ch}</span>
              </span>
            ))}
          </h1>
          <Rope className="fade my-[2vh] h-[clamp(70px,13vw,150px)] w-full" />
          <p className="fade px-6 text-xl text-ink2 sm:text-2xl" style={{ animationDelay: "0.5s" }}>
            Data center. Grid. Neighbors. <span className="text-ink">Tied together.</span>
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
          <Reveal>
            <p className="flex items-center gap-2 text-sm text-ink2"><span className="h-2 w-2 rounded-full bg-hot" />Open to everyone, live</p>
            <h2 className="mt-1 text-4xl font-semibold sm:text-6xl">The same proof for all.</h2>
          </Reveal>
          <Reveal className="mt-12 grid gap-10 sm:grid-cols-3">
            <Live value={f ? <Num value={f.power} digits={1} /> : "–"} unit="megawatts the campus draws right now" />
            <Live value={f ? <Num value={f.reliability} suffix="%" /> : "–"} unit="of grid signals answered in time" />
            <Live value="$0" unit="of grid upgrade costs on household bills" />
          </Reveal>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <Reveal className="grid gap-4 md:grid-cols-3">
            {DOORS.map((d) => (
              <Link key={d.href} href={d.href} className="door flex min-h-56 flex-col justify-between plush rounded-[28px] bg-card p-7">
                <span className="text-ink2">{d.who}</span>
                <span className="flex items-end justify-between gap-4 font-head text-2xl font-semibold tracking-tight">
                  {d.line}
                  <span className="arrow text-accent" aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Live({ value, unit }: { value: React.ReactNode; unit: string }) {
  return (
    <div>
      <div className="font-head text-6xl font-semibold tracking-tight sm:text-7xl">{value}</div>
      <p className="mt-2 text-ink2">{unit}</p>
    </div>
  );
}
