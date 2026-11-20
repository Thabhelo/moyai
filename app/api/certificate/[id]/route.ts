import type { NextRequest } from "next/server";
import { certificate } from "@/lib/sim";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/certificate/[id]">) {
  const { id } = await ctx.params;
  const cert = certificate(Number(id));
  return cert ? Response.json(cert) : Response.json({ error: "no finished event with that id" }, { status: 404 });
}
