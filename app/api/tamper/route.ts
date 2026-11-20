import { tick } from "@/lib/sim";

// Demo only: quietly edit an old meter reading so the audit log shows it was tampered with.
export async function POST() {
  const reading = tick().ledger.findLast((e) => e.type === "reading");
  if (!reading) return Response.json({ error: "no readings yet" }, { status: 409 });
  reading.payload.facilityMW = Number(reading.payload.facilityMW) - 5;
  return Response.json({ tamperedSeq: reading.seq });
}
