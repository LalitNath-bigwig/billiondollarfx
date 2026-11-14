"use client";

import { useState, useEffect } from "react";
import axios from "../../lib/apiClient";
import ProfileImage from "./ProfileImage";
import VeriffVerification from "./VeriffVerification";

export default function KycVerification() {
  const [verification, setVerification] = useState<"loading" | "unavailable" | "veriff" | "verified" | "review">("loading");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { email } = JSON.parse(localStorage.getItem("user") || "{}");
        if (!email) {
          setVerification("unavailable");
          return;
        }
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/user/${encodeURIComponent(email)}`, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setVerification(data.kycProvider === "veriff" ? "veriff" : data.isKycVerified ? "verified" : "review");
        }
      } catch {
        if (!controller.signal.aborted) setVerification("unavailable");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  if (verification === "veriff") return <VeriffVerification />;
  return (
    <div className="space-y-6">
      <ProfileImage />
      <div className="rounded-xl bg-[#121a2a] p-6">
        <h2 className="text-lg font-semibold">Trading account verification</h2>
        <p className="mt-2 text-sm text-gray-300">
          {verification === "loading" && "Loading verification status…"}
          {verification === "unavailable" && "The verification status could not be loaded."}
          {verification === "verified" && "Your trading account verification is complete."}
          {verification === "review" && "Contact BDFX support about verification for live trading and deposits."}
        </p>
        {verification === "review" && <a href="https://wa.me/447999283366" className="mt-4 inline-block text-sm text-[#e3c569] underline">Contact BDFX support</a>}
      </div>
    </div>
  );
}
