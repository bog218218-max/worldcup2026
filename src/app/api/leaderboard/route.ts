import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/leaderboard";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json(await getLeaderboard());
}
