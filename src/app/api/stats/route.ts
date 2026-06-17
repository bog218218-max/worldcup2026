import { NextResponse } from "next/server";
import { getTournamentStats } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getTournamentStats());
}
