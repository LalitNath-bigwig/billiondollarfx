"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import api from "../lib/apiClient";
import { useAdminSession } from "../lib/adminSession";
import { canAccessAdminPath } from "../lib/adminAccess";

interface Report {
  generatedAt: string;
  period: { from: string; to: string; timezone: string };
  registrations: number;
  newTradingAccounts: number;
  ibApplications: number;
  newEnquiries: number;
  newTickets: number;
  depositOrders: { status: string | null; count: number }[];
  payoutRequests: { status: string | null; count: number }[];
  countries: { country: string; count: number }[];
  queues: Record<string, number>;
  note: string;
}

interface Selection {
  group: "period" | "queue";
  metric: string;
  label: string;
  permissionPath: string;
  value?: string;
}
interface Detail {
  id: string;
  clientId?: string;
  name?: string;
  email?: string;
  reference?: string;
  detail?: string;
  status?: string;
  createdAt: string;
}
interface Details {
  data: Detail[];
  total: number;
  page: number;
  pages: number;
}

const periodCards = [
  ["registrations", "Verified registrations", "/users"],
  ["newTradingAccounts", "New live trading accounts", "/all-transactions"],
  ["ibApplications", "New IB applications", "/IB"],
  ["newEnquiries", "New enquiries", "/enquiries"],
  ["newTickets", "New support tickets", "/tickets"],
] as const;
const queueCards = [
  ["pendingKyc", "KYC awaiting completion", "/users"],
  ["pendingIb", "Pending IB applications", "/IB"],
  ["pendingBank", "Bank details awaiting approval", "/bankapproval"],
  ["pendingPayouts", "Pending / processing payouts", "/payout-requests"],
  ["openTickets", "Open / pending tickets", "/tickets"],
  ["newEnquiries", "New enquiries", "/enquiries"],
] as const;
const paymentGroups = [
  ["depositOrders", "Deposit orders created in period", "/all-transactions"],
  ["payoutRequests", "Payout requests created in period", "/payout-requests"],
] as const;
const todayDubai = () => new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10);
const dubaiTime = (date: string) => new Date(date).toLocaleString("en-GB", { timeZone: "Asia/Dubai" });
const apiPath = `${process.env.NEXT_PUBLIC_API_BASE}/api/operations/report`;

