import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify the scanner's signature over the exact timestamp and raw request bytes.
 * Callers must enforce timestamp freshness and secret configuration separately.
 */
export function verifyScannerCallbackSignature(secret, timestamp, rawBody, supplied) {
  if (typeof secret !== "string" || typeof timestamp !== "string" ||
      !(rawBody instanceof Uint8Array) || typeof supplied !== "string" ||
      !/^[a-f0-9]{64}$/iu.test(supplied)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(timestamp)
    .update(".")
    .update(rawBody)
    .digest();
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
