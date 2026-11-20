import { reset } from "@/lib/sim";

export async function POST() {
  reset();
  return Response.json({ ok: true });
}
