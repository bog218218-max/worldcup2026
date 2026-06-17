import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/services/players";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPlayers());
}
