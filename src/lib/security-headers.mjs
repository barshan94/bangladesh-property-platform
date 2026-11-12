export const SECURITY_HEADERS = Object.freeze([
  Object.freeze({ key: "X-Content-Type-Options", value: "nosniff" }),
  Object.freeze({ key: "X-Frame-Options", value: "DENY" }),
  Object.freeze({ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }),
  Object.freeze({ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" }),
  Object.freeze({ key: "Cross-Origin-Opener-Policy", value: "same-origin" }),
]);
