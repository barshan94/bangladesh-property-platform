# Property listing image intake and processing decision

**Status: blocked pending a reproducible image-processing dependency and runtime verification.**

## Why the upload route is not being added yet

The current project dependency manifest and lockfile do not include a maintained image decoder/encoder. Existing document inspection helpers only perform bounded structural checks. They are not suitable for decoding untrusted image streams, enforcing decoded pixel limits, stripping metadata, or producing a canonical safe output.

A MIME allowlist, filename extension, browser-provided content type, and file signature are not substitutes for decoding. Storing an original upload after those checks would preserve EXIF/GPS metadata and could admit malformed or polyglot content. It would be misleading to call that a secure image pipeline.

## Required implementation contract

The future `POST /api/listing-media` route must:

1. Require a same-origin, cookie-authenticated session and verify the authenticated user owns the listing.
2. Accept uploads only while the listing is in `draft` or `changes_requested`; verify this server-side, not from submitted form fields.
3. Apply a streaming request-body cap before multipart parsing, plus per-owner rate limiting and a bounded number of pending media records.
4. Accept only JPEG, PNG, and WebP after decoding; never trust the client MIME type or filename.
5. Decode with a maintained native image library in the Node.js runtime. Enforce maximum width, height, total decoded pixels, frame count, and processing time before allocating large output buffers. Reject animated/multi-frame inputs unless animation support is deliberately designed and tested.
6. Re-encode to a canonical raster format, strip EXIF/XMP/IPTC and other metadata, and store only the re-encoded bytes in the private quarantine bucket. Never store or serve the original upload.
7. Compute SHA-256 over the exact canonical bytes stored; persist detected output MIME, byte size, dimensions, digest, and original filename as untrusted display metadata only.
8. Use random server-generated object keys under `<owner UUID>/<listing UUID>/`; do not derive storage paths from user filenames.
9. Create the pending `listing_media` metadata record and audit event safely; remove the quarantine object if metadata/audit persistence fails. Handle partial failure and retry behavior explicitly.
10. Return no object URL, signed URL, or direct Storage key. Keep all objects private pending reviewer approval and a separate publisher-controlled promotion process.

## Dependency and build gate

Before implementing the route, add a maintained image library as a direct production dependency and regenerate `package-lock.json` using the repository's supported Node/npm toolchain. Commit both files together. CI must run `npm ci`, typecheck, lint, production build, and image-processing tests against real fixtures. Do not hand-edit the lockfile or depend on an incidental transitive copy of a native module.

The chosen package must support the deployment Node runtime and target Linux architecture. Verify installation and execution on the actual hosting platform before enabling uploads. If native binaries cannot be installed reliably on the chosen free hosting tier, keep this feature disabled rather than silently falling back to signature checks.

## Required regression fixtures

- Valid JPEG, PNG, and WebP files with EXIF/GPS metadata; assert canonical output no longer contains that metadata.
- Truncated files, invalid chunk/segment lengths, malformed headers, and corrupted checksums.
- Signature-prefixed non-image payloads and polyglot samples.
- Oversized dimensions, extreme aspect ratios, pixel bombs, and resource-exhaustion cases.
- Animated GIF/WebP/APNG and multi-frame files; assert rejection until explicitly supported.
- Duplicate upload, storage failure, metadata failure, audit failure, and concurrent pending-quota attempts.
- Cross-owner listing IDs, submitted/published listing IDs, cross-origin requests, missing auth, and spoofed MIME/filename.

## Release boundary

The existing `listing-media-quarantine` bucket and `listing_media` migration are only the database/storage foundation. The migration has not been applied to the live Supabase project. No upload route is available, no image is publicly promoted, and public listing pages must continue to return no images (an empty image list). Do not apply the migration or enable customer uploads as part of this code-only milestone.
