"use client";

import { type FormEvent, useState } from "react";
import api from "../../../../lib/apiClient";
import { useAdminSession } from "../../../../lib/adminSession";
import OwnerTradingReview, { type ReviewClient } from "../../../../components/OwnerTradingReview";

type Client = ReviewClient & { email: string; fullName?: string };

export default function TradingApprovalsPage() {
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function findClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setClient(null);
    setError("");
    try {
      const result = await api.get<Client>(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/trading-review-client`, { params: { email: email.trim() } });
      setClient(result.data);
    } catch (err) {
      setError(api.isAxiosError(err) && typeof err.response?.data?.message === "string" ? err.response.data.message : "Could not load the client.");
    } finally {
      setLoading(false);
    }
  }
  return <div className="mx-auto max-w-3xl space-y-6 p-4 text-slate-100">
    <h1 className="text-2xl font-semibold">KYC approvals</h1>
    <form onSubmit={findClient} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 text-sm">Client’s registered email
        <input type="email" required maxLength={254} disabled={loading} value={email}
          onChange={e => { setEmail(e.target.value); setClient(null); setError(""); }}
          className="mt-1 block w-full rounded border border-slate-600 bg-slate-950 p-2" />
      </label>
      <button disabled={loading} className="rounded bg-slate-700 px-4 py-2">{loading ? "Searching…" : "Find client"}</button>
    </form>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {client && <section className="space-y-2">
      <h2 className="font-semibold">{client.fullName} · {client.email}</h2>
      <OwnerTradingReview key={client._id} client={client} canOpenEvidence={session?.role === "owner"}
        onApproved={() => setClient(current => current?._id === client._id ? { ...current, isKycVerified: true } : current)} />
    </section>}
  </div>;
}
