"use client";

import { useState, type FormEvent } from "react";

const messages: Record<string, string> = {
  AUTHENTICATION_REQUIRED: "Your session has expired. Sign in again and retry.",
  LISTING_NOT_FOUND: "This listing could not be found under your account.",
  LISTING_NOT_EDITABLE: "Images can only be added while the listing is a draft or changes are requested.",
  LISTING_MEDIA_RATE_LIMITED: "Upload limit reached. Please try again later.",
  LISTING_MEDIA_PENDING_LIMIT_REACHED: "This listing already has eight images awaiting review.",
  INVALID_FILE_SIZE: "Choose an image smaller than 4 MiB.",
  REQUEST_TOO_LARGE: "The upload is too large. Choose a smaller image.",
  LISTING_MEDIA_IMAGE_DIMENSIONS_REJECTED: "The image dimensions are too large. Choose a smaller image.",
  LISTING_MEDIA_ANIMATION_NOT_SUPPORTED: "Animated images are not accepted. Choose a still image.",
};

export function ListingMediaUpload({ listingId }: { listingId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    const form = event.currentTarget;
    if (file.size < 1 || file.size > 4 * 1024 * 1024) {
      setIsError(true);
      setMessage("Choose a non-empty image no larger than 4 MiB.");
      return;
    }

    setBusy(true);
    setMessage("Processing and uploading your image securely…");
    setIsError(false);
    try {
      const body = new FormData();
      body.set("listingId", listingId);
      body.set("file", file);
      const response = await fetch("/api/listing-media", {
        method: "POST",
        body,
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as { error?: string; moderationStatus?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(messages[result.error ?? ""] ?? "The image could not be uploaded. Please try again later.");
        return;
      }
      setFile(null);
      form.reset();
      setMessage("Image received. It is private and awaiting moderation; it will not appear publicly unless approved and separately published.");
    } catch {
      setIsError(true);
      setMessage("Network error. The image was not confirmed as uploaded. Please check the listing before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="seller-submit-form" onSubmit={handleSubmit}>
      <label className="seller-field">
        Add a property image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={busy}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <p className="seller-form-note">Still JPEG, PNG or WebP only · up to 4 MiB. Images are re-encoded and kept private while awaiting moderation.</p>
      <button className="button button-outline-dark" type="submit" disabled={!file || busy}>
        {busy ? "Uploading…" : "Upload private image"}
      </button>
      {message ? <p className={isError ? "seller-notice seller-error" : "seller-notice"} role={isError ? "alert" : "status"}>{message}</p> : null}
    </form>
  );
}
