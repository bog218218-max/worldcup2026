import { NextResponse } from "next/server";
import { getPrizeOverview } from "@/lib/services/prizes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPrizeOverview());
}
