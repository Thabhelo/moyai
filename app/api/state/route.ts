import { tick } from "@/lib/sim";
import { verifyChain } from "@/lib/ledger";

export async function GET() {
  const s = tick();
  return Response.json({
    now: s.history.at(-1),
    history: s.history.slice(-180),
    events: s.events,
    ledger: s.ledger.slice(-20),
    ledgerLength: s.ledger.length,
    brokenAt: verifyChain(s.ledger),
  });
}
