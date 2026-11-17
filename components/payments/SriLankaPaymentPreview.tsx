"use client";

import { useState, type FormEvent } from "react";
import { Landmark } from "lucide-react";
import Button from "../Button";

type Direction = "deposit" | "withdrawal";

// Merchant-reported LKR methods for the client preview.
const payoutMethods = [
  ["IPAY", "iPay"], ["UPAY", "Upay"], ["COMBANK", "Commercial Bank"],
  ["DIALOG", "Dialog Finance"], ["HNB", "Hatton National Bank"],
  ["LOLC", "LOLC Finance"], ["NDB", "NDB Bank"], ["NTB", "Nations Trust Bank"],
  ["SAMPATH", "Sampath Vishwa"],
] as const;

const fieldStyle = "mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white";

export function SriLankaPaymentPreview({ direction }: { direction: Direction }) {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const withdrawal = direction === "withdrawal";

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = String(data.get("testAmount") ?? "").trim();
    if (!/^\d{1,12}(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
      setError("Enter a positive LKR amount with up to two decimal places.");
      return;
    }
    const amount = Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2 });
    const method = payoutMethods.find(([code]) => code === data.get("testMethod"));
    if (withdrawal && !method) {
      setError("Choose a payout method.");
      return;
    }
    setError("");
    setResult(withdrawal
      ? `Test withdrawal of LKR ${amount} via ${method?.[1]}. The next step in a live withdrawal would be admin approval.`
      : `Test deposit of LKR ${amount}. The next step in a live deposit would be RameePay checkout.`);
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-amber-200">Test mode only. This preview runs on your screen and does not move money.</p>
      {result ? (
        <>
          <p role="status" className="rounded-lg border border-gray-600 p-3">{result}</p>
          <Button type="button" text="Try again" onClick={() => setResult("")} />
        </>
      ) : (
        <form onSubmit={preview} className="space-y-3">
          {withdrawal && (
            <label className="block text-gray-200">
              Payout method
              <select name="testMethod" required defaultValue="" className={fieldStyle}>
                <option value="" disabled>Select a bank or wallet</option>
                {payoutMethods.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-gray-200">
            Test amount (LKR)
            <input name="testAmount" inputMode="decimal" required maxLength={15}
              placeholder="0.00" className={fieldStyle} />
          </label>
          {error && <p role="alert" className="text-amber-200">{error}</p>}
          <Button text={withdrawal ? "Preview withdrawal" : "Preview deposit"} type="submit" />
        </form>
      )}
    </div>
  );
}

export function SriLankaPreviewCard({ direction }: { direction: Direction }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="w-full max-w-md self-start space-y-4 rounded-2xl border border-gray-700 bg-[#111827] p-6 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <Landmark aria-hidden="true" size={32} className="shrink-0 text-[var(--primary-color)]" />
        <h2 className="text-xl font-semibold">Sri Lanka (LKR)</h2>
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className="rounded-full border border-[#927948] bg-[#43340c] px-4 py-2 text-sm font-semibold hover:bg-[#665323]">
        {open ? "Close preview" : `Test RameePay ${direction}`}
      </button>
      {open && <SriLankaPaymentPreview direction={direction} />}
    </section>
  );
}
