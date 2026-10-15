import { NextRequest, NextResponse } from "next/server";
import { getProfile, ScrapeError } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // segundos (limite da Vercel para a função)

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username") ?? "";

  try {
    const profile = await getProfile(username);
    return NextResponse.json(profile, {
      // Cache de CDN da Vercel: 10 min fresco + 1 h servindo stale enquanto revalida
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (err) {
    const e = err instanceof ScrapeError ? err : new ScrapeError("UNKNOWN", "Erro inesperado.", 500);
    return NextResponse.json(
      { error: e.code, message: e.message },
      { status: e.status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
