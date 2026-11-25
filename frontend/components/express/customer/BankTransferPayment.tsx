"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  paymentApi,
  expressBookingApi,
  normalizeInitialize,
  normalizePaymentStatus,
  ApiError,
  PaymentInit,
} from "@/lib/express/api";
import { AlertTriangleIcon, CheckCircleIcon } from "@/components/Icons";

type Phase = "loading" | "waiting" | "paid" | "expired" | "error";

const POLL_MS = 6000;

function formatNGN(n: number) {
  return `₦${Number(n).toLocaleString("en-NG")}`;
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="px-2.5 py-1 bg-[#111] border border-[#2a2a2a] rounded-lg text-[11px] text-[#aaa] cursor-pointer hover:border-[#444] shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function BankTransferPayment({
  bookingRef,
  onPaid,
  onCancelled,
}: {
  bookingRef: string;
  onPaid: () => void;
  onCancelled?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [init, setInit] = useState<PaymentInit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const markPaid = useCallback(() => {
    setPhase("paid");
    onPaidRef.current();
  }, []);

  // 1. Open (or reuse) the one-time bank account for this booking.
  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await paymentApi.initialize(bookingRef);
      const p = normalizeInitialize(res);
      if (!p?.virtualAccount || !p.reference)
        throw new Error("No payment account was returned. Please try again.");
      setInit(p);
      setPhase("waiting");
    } catch (err) {
      // 409: already paid, or the booking is no longer pending.
      if (err instanceof ApiError && err.status === 409) {
        try {
          const st = await expressBookingApi.getOrderStatus(bookingRef);
          if (st.data?.paymentStatus === "paid") return markPaid();
        } catch {}
      }
      setError(
        err instanceof ApiError && err.status === 503
          ? "Payments are unavailable right now. Please try again later."
          : err instanceof Error
            ? err.message
            : "Could not start the payment.",
      );
      setPhase("error");
    }
  }, [bookingRef, markPaid]);

  useEffect(() => {
    start();
  }, [start]);

  // 2. Check the payment once. Returns true when it is settled one way or the other.
  const checkOnce = useCallback(async (): Promise<boolean> => {
    if (!init) return false;
    try {
      const info = normalizePaymentStatus(
        await paymentApi.status(init.reference),
      );
      if (info.status === "success") {
        markPaid();
        return true;
      }
      if (info.status === "expired" || info.status === "failed") {
        setPhase("expired");
        return true;
      }
    } catch {
      // network blips are fine — keep polling
    }
    return false;
  }, [init, markPaid]);

  // 3. Poll while we're waiting.
  useEffect(() => {
    if (phase !== "waiting" || !init) return;
    const id = setInterval(() => {
      checkOnce();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [phase, init, checkOnce]);

  // 4. Countdown to expiry.
  useEffect(() => {
    if (phase !== "waiting" || !init?.virtualAccount?.expiresAt) return;
    const target = new Date(init.virtualAccount.expiresAt).getTime();
    const tick = () => {
      const left = Math.round((target - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) setPhase("expired");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, init]);

  const handleCheckNow = async () => {
    setChecking(true);
    await checkOnce();
    setChecking(false);
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this booking? You haven't been charged.")) return;
    setCancelling(true);
    try {
      await expressBookingApi.cancelOrder(
        bookingRef,
        "Cancelled before payment",
      );
      onCancelled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel.");
      setCancelling(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center py-12 gap-3">
        <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#555]">
          Preparing your payment account…
        </p>
      </div>
    );
  }

  if (phase === "paid") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
          <CheckCircleIcon size={30} color="#22c55e" />
        </div>
        <p className="font-[var(--font-syne)] font-bold text-lg text-[#f0f0f0]">
          Payment received
        </p>
        <p className="text-[12px] text-[#555]">We're finding you a rider.</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
        <button
          onClick={start}
          className="w-full py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  const acct = init!.virtualAccount!;

  if (phase === "expired") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[12px] text-amber-400">
          <AlertTriangleIcon
            size={13}
            color="currentColor"
            className="shrink-0 mt-0.5"
          />
          This payment account has closed. If you already transferred the money,
          tap “Check again”; otherwise get a new account.
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#444] disabled:opacity-40"
          >
            {checking ? "Checking…" : "Check again"}
          </button>
          <button
            onClick={start}
            className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
          >
            Get a new account
          </button>
        </div>
      </div>
    );
  }

  // waiting
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider">
            Pay by bank transfer
          </p>
          {secondsLeft !== null && (
            <span className="text-[11px] text-amber-400 font-mono">
              Expires in {formatClock(secondsLeft)}
            </span>
          )}
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Bank
            </p>
            <p className="text-[14px] text-[#e0e0e0] font-semibold">
              {acct.bankName}
            </p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Account number
            </p>
            <p className="text-[22px] text-[#ff2d2d] font-bold font-mono tracking-wider">
              {acct.accountNumber}
            </p>
          </div>
          <CopyButton value={acct.accountNumber} label="account number" />
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Account name
            </p>
            <p className="text-[13px] text-[#e0e0e0] truncate">
              {acct.accountName}
            </p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Exact amount
            </p>
            <p className="text-[18px] text-[#f0f0f0] font-bold font-[var(--font-syne)]">
              {formatNGN(init!.amount)}
            </p>
          </div>
          <CopyButton value={String(init!.amount)} label="amount" />
        </div>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <AlertTriangleIcon
          size={13}
          color="#f59e0b"
          className="shrink-0 mt-0.5"
        />
        <p className="text-[11px] text-amber-400">
          Send exactly {formatNGN(init!.amount)} in a single transfer from your
          banking app. A smaller amount isn't credited. This page updates by
          itself once the bank confirms.
        </p>
      </div>

      {error && <p className="text-[11px] text-red-400 px-1">{error}</p>}

      <div className="flex items-center justify-center gap-2 text-[11px] text-[#555]">
        <div className="w-3 h-3 border border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        Waiting for your transfer…
      </div>

      <div className="flex gap-3">
        {onCancelled && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 py-2.5 bg-transparent border border-red-500/30 text-red-400 rounded-xl text-[13px] cursor-pointer hover:bg-red-500/10 disabled:opacity-40"
          >
            {cancelling ? "Cancelling…" : "Cancel booking"}
          </button>
        )}
        <button
          onClick={handleCheckNow}
          disabled={checking}
          className="flex-[2] py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#444] disabled:opacity-40"
        >
          {checking ? "Checking…" : "I've paid — check now"}
        </button>
      </div>
    </div>
  );
}
