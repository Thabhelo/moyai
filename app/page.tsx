import Link from "next/link";

const views = [
  { href: "/operator", title: "Operator", body: "Power, closed-loop cooling and battery for the facility team." },
  { href: "/utility", title: "Utility dispatch", body: "Send a grid alert and watch the verified cutback." },
  { href: "/county", title: "County compliance", body: "Permit limits, audit log and signed certificates." },
  { href: "/public", title: "Residents", body: "Plain-language status in English and Spanish." },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="text-4xl font-bold">Moyai</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Verified grid relief for host communities. All telemetry here is simulated.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {views.map((v) => (
          <Link key={v.href} href={v.href} className="rounded-lg border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800">
            <div className="font-semibold">{v.title}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">{v.body}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
