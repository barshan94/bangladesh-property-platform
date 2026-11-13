/**
 * Reduce an uploaded filename to a bounded display-only basename.
 * Storage keys are generated independently and never derived from this value.
 */
export function sanitizePrivateDocumentFilename(value) {
  if (typeof value !== "string") return "evidence";
  const basename = value.split(/[\\/]/).pop() ?? "";
  const cleaned = basename.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, 255);
  return cleaned || "evidence";
}
