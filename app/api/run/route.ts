import { NextResponse } from "next/server";
import { compare } from "../../../examples/growth-agent/compare";
import type { FaultType } from "../../../core/types";
import type { DefenseId } from "../../../examples/growth-agent/domain";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { faultType?: FaultType; defenses?: DefenseId[] };
  const faultType = body.faultType ?? "stale_observation";
  const defenses = body.defenses ?? [];
  return NextResponse.json(compare(faultType, defenses));
}
