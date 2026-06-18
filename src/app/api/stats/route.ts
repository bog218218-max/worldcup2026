import { NextResponse } from "next/server";
import { getTournamentStats } from "@/lib/services/stats";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json(await getTournamentStats());
}
