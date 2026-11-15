import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confidential document exchange is explicitly excluded from the submitted MVP.
 * Do not accept, buffer, persist, scan, or expose identity, ownership, or case
 * evidence until a deployed end-to-end processing and access pipeline is accepted.
 */
export async function POST(): Promise<Response> {
  return NextResponse.json(
    { error: "CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP" },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
