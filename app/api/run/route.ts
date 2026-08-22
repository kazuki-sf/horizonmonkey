import { NextResponse } from "next/server";
import { compare } from "../../../core/compare";
import type { DefenseId, FaultType } from "../../../core/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { faultType?: FaultType; defenses?: DefenseId[] };
  const faultType = body.faultType ?? "stale_observation";
  const defenses = body.defenses ?? [];
  return NextResponse.json(compare(faultType, defenses));
}
