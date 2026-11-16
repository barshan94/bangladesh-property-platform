export async function readBoundedBody(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer");
  }
  if (!request.body) return new Uint8Array(0);

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Compare before addition so even a hostile stream cannot overflow the
      // running byte count. The rejected chunk is also cleared immediately.
      if (value.byteLength > maxBytes - total) {
        value.fill(0);
        try {
          await reader.cancel();
        } catch {
          // The size limit has already been exceeded; cancellation is best-effort.
        }
        return null;
      }
      total += value.byteLength;
      chunks.push(value);
    }

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return body;
  } catch {
    throw new Error("REQUEST_BODY_STREAM_FAILED");
  } finally {
    // The concatenated result is the sole retained copy. Clear every source
    // chunk on success, oversize rejection, and stream failure.
    for (const chunk of chunks) chunk.fill(0);
    reader.releaseLock();
  }
}
