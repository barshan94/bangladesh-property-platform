"use client";
import { useState } from "react";
import type { FormEvent } from "react";

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
type FieldErrors = Record<string, string[]>;

export function InquiryForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setMessage("");
    setReference("");
    setErrors({});
    const payload = {
      name: String(values.get("name") ?? ""),
      email: String(values.get("email") ?? ""),
      phone: String(values.get("phone") ?? "").trim() || undefined,
      country: String(values.get("country") ?? "").trim() || undefined,
      serviceCode: String(values.get("serviceCode") ?? ""),
      propertyDistrict: String(values.get("propertyDistrict") ?? "").trim() || undefined,
      message: String(values.get("message") ?? ""),
      consent: values.get("consent") === "on",
    };
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { ok?: boolean; reference?: string; fields?: FieldErrors } =
        await response.json().catch(() => ({}));
      if (response.status === 201 && result.ok && result.reference) {
        setReference(result.reference);
        setMessage("Your inquiry was received. Keep this reference for any follow-up.");
        form.reset();
      } else if (response.status === 422 && result.fields) {
        setErrors(result.fields);
        setMessage("Please review the submitted information and try again.");
      } else if (response.status === 429) {
        setMessage("Too many attempts were made from this connection. Please wait before trying again.");
      } else if (response.status === 503) {
        setMessage("The inquiry service is temporarily unavailable. Please try again later; your information was not submitted.");
      } else {
        setMessage("We could not submit the inquiry. Please check your entries and try again.");
      }
    } catch {
      setMessage("A network error prevented submission. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label htmlFor="inquiry-name">Full name *</label>
      <input id="inquiry-name" name="name" autoComplete="name" minLength={2} maxLength={100} required />
      <label htmlFor="inquiry-email">Email address *</label>
      <input id="inquiry-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="inquiry-phone">Phone (optional)</label>
      <input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" maxLength={32} placeholder="+880 ..." />
      <label htmlFor="inquiry-service">What do you need help with? *</label>
      <select id="inquiry-service" name="serviceCode" defaultValue="" required>
        <option value="" disabled>Select a service</option>
        {services.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label htmlFor="inquiry-country">Country of residence (optional)</label>
      <input id="inquiry-country" name="country" autoComplete="country-name" minLength={2} maxLength={80} />
      <label htmlFor="inquiry-district">Property district in Bangladesh (optional)</label>
      <input id="inquiry-district" name="propertyDistrict" minLength={2} maxLength={80} placeholder="e.g. Dhaka" />
      <label htmlFor="inquiry-message">Brief description of your requirement *</label>
      <textarea id="inquiry-message" name="message" rows={5} minLength={15} maxLength={1500} required placeholder="Describe the general property-related help you are looking for. Do not include identity numbers or confidential details." />
      <label className="inquiry-consent">
        <input name="consent" type="checkbox" required />
        <span>I agree that the platform may use these contact details and this message to respond to my inquiry. I understand this is an initial inquiry, not legal advice or a service engagement. *</span>
      </label>
      {message && <div className={reference ? "auth-alert auth-success inquiry-feedback" : "auth-alert auth-error inquiry-feedback"} role="status" aria-live="polite">
        {message}
        {reference && <strong className="inquiry-reference">Reference: {reference}</strong>}
        {Object.entries(errors).map(([field, codes]) => <span key={field} className="inquiry-field-error">{field}: {codes.join(", ")}</span>)}
      </div>}
      <button className="button button-dark form-submit" type="submit" disabled={busy}>{busy ? "Submitting…" : "Send inquiry"}</button>
      <small>Do not submit NID/passport numbers, deeds, bank details, passwords, payment information or confidential case files. This form does not accept attachments.</small>
    </form>
  );
}
