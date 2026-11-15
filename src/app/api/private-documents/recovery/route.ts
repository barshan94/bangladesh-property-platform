import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** No quarantine intake is enabled, so there are no MVP recovery jobs to run. */
export async function POST(): Promise<Response> {
  return NextResponse.json(
    { error: "CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP" },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
