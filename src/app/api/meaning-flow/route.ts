import { NextResponse } from "next/server";
import { defaultPoolIdForSlug } from "@/lib/pools";
import { getMeaningFlowSnapshot } from "@/server/meaningFlow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const poolId = defaultPoolIdForSlug(url.searchParams.get("pool"));
  const snapshot = await getMeaningFlowSnapshot({ poolId });
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
