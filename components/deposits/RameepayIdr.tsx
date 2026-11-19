"use client";
import { useState, useEffect } from "react";
import axios from "../../lib/apiClient";
import { isAxiosError } from "axios";
import { Landmark, X } from "lucide-react";
import Button from "../../components/Button";
import toast from "react-hot-toast";
import { announceBuddyIssue } from "../../lib/bdfxBuddy";
import { MIN_DEPOSIT_IDR, MAX_DEPOSIT_IDR } from "../../constants/deposit";
import { useUserProfile } from "../../lib/userStore";

// Indonesia (IDR) deposit through RameeGlobalPay. Backend: POST
// /api/payment/ramee-global/idr/deposit -> { success, orderid, url, amountIdr, amountUSD }.
// Toasts render through the <Toaster /> mounted by the sibling RameepaySlk card.
function RameepayIdr() {
  const { accounts } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ accountNo: "", amount: "" });

  // Auto-select the first account once accounts load from the store.
  useEffect(() => {
    if (accounts.length > 0 && !form.accountNo) {
      setForm((prev) => ({ ...prev, accountNo: accounts[0].accountNo.toString() }));
    }
  }, [accounts, form.accountNo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const value = form.amount.trim();
    // Rupiah has no decimals; the backend rejects anything but whole numbers.
    if (!/^\d{1,7}$/.test(value)) {
      toast.error("Enter a valid IDR amount in whole rupiah.");
      return;
    }
    const amount = Number(value);
    if (amount < MIN_DEPOSIT_IDR) {
      toast.error(`The minimum deposit amount is IDR ${MIN_DEPOSIT_IDR.toLocaleString("en-GB")}.`);
      return;
    }
    if (amount > MAX_DEPOSIT_IDR) {
      toast.error(`The maximum deposit amount is IDR ${MAX_DEPOSIT_IDR.toLocaleString("en-GB")}.`);
      return;
    }
    if (!form.accountNo) {
      toast.error("Select an account to deposit into.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/payment/ramee-global/idr/deposit`,
        { accountNo: form.accountNo, amount },
      );

      const checkoutUrl = res.data?.success ? res.data.url : undefined;
      if (typeof checkoutUrl === "string" && checkoutUrl.startsWith("https://")) {
        // Keep the loading state while the browser leaves for the hosted checkout.
        window.location.href = checkoutUrl;
        return;
      }
      toast.error("Could not start the IDR checkout. Try again.");
      announceBuddyIssue("payment");
      setLoading(false);
    } catch (err) {
      console.error(err);
      const message = isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error(typeof message === "string" && message ? message : "Deposit failed. Try again.");
      announceBuddyIssue("payment");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-md border border-gray-700 bg-[#111827] rounded-2xl shadow-lg p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <Landmark aria-hidden="true" size={32} className="shrink-0 text-(--primary-color)" />
          <h2 className="text-xl font-semibold">Indonesia (IDR)</h2>
        </div>
        <p className="text-gray-300 text-sm">
          Secure and fast deposit using RaamiPay. Click below to proceed.
        </p>
        <Button type="button" text="Deposit" onClick={() => setShowModal(true)} className="w-fit" />
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#1f2937] p-6 rounded-xl w-full max-w-md relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4">Deposit with RaamiPay (IDR)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="idr-account" className="block text-sm text-gray-300 mb-1">
                  Select Account
                </label>
                <select
                  id="idr-account"
                  name="accountNo"
                  value={form.accountNo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                >
                  {accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <option key={acc._id} value={acc.accountNo}>
                        {acc.accountNo} ({acc.currency})
                      </option>
                    ))
                  ) : (
                    <option value="">No accounts available</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="idr-amount" className="block text-sm text-gray-300 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">IDR</span>
                  <input
                    id="idr-amount"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    min={MIN_DEPOSIT_IDR}
                    max={MAX_DEPOSIT_IDR}
                    step="1"
                    inputMode="numeric"
                    placeholder={String(MIN_DEPOSIT_IDR)}
                    className="w-full pl-12 pr-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-(--primary-color)"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum IDR {MIN_DEPOSIT_IDR.toLocaleString("en-GB")}, maximum IDR {MAX_DEPOSIT_IDR.toLocaleString("en-GB")}, whole rupiah only. Your account is credited in USD once the payment is confirmed.
                </p>
              </div>

              <Button
                text={loading ? "Processing..." : "Confirm Deposit"}
                className="w-fit disabled:opacity-50"
                disabled={loading}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RameepayIdr;
