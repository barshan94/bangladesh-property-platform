const PDF_HEADER = new TextEncoder().encode("%PDF-");
const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_IMAGE_DIMENSION = 16_384;
const MAX_IMAGE_PIXELS = 16_777_216;
const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function startsWith(bytes, signature, offset = 0) {
  if (offset + signature.length > bytes.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function ascii(bytes) {
  return new TextDecoder("latin1").decode(bytes);
}

function isPlausiblePdf(bytes) {
  // PDF permits its header within the first 1,024 bytes.
  let headerFound = false;
  const headerLimit = Math.min(bytes.length - PDF_HEADER.length, 1024);
  for (let offset = 0; offset <= headerLimit; offset += 1) {
    if (startsWith(bytes, PDF_HEADER, offset)) {
      headerFound = true;
      break;
    }
  }
  if (!headerFound || bytes.length < 32) return false;

  const tail = ascii(bytes.subarray(Math.max(0, bytes.length - 2048)));
  const match = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(tail);
  if (!match) return false;
  const xrefOffset = Number(match[1]);
  if (!Number.isSafeInteger(xrefOffset) || xrefOffset < 0 || xrefOffset >= bytes.length) return false;

  // startxref must point to a classic cross-reference table or an indirect
  // object (the latter is how PDF cross-reference streams are represented).
  const xrefTarget = ascii(bytes.subarray(xrefOffset, Math.min(bytes.length, xrefOffset + 64)));
  return /^(?:xref\b|\d+\s+\d+\s+obj\b)/.test(xrefTarget);
}

function crc32(bytes, start, end) {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function isPlausiblePng(bytes) {
  if (!startsWith(bytes, PNG_SIGNATURE) || bytes.length < 45) return false;
  let offset = 8;
  let chunkIndex = 0;
  let hasImageData = false;
  let hasPalette = false;
  let imageDataEnded = false;
  let hasEnd = false;
  let colorType = null;
  let bitDepth = null;

  while (offset + 12 <= bytes.length) {
    const length = bytes[offset] * 0x1000000 +
      (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (!Number.isSafeInteger(length) || length > bytes.length - offset - 12) return false;

    const typeStart = offset + 4;
    const type = ascii(bytes.subarray(typeStart, typeStart + 4));
    if (!/^[A-Za-z]{4}$/.test(type) || type[2] !== type[2].toUpperCase()) return false;
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    const expectedCrc = ((bytes[crcOffset] << 24) | (bytes[crcOffset + 1] << 16) |
      (bytes[crcOffset + 2] << 8) | bytes[crcOffset + 3]) >>> 0;
    if (crc32(bytes, typeStart, crcOffset) !== expectedCrc) return false;

    if (chunkIndex === 0) {
      if (type !== "IHDR" || length !== 13) return false;
      const width = bytes[dataStart] * 0x1000000 +
        (bytes[dataStart + 1] << 16) + (bytes[dataStart + 2] << 8) + bytes[dataStart + 3];
      const height = bytes[dataStart + 4] * 0x1000000 +
        (bytes[dataStart + 5] << 16) + (bytes[dataStart + 6] << 8) + bytes[dataStart + 7];
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      const validDepths = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION ||
          width * height > MAX_IMAGE_PIXELS ||
          !validDepths[colorType]?.includes(bitDepth) ||
          bytes[dataStart + 10] !== 0 || bytes[dataStart + 11] !== 0 ||
          ![0, 1].includes(bytes[dataStart + 12])) return false;
    } else if (type === "IHDR") {
      return false;
    }

    // Reject unknown critical chunks: this intake path does not decode or
    // preserve arbitrary PNG extensions.
    const knownChunks = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);
    if (type[0] === type[0].toUpperCase() && !knownChunks.has(type)) return false;

    if (type === "PLTE") {
      const paletteEntries = length / 3;
      const maxPaletteEntries = colorType === 3 ? 2 ** bitDepth : 256;
      if (hasPalette || hasImageData || length === 0 || length > 768 || length % 3 !== 0 ||
          colorType === 0 || colorType === 4 || paletteEntries > maxPaletteEntries) return false;
      hasPalette = true;
    }

    if (type === "IDAT") {
      if (imageDataEnded) return false;
      if (colorType === 3 && !hasPalette) return false;
      hasImageData = true;
    } else if (hasImageData && type !== "IEND") {
      imageDataEnded = true;
    }

    offset = crcOffset + 4;
    chunkIndex += 1;

    if (type === "IEND") {
      if (length !== 0 || !hasImageData || offset !== bytes.length) return false;
      hasEnd = true;
      break;
    }
  }
  return hasEnd;
}

function isPlausibleJpeg(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) return false;

  let offset = 2;
  let hasFrame = false;
  let hasScan = false;
  let frameComponents = new Set();
  while (offset < bytes.length - 2) {
    if (bytes[offset] !== 0xff) return false;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return false;
    const marker = bytes[offset++];
    if (marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return false;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length - 2) return false;

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (hasFrame || segmentLength < 11) return false;
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const componentCount = bytes[offset + 7];
      if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION ||
          width * height > MAX_IMAGE_PIXELS || componentCount < 1 ||
          segmentLength !== 8 + componentCount * 3) return false;
      for (let index = 0; index < componentCount; index += 1) {
        const componentOffset = offset + 8 + index * 3;
        const componentId = bytes[componentOffset];
        const sampling = bytes[componentOffset + 1];
        const horizontalSampling = sampling >> 4;
        const verticalSampling = sampling & 0x0f;
        const quantizationTable = bytes[componentOffset + 2];
        if (frameComponents.has(componentId) || horizontalSampling < 1 ||
            horizontalSampling > 4 || verticalSampling < 1 || verticalSampling > 4 ||
            quantizationTable > 3) return false;
        frameComponents.add(componentId);
      }
      hasFrame = true;
    }

    if (marker === 0xda) {
      if (!hasFrame || segmentLength < 8) return false;
      const scanComponentCount = bytes[offset + 2];
      if (scanComponentCount < 1 || scanComponentCount > frameComponents.size ||
          segmentLength !== 6 + scanComponentCount * 2) return false;
      const scanComponents = new Set();
      for (let index = 0; index < scanComponentCount; index += 1) {
        const componentOffset = offset + 3 + index * 2;
        const componentId = bytes[componentOffset];
        const tableSelectors = bytes[componentOffset + 1];
        if (!frameComponents.has(componentId) || scanComponents.has(componentId) ||
            (tableSelectors >> 4) > 3 || (tableSelectors & 0x0f) > 3) return false;
        scanComponents.add(componentId);
      }
      const spectralStart = bytes[offset + 3 + scanComponentCount * 2];
      const spectralEnd = bytes[offset + 4 + scanComponentCount * 2];
      const successiveApproximation = bytes[offset + 5 + scanComponentCount * 2];
      if (spectralStart > spectralEnd || spectralEnd > 63 ||
          (successiveApproximation >> 4) > 13 ||
          (successiveApproximation & 0x0f) > 13) return false;
      // A scan header must be followed by at least one entropy-coded byte
      // before the required terminal EOI marker.
      if (offset + segmentLength >= bytes.length - 2) return false;
      hasScan = true;
      break;
    }
    offset += segmentLength;
  }
  return hasFrame && hasScan;
}

/**
 * Identifies an allowed document family and performs bounded structural sanity
 * checks. This is not a complete format parser or malware scanner. Accepted
 * files must remain quarantined until a trusted scanner clears the exact digest.
 */
export function detectPrivateDocumentMimeType(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) return null;
  if (isPlausiblePdf(bytes)) return "application/pdf";
  if (isPlausiblePng(bytes)) return "image/png";
  if (isPlausibleJpeg(bytes)) return "image/jpeg";
  return null;
}
