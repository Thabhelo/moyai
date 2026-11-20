import { startEvent } from "@/lib/sim";

// Utility dispatch: start a curtailment event.
export async function POST(req: Request) {
  const { targetPct = 0.25, durationMin = 120 } = await req.json().catch(() => ({}));
  if (!(targetPct > 0 && targetPct < 1) || !(durationMin > 0 && durationMin <= 600))
    return Response.json({ error: "targetPct must be between 0 and 1, durationMin between 1 and 600" }, { status: 400 });
  try {
    return Response.json(startEvent(targetPct, durationMin));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 409 });
  }
}
