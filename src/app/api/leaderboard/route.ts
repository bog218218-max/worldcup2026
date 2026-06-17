import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getLeaderboard());
}
