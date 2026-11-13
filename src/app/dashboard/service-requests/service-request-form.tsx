"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const services = [
  ["title-and-record-review", "Title and record review"],
  ["buying-and-selling", "Buying and selling support"],
  ["transfer-and-mutation", "Transfer and mutation"],
  ["inheritance-and-succession", "Inheritance and succession"],
  ["partition-and-co-ownership", "Partition and co-ownership"],
  ["property-disputes", "Property disputes"],
  ["remote-property-support", "Remote property support"],
  ["property-tax-and-finance", "Property tax and finance"],
] as const;
type Errors = Record<string, string[]>;

export function ServiceRequestForm({ email, initialName }: { email: string; initialName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      name: String(values.get("name") ?? ""),
      phone: String(values.get("phone") ?? "").trim() || undefined,
      country: String(values.get("country") ?? "").trim() || undefined,
      serviceCode: String(values.get("serviceCode") ?? ""),
      propertyDistrict: String(values.get("propertyDistrict") ?? "").trim() || undefined,
      summary: String(values.get("summary") ?? ""),
      consent: values.get("consent") === "on",
    };
    setBusy(true); setMessage(""); setReference(""); setErrors({});
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { ok?: boolean; reference?: string; fields?: Errors } = await response.json().catch(() => ({}));
      if (response.status === 201 && result.ok && result.reference) {
        setReference(result.reference);
        setMessage("Your service request has been recorded.");
        form.reset();
        router.refresh();
      } else if (response.status === 422 && result.fields) {
        setErrors(result.fields); setMessage("Please review the highlighted fields.");
      } else if (response.status === 401) {
        setMessage("Your session expired. Sign in again and retry.");
      } else if (response.status === 429) {
        setMessage("You have reached the limit of five requests in 15 minutes. Please wait before submitting another.");
      } else if (response.status === 503) {
        setMessage("The request service is temporarily unavailable. Your request was not recorded.");
      } else {
        setMessage("We could not submit this request. Check your entries and try again.");
      }
    } catch {
      setMessage("A network error prevented submission. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="seller-form" onSubmit={submit}>
      <div className="seller-form-grid">
        <label className="seller-field seller-field-wide">Your name<input name="name" required minLength={2} maxLength={120} defaultValue={initialName} autoComplete="name" /></label>
        <label className="seller-field seller-field-wide">Account email<input value={email} readOnly aria-readonly="true" /></label>
        <label className="seller-field">Phone (optional)<input name="phone" type="tel" maxLength={32} autoComplete="tel" placeholder="+880 ..." /></label>
        <label className="seller-field">Country code (optional)<input name="country" maxLength={2} minLength={2} pattern="[A-Za-z]{2}" placeholder="BD" title="Use a two-letter country code, such as BD or GB." /></label>
        <label className="seller-field seller-field-wide">Service required<select name="serviceCode" defaultValue="" required><option value="" disabled>Select a service</option>{services.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="seller-field seller-field-wide">Property district in Bangladesh (optional)<input name="propertyDistrict" minLength={2} maxLength={80} placeholder="e.g. Dhaka" /></label>
        <label className="seller-field seller-field-wide">Describe what support you need<textarea name="summary" rows={5} minLength={10} maxLength={2000} required placeholder="Explain the general help you need. Do not include NID/passport numbers, deed contents, bank details or confidential evidence." /></label>
      </div>
      <label className="inquiry-consent service-consent"><input name="consent" type="checkbox" required /><span>I agree that the platform may process these details to assess and respond to this service request. This is not legal advice or a confirmed service engagement. *</span></label>
      {message && <div className={reference ? "auth-alert auth-success inquiry-feedback" : "auth-alert auth-error inquiry-feedback"} role="status" aria-live="polite">{message}{reference && <strong className="inquiry-reference">Request ID: {reference}</strong>}{Object.entries(errors).map(([field,codes]) => <span key={field} className="inquiry-field-error">{field}: {codes.join(", ")}</span>)}</div>}
      <p className="seller-form-note">No attachments are accepted. Do not submit identity documents, deeds, passwords, bank information, payment details or confidential case files here.</p>
      <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit service request"}</button>
    </form>
  );
}
