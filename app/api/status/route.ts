import { NextResponse } from "next/server";
import { fetchConfiguredPoolChecks } from "@/src/lib/lcsd";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const checks = await fetchConfiguredPoolChecks();

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      pools: checks.map((check) => ({
        swpId: check.pool.swpId,
        name: check.pool.name,
        phone: check.pool.phone,
        sourceUrl: check.sourceUrl,
        notices: check.notices,
        error: check.error,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
