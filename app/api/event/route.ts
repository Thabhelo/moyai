import { startEvent } from "@/lib/sim";

// Utility dispatch: start a curtailment event.
export async function POST(req: Request) {
  const { targetPct = 0.3, durationMin = 120 } = (await req.json().catch(() => null)) ?? {};
  try {
    return Response.json(startEvent(targetPct, durationMin));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: e instanceof RangeError ? 400 : 409 });
  }
}
