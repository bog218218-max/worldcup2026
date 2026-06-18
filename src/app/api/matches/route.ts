import { NextResponse } from "next/server";
import { getMatches } from "@/lib/services/matches";

export const revalidate = 15;

export async function GET() {
  return NextResponse.json(await getMatches());
}
