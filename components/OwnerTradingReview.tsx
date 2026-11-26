"use client";

import { FormEvent, useState } from "react";
import api from "../lib/apiClient";
import { countriesData } from "@/data/IsoCode";

const accept = ".jpg,.jpeg,.png,.pdf";
const field = "mt-1 block w-full rounded border border-slate-600 bg-slate-950 p-2";

export type ReviewClient = { _id: string; isVerified?: boolean; isKycVerified?: boolean; updatedAt?: string; portalBlocked?: boolean; portalAccessStatus?: string | null };
type Props = {
  client: ReviewClient;
  canOpenEvidence: boolean;
  onApproved: () => void;
};

export default function OwnerTradingReview({ client, canOpenEvidence, onApproved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<{ identity: string; address: string } | null>(null);
  const endpoint = `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/users/${client._id}/trading-verification`;
  const eligible = client.isVerified && !client.portalBlocked && client.portalAccessStatus !== "rejected";

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    data.set("expectedUpdatedAt", client.updatedAt ?? "");
    setSaving(true);
    setMessage("");
    try {
      const result = await api.post(endpoint, data, { timeout: 150000 });
      setMessage(result.data.message);
      setOpen(false);
      onApproved();
    } catch (error) {
      setMessage(api.isAxiosError(error) && typeof error.response?.data?.message === "string" ? error.response.data.message : "Could not confirm the review. Reopen the client record before retrying.");
    } finally {
      setSaving(false);
    }
  }

  async function openEvidence() {
    setLoadingEvidence(true);
    setMessage("");
    setLinks(null);
    try {
      const result = await api.get(`${endpoint}/evidence`);
      setLinks(result.data);
    } catch (error) {
      setMessage(api.isAxiosError(error) && typeof error.response?.data?.message === "string" ? error.response.data.message : "Could not open the evidence.");
    } finally {
      setLoadingEvidence(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-[#161f2e] p-4">
      <h3 className="font-semibold">Manual trading verification</h3>
      {client.isKycVerified ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-green-300">Trading verification approved</span>
          {canOpenEvidence && <button type="button" onClick={() => void openEvidence()} disabled={loadingEvidence} className="text-amber-200 underline disabled:opacity-50">
            {loadingEvidence ? "Loading…" : "Get evidence links"}
          </button>}
          {links && <>
            <a href={links.identity} target="_blank" rel="noreferrer" className="text-amber-200 underline">Open identity evidence</a>
            <a href={links.address} target="_blank" rel="noreferrer" className="text-amber-200 underline">Open address evidence</a>
          </>}
        </div>
      ) : eligible ? (
        <>
          <button type="button" onClick={() => setOpen(value => !value)} disabled={saving} className="rounded-lg border border-amber-600 px-4 py-2 text-sm text-amber-200">
            {open ? "Close review" : "Upload and review evidence"}
          </button>
          {open && <form onSubmit={approve} className="space-y-3 text-sm">
            <p className="text-slate-300">Use the identity and address evidence you verified for this client. Files are available to the owner only.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>Government-issued ID<input className={field} type="file" name="identity" accept={accept} required /></label>
              <label>Proof of address<input className={field} type="file" name="address" accept={accept} required /></label>
              <label>ID issuing country
                <select className={field} name="documentCountry" defaultValue="" required>
                  <option value="" disabled>Select country</option>
                  {countriesData.filter(({ iso }) => iso !== "AE").map(({ iso, country }) => <option key={iso} value={iso}>{country}</option>)}
                </select>
              </label>
              <label>Verification case reference (optional)<input name="caseReference" className={field} maxLength={80} /></label>
            </div>
            <label className="block">Review notes<textarea className={field} name="reason" minLength={20} maxLength={1000} required placeholder="Record what you checked. Leave out full document numbers." /></label>
            <label className="flex items-start gap-2"><input name="reviewedEvidence" type="checkbox" value="true" required /> I verified this client’s identity and address against the evidence provided.</label>
            <button type="submit" disabled={saving} className="rounded-lg bg-green-700 px-4 py-2 font-semibold disabled:opacity-50">{saving ? "Saving review…" : "Approve trading verification"}</button>
          </form>}
        </>
      ) : <p className="text-sm text-slate-300">An active, verified registration is required before trading verification.</p>}
      {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
    </section>
  );
}
