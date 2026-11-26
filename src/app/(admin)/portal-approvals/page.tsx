"use client";

import { type FormEvent, useState } from "react";
import api from "../../../../lib/apiClient";

type PortalClient = {
  _id: string;
  fullName: string;
  email: string;
  isVerified?: boolean | null;
  portalBlocked?: boolean;
  portalAccessStatus?: "approved" | "rejected" | null;
};

const authApi = process.env.NEXT_PUBLIC_API_BASE + "/api/auth";
const button = "rounded bg-slate-700 px-4 py-2 disabled:opacity-50";

export default function PortalApprovalsPage() {
  const [email, setEmail] = useState("");
  const [client, setClient] = useState<PortalClient | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  function showError(err: unknown, fallback: string) {
    setError(api.isAxiosError(err) && typeof err.response?.data?.message === "string" ? err.response.data.message : fallback);
  }

  async function findClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setClient(null);
    setConfirm(false);
    setError("");
    try {
      const result = await api.get<PortalClient>(authApi + "/portal-review-client", { params: { email: email.trim() } });
      setClient(result.data);
    } catch (err) { showError(err, "Could not find the client."); }
    finally { setBusy(false); }
  }

  async function approve() {
    if (!client || !confirm || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.patch<Pick<PortalClient, "portalAccessStatus" | "portalBlocked" | "isVerified">>(
        authApi + "/users/" + client._id + "/portal-access", { decision: "approved" });
      setClient({ ...client, ...data });
    } catch (err) { showError(err, "Could not approve portal access. Find the client again to check their status."); }
    finally { setConfirm(false); setBusy(false); }
  }

  const restricted = client?.portalBlocked || client?.portalAccessStatus === "rejected";
  return <div className="mx-auto max-w-3xl space-y-6 p-4 text-slate-100">
    <h1 className="text-2xl font-semibold">Portal approvals</h1>
    <form onSubmit={findClient} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 text-sm">Client’s registered email
        <input type="email" required maxLength={254} disabled={busy} value={email}
          onChange={e => { setEmail(e.target.value); setClient(null); setConfirm(false); setError(""); }}
          className="mt-1 block w-full rounded border border-slate-600 bg-slate-950 p-2" />
      </label>
      <button disabled={busy} className={button}>Find client</button>
    </form>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {client && <section aria-label="Client portal access" className="space-y-3 rounded-lg border border-slate-700 p-4">
      <h2 className="font-semibold">{client.fullName} · {client.email}</h2>
      {restricted ? <p>This client has a portal restriction. Ask the owner to review it.</p> :
        client.portalAccessStatus === "approved" ? <p role="status">Portal access approved.</p> :
        confirm ? <>
          <p>Allow this client to sign in to the BDFX portal?</p>
          <div className="flex gap-2">
            <button disabled={busy} className={button} onClick={approve}>{busy ? "Saving…" : "Confirm portal approval"}</button>
            <button disabled={busy} className={button} onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        </> : <>
          <p>{client.isVerified ? "This client can already sign in with a verified registration." : "Portal approval is pending."}</p>
          <button className={button} onClick={() => setConfirm(true)}>Approve portal access</button>
        </>}
    </section>}
  </div>;
}
