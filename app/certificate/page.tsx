"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Pill, Row } from "@/components/kit";
import { Footer, Nav } from "@/components/site";

type Cert = {
  body: { facility: string; eventId: number; window: { start: string; end: string }; targetPct: number; baselineMW: number; targetMW: number; avgShedMW: number; shedMWh: number; rampMinutes: number | null; compliant: boolean; ledgerHead: string; logIntact: boolean };
  signature: string;
  publicKey: string;
};

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Checks the Ed25519 signature in the browser, so the reader does not have to trust the server's word. */
async function check(cert: Cert) {
  const der = bytes(cert.publicKey.replace(/-----[^-]+-----|\s/g, ""));
  const key = await crypto.subtle.importKey("spki", der, { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify("Ed25519", key, bytes(cert.signature), new TextEncoder().encode(JSON.stringify(cert.body)));
}

export default function Certificate() {
  const [cert, setCert] = useState<Cert | null | undefined>(undefined);
  const [valid, setValid] = useState<boolean | "error" | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    fetch(`/api/certificate/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setCert)
      .catch(() => setCert(null));
  }, []);
  const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const b = cert?.body;
  return (
    <>
      <Nav />
      <main className="enter mx-auto flex max-w-2xl flex-col gap-6 px-6 pb-28 pt-36">
        <h1 className="text-4xl font-bold sm:text-5xl">Signed proof</h1>
        {cert === undefined ? (
          <div className="h-48 animate-pulse rounded-[28px] bg-card" aria-label="Loading" />
        ) : !b ? (
          <Card>
            <p>There is no finished grid signal with that number.</p>
            <Link href="/operator" className="mt-3 inline-block underline underline-offset-4">Go to the data center workspace</Link>
          </Card>
        ) : (
          <>
            <Card title={`Grid signal ${b.eventId}`}>
              <div className="mb-4 flex items-center gap-3">
                <Pill tone={b.compliant ? "ok" : "bad"}>{b.compliant ? "Verified Met" : "Verified Short"}</Pill>
                <span className="text-ink2">{b.facility}</span>
              </div>
              <Row label="Signal window">{time(b.window.start)} to {time(b.window.end)}</Row>
              <Row label="Normal power use before the signal">{b.baselineMW.toFixed(1)} MW</Row>
              <Row label="Promised level">{b.targetMW.toFixed(1)} MW</Row>
              <Row label="Average cut">{b.avgShedMW.toFixed(1)} MW</Row>
              <Row label="Energy not drawn">{b.shedMWh.toFixed(1)} MWh</Row>
              <Row label="Time to reach the promised level">{b.rampMinutes ?? "–"} min</Row>
              <Row label="Record book at signing">{b.logIntact ? "Intact" : "Changed"}</Row>
            </Card>
            <Card title="Check the signature yourself">
              <p className="text-ink2">The campus signed these figures with its private key. Your browser can check that signature against the public key below, without asking Moyai.</p>
              <div className="my-4 flex flex-wrap items-center gap-3">
                <Button onClick={() => check(cert!).then(setValid, () => setValid("error"))}>Check signature</Button>
                {valid === true && <Pill tone="ok">Signature is valid</Pill>}
                {valid === false && <Pill tone="bad">Signature does not match</Pill>}
                {valid === "error" && <Pill tone="warn">This browser cannot check Ed25519 signatures</Pill>}
              </div>
              <p className="break-all font-mono text-xs text-ink3">{cert!.signature}</p>
              <p className="mt-3 break-all font-mono text-xs text-ink3">{cert!.publicKey.replace(/-----[^-]+-----|\s/g, "")}</p>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