function reportError(error: unknown, fallback: string) {
  return api.isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

export default function BusinessReport() {
  const [from, setFrom] = useState(todayDubai);
  const [to, setTo] = useState(todayDubai);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<Details | null>(null);
  const [detailError, setDetailError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const session = useAdminSession();
  const period = report?.period;

  async function load(start: string, end: string) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Report>(apiPath, { params: { from: start, to: end } });
      setReport(data);
    } catch (err) {
      setError(reportError(err, "Unable to load this report."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = todayDubai();
    void load(today, today);
  }, []);

  useEffect(() => {
    if (!selection || !period) return;
    const controller = new AbortController();
    api.get<Details>(`${apiPath}/details`, {
      params: { group: selection.group, metric: selection.metric, value: selection.value, from: period.from, to: period.to, page },
      signal: controller.signal,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setDetails(data);
    }).catch(error => {
      if (!controller.signal.aborted) setDetailError(reportError(error, "Unable to load matching records."));
    });
    return () => controller.abort();
  }, [selection, period, page]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(from, to);
  }

  function openDetails(next: Selection) {
    setPage(1);
    setDetails(null);
    setDetailError("");
    setSelection(next);
    dialog.current?.showModal();
  }

  function changePage(next: number) {
    setDetails(null);
    setDetailError("");
    setPage(next);
  }

  function drilldown(target: Selection, count: number, className: string, children: React.ReactNode) {
    if (!session || !canAccessAdminPath(session, target.permissionPath)) {
      return <div key={target.label} className={className}>{children}</div>;
    }
    return (
      <button
        key={target.label}
        type="button"
        aria-label={`View ${count} matching records for ${target.label}`}
        aria-haspopup="dialog"
        onClick={() => openDetails(target)}
        className={`${className} w-full cursor-pointer text-left transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-[#d6b659]`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <h1 className="text-3xl font-semibold">Business report</h1>
        <p className="mt-2 text-sm text-slate-300">Registrations, account activity and work queues. Reporting dates use Dubai time (UTC+4).</p>
      </header>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-700 bg-[#101827] p-5 print:hidden">
        <label className="text-sm">From<input required type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-2 block rounded-lg border border-slate-600 bg-[#080f1c] p-2 text-white [color-scheme:dark]" /></label>
        <label className="text-sm">To<input required type="date" min={from} value={to} onChange={event => setTo(event.target.value)} className="mt-2 block rounded-lg border border-slate-600 bg-[#080f1c] p-2 text-white [color-scheme:dark]" /></label>
        <button disabled={loading} className="rounded-lg bg-[#d6b659] px-5 py-2 font-semibold text-black disabled:opacity-50">{loading ? "Loading…" : "Update report"}</button>
        {report && <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-500 px-5 py-2">Print report</button>}
      </form>
      {error && <p role="alert" className="rounded-lg bg-red-950/40 p-4">{error}</p>}
      {loading && <p role="status" className="text-slate-300">Loading business activity…</p>}
      {report && <>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-400">
          <p>{report.period.from} to {report.period.to} · {report.period.timezone}</p>
          <p>Generated {dubaiTime(report.generatedAt)} Dubai</p>
        </div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {periodCards.map(([metric, label, permissionPath]) => drilldown(
            { group: "period", metric, label, permissionPath }, report[metric], "rounded-xl border border-slate-700 bg-[#101827] p-5",
            <><span className="block text-sm text-slate-400">{label}</span><span className="mt-3 block text-3xl font-semibold">{report[metric]}</span></>,
          ))}
        </section>
        <section className="rounded-xl border border-slate-700 bg-[#101827] p-6">
          <h2 className="text-xl font-semibold">Current work queues</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {queueCards.map(([metric, label, permissionPath]) => drilldown(
              { group: "queue", metric, label, permissionPath }, report.queues[metric], "flex items-center justify-between gap-4 rounded-lg bg-[#080f1c] p-4",
              <><span className="text-sm text-slate-300">{label}</span><span className="text-xl font-semibold text-[#d6b659]">{report.queues[metric]}</span></>,
            ))}
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-3">
          {paymentGroups.map(([metric, label, permissionPath]) => (
            <section key={metric} className="rounded-xl border border-slate-700 bg-[#101827] p-6">
              <h2 className="font-semibold">{label}</h2>
              <div className="mt-4 space-y-1">
                {report[metric].length ? report[metric].map(row => drilldown(
                  { group: "period", metric, label: `${label} · ${row.status ?? "Unspecified"}`, permissionPath, value: row.status ?? undefined },
                  row.count, "flex justify-between gap-3 rounded-md px-2 py-1.5 text-sm",
                  <><span className="text-slate-300">{row.status ?? "Unspecified"}</span><span>{row.count}</span></>,
                )) : <p className="text-sm text-slate-400">No records in this period.</p>}
              </div>
            </section>
          ))}
          <section className="rounded-xl border border-slate-700 bg-[#101827] p-6">
            <h2 className="font-semibold">Registration countries</h2>
            <div className="mt-4 space-y-1">
              {report.countries.length ? report.countries.map(row => drilldown(
                { group: "period", metric: "countries", label: row.country, permissionPath: "/users", value: row.country },
                row.count, "flex justify-between gap-3 rounded-md px-2 py-1.5 text-sm",
                <><span className="text-slate-300">{row.country}</span><span>{row.count}</span></>,
              )) : <p className="text-sm text-slate-400">No registrations in this period.</p>}
            </div>
          </section>
        </div>
        <p className="text-xs leading-6 text-slate-400">{report.note}</p>
        <p className="text-sm print:hidden"><Link href="/activity-log" className="text-[#d6b659] underline">Owner activity history</Link></p>
      </>}
      <dialog ref={dialog} aria-labelledby="report-details-title" onClose={() => setSelection(null)} className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-xl border border-slate-600 bg-[#101827] p-0 text-white backdrop:bg-black/75 print:hidden">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-700 bg-[#101827] px-5 py-4">
          <div>
            <h2 id="report-details-title" className="text-lg font-semibold">{selection?.label}</h2>
            <p className="mt-1 text-sm text-slate-300">{selection?.group === "queue" ? "Current work queue" : `${period?.from} to ${period?.to} · Dubai`}</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-md border border-slate-500 px-3 py-1.5 text-sm">Close</button>
        </header>
        <div className="space-y-4 p-5">
          {detailError && <p role="alert">{detailError}</p>}
          {!detailError && !details && <p role="status">Loading matching records…</p>}
          {details && (details.data.length ? <>
            <p className="text-sm text-slate-300">{details.total} matching {details.total === 1 ? "record" : "records"}</p>
            <ul className="divide-y divide-slate-700">
              {details.data.map(row => (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2 py-3 text-sm">
                  <div className="min-w-0 flex-1 space-y-1">
                    {row.clientId ? <Link className="break-words font-medium text-[#e3c569] underline" href={`/users?client=${encodeURIComponent(row.clientId)}`}>{row.name || row.email || "Open client details"}</Link> : <p className="break-words font-medium">{row.name || row.email || row.reference || "Client unavailable"}</p>}
                    {row.name && row.email && <p className="break-all text-slate-300">{row.email}</p>}
                    {row.reference && (row.name || row.email) && <p className="break-words text-slate-200">{row.reference}</p>}
                    {row.detail && <details className="text-slate-300"><summary className="cursor-pointer">Details</summary><p className="mt-1 whitespace-pre-line break-words">{row.detail}</p></details>}
                  </div>
                  <div className="text-right">
                    {row.status && <p className="font-medium">{row.status}</p>}
                    {row.createdAt && <p className="mt-1 text-xs text-slate-400">{dubaiTime(row.createdAt)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </> : <p>No matching records.</p>)}
          {details && details.pages > 1 && <nav aria-label="Report details pages" className="flex items-center justify-between gap-3 text-sm">
            <button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} className="rounded-md border border-slate-500 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <span>Page {page} of {details.pages}</span>
            <button type="button" disabled={page >= details.pages} onClick={() => changePage(page + 1)} className="rounded-md border border-slate-500 px-3 py-1.5 disabled:opacity-40">Next</button>
          </nav>}
        </div>
      </dialog>
    </div>
  );
}
