import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/services/players";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json(await getPlayers());
}
