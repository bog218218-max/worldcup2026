import { NextResponse } from "next/server";
import { getPrizeOverview } from "@/lib/services/prizes";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json(await getPrizeOverview());
}
