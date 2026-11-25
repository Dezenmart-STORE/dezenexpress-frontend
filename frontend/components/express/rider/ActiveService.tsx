"use client";

import { useState, useEffect, useCallback } from "react";
import { riderApi, RiderJob, ApiError } from "@/lib/express/api";
import StatusTracker from "../shared/StatusTracker";
import MapPlaceholder from "../shared/MapPlaceholder";
import {
  MapPinIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

function JobCard({
  job,
  onChanged,
  onCompleted,
}: {
  job: RiderJob;
  onChanged: (patch: Partial<RiderJob>) => void;
  onCompleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // false when the completion-code email failed after pickup
  const [codeSendFailed, setCodeSendFailed] = useState(false);

  const status = job.status;
  const started = status === "in_progress" || status === "arrived_at_dropoff";

  const step = async (
    next: "arrived_at_pickup" | "in_progress" | "arrived_at_dropoff",
  ) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await riderApi.updateStatus(job.id, next);
      onChanged({ status: next });
      if (next === "in_progress") {
        if (res.data?.completionCodeSent === false) {
          setCodeSendFailed(true);
          setNotice(
            "The trip started, but the code email failed. Tap “Send the code”.",
          );
        } else {
          setNotice("Completion code emailed to the customer.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the job");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await riderApi.resendOtp(job.id);
      setCodeSendFailed(false);
      setNotice("A new code was sent. The old one no longer works.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend the code",
      );
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (code.length !== 6) return setError("Enter the 6-digit code");
    setBusy(true);
    setError(null);
    try {
      await riderApi.verifyOtp(job.id, code);
      onCompleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        // Codes last 5 minutes and are first sent at pickup — send a fresh one.
        try {
          await riderApi.resendOtp(job.id);
          setNotice(
            "That code had expired, so a new one was sent. Ask for the new code.",
          );
          setCode("");
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Code expired — could not resend",
          );
        }
      } else {
        setError(err instanceof Error ? err.message : "Invalid code");
      }
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all disabled:opacity-30";

  return (
    <div className="flex flex-col gap-4">
      <MapPlaceholder
        pickup={job.pickupAddress?.address}
        destination={job.dropoffAddress?.address}
        height="h-40"
      />

      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#e0e0e0] capitalize">
              {job.type}
            </p>
            <p className="text-[11px] text-[#555] font-mono">
              {job.bookingRef}
            </p>
          </div>
          <p className="text-[15px] font-bold text-green-400">
            ₦{(job.fareAmount ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Customer
            </p>
            <p className="text-[13px] text-[#e0e0e0] truncate">
              {job.customerName ?? "—"}
            </p>
          </div>
          {job.customerPhone && (
            <a
              href={`tel:${job.customerPhone}`}
              className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[12px] font-semibold no-underline hover:bg-green-500/20 shrink-0"
            >
              Call {job.customerPhone}
            </a>
          )}
        </div>

        {job.type === "delivery" && job.recipientName && (
          <div className="flex items-center justify-between gap-3 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">
                Recipient
              </p>
              <p className="text-[13px] text-[#e0e0e0] truncate">
                {job.recipientName}
              </p>
            </div>
            {job.recipientPhone && (
              <a
                href={`tel:${job.recipientPhone}`}
                className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[12px] font-semibold no-underline hover:bg-green-500/20 shrink-0"
              >
                Call {job.recipientPhone}
              </a>
            )}
          </div>
        )}

        <div className="divide-y divide-[#1e1e1e] border-t border-[#1e1e1e]">
          <div className="flex items-start gap-3 py-2.5">
            <div className="w-3 h-3 rounded-full bg-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">
                Pickup
              </p>
              <p className="text-[13px] text-[#e0e0e0]">
                {job.pickupAddress?.address}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-2.5">
            <MapPinIcon size={13} color="#ff2d2d" className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">
                Drop-off
              </p>
              <p className="text-[13px] text-[#e0e0e0]">
                {job.dropoffAddress?.address}
              </p>
            </div>
          </div>
          {job.package && (
            <div className="flex justify-between gap-4 py-2.5">
              <p className="text-[12px] text-[#555]">Package</p>
              <p className="text-[12px] text-[#aaa] text-right capitalize">
                {job.package.sizeCategory} · {job.package.description}
              </p>
            </div>
          )}
          {job.notes && (
            <div className="flex justify-between gap-4 py-2.5">
              <p className="text-[12px] text-[#555]">Notes</p>
              <p className="text-[12px] text-[#aaa] text-right">{job.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
        <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-4">
          Progress
        </h3>
        <StatusTracker status={status} type={job.type} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[12px] text-green-400">
          <CheckCircleIcon size={13} color="currentColor" />
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3 bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
        <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
          Next step
        </h3>

        {status === "accepted" && (
          <div className="flex gap-3">
            <button
              onClick={() => step("arrived_at_pickup")}
              disabled={busy}
              className={`${btn} bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] hover:border-[#444]`}
            >
              I've arrived at pickup
            </button>
            <button
              onClick={() => step("in_progress")}
              disabled={busy}
              className={`${btn} bg-[#ff2d2d] border-none text-white hover:opacity-90`}
            >
              {job.type === "ride" ? "Start trip" : "Picked up"}
            </button>
          </div>
        )}

        {status === "arrived_at_pickup" && (
          <button
            onClick={() => step("in_progress")}
            disabled={busy}
            className={`${btn} bg-[#ff2d2d] border-none text-white hover:opacity-90`}
          >
            {job.type === "ride" ? "Start trip" : "Picked up"}
          </button>
        )}

        {status === "in_progress" && (
          <button
            onClick={() => step("arrived_at_dropoff")}
            disabled={busy}
            className={`${btn} bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] hover:border-[#444]`}
          >
            I've arrived at drop-off
          </button>
        )}

        {started && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                Ask the customer
                {job.type === "delivery" ? " (or the recipient)" : ""} for their
                6-digit completion code. It expires 5 minutes after it's sent,
                so send a new one when you arrive.
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[20px] text-[#e0e0e0] font-mono text-center tracking-[0.4em] focus:border-[#ff2d2d] focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={resend}
                disabled={busy}
                className={`${btn} bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] hover:border-[#444]`}
              >
                {codeSendFailed ? "Send the code" : "Send the code again"}
              </button>
              <button
                onClick={complete}
                disabled={busy || code.length !== 6}
                className={`${btn} flex-[2] bg-[#ff2d2d] border-none text-white hover:opacity-90`}
              >
                {busy ? "Working…" : "Verify & complete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveService() {
  const [jobs, setJobs] = useState<RiderJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedRef, setCompletedRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riderApi.getJobs();
      setJobs(res.data?.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Active Jobs
          </h1>
          <p className="text-[12px] text-[#555]">
            {jobs.length === 0
              ? "Your current rides and deliveries"
              : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} in progress`}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          aria-label="Refresh"
        >
          <RefreshIcon size={14} color="#555" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {completedRef && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
          <CheckCircleIcon size={15} color="currentColor" />
          {completedRef} completed — your earnings have been credited.
        </div>
      )}

      {jobs.length === 0 && !error ? (
        <div className="flex flex-col items-center py-20 gap-4 text-[#555] bg-[#1a1a1a] border border-[#222] rounded-2xl">
          <p className="text-[15px] font-medium text-[#777]">No active jobs</p>
          <p className="text-[12px] text-center max-w-xs">
            Accept a request from the Requests tab to start.
          </p>
        </div>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onChanged={(patch) =>
              setJobs((prev) =>
                prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)),
              )
            }
            onCompleted={() => {
              setCompletedRef(job.bookingRef);
              setJobs((prev) => prev.filter((j) => j.id !== job.id));
            }}
          />
        ))
      )}
    </div>
  );
}
