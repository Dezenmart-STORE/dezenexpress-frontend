"use client";

import { useState, useEffect } from "react";
import { ClockIcon } from "@/components/Icons";

interface Props {
  arrivalMinutes?: number; // minutes until rider arrives at pickup
  deliveryMinutes?: number; // minutes until delivery complete
  shippedAt?: string; // ISO string — when rider picked up
  type?: "ride" | "delivery";
  status?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Countdown({ targetMs }: { targetMs: number }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, targetMs - Date.now()),
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (remaining <= 0) {
    return <span className="text-green-400 font-semibold">Arriving now</span>;
  }

  return (
    <span className="font-mono font-bold text-[#ff2d2d]">
      {hrs > 0 ? `${pad(hrs)}:` : ""}
      {pad(remMins)}:{pad(secs)}
    </span>
  );
}

export default function ETADisplay({
  arrivalMinutes,
  deliveryMinutes,
  shippedAt,
  type = "delivery",
  status,
}: Props) {
  const now = Date.now();
  const arrivalTarget = arrivalMinutes
    ? now + arrivalMinutes * 60 * 1000
    : null;
  const deliveryTarget = deliveryMinutes
    ? now + deliveryMinutes * 60 * 1000
    : null;
  const shippedAtMs = shippedAt ? new Date(shippedAt).getTime() : null;

  // Estimate delivery from shipped time + delivery duration
  const deliveryFromShipped =
    shippedAtMs && deliveryMinutes
      ? shippedAtMs + deliveryMinutes * 60 * 1000
      : null;

  const finalDelivery = deliveryTarget ?? deliveryFromShipped;

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString("en-NG", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center gap-2">
        <ClockIcon size={14} color="#ff2d2d" />
        <p className="text-[12px] font-semibold text-[#aaa]">Time Estimates</p>
      </div>

      <div className="divide-y divide-[#1e1e1e]">
        {/* Rider arrival */}
        {arrivalTarget &&
          (status === "accepted" || status === "requested" || !status) && (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[12px] font-medium text-[#e0e0e0]">
                  {type === "ride" ? "Rider arrives at" : "Pickup in"}
                </p>
                <p className="text-[11px] text-[#555]">
                  around {formatTime(arrivalTarget)}
                </p>
              </div>
              <div className="text-right">
                <Countdown targetMs={arrivalTarget} />
                <p className="text-[10px] text-[#555] mt-0.5">remaining</p>
              </div>
            </div>
          )}

        {/* Rider arrived */}
        {status === "arrived" && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-green-400">
                Rider has arrived
              </p>
              <p className="text-[11px] text-[#555]">Share your OTP to begin</p>
            </div>
          </div>
        )}

        {/* Estimated completion */}
        {finalDelivery && (
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[12px] font-medium text-[#e0e0e0]">
                {type === "ride" ? "Estimated arrival" : "Estimated delivery"}
              </p>
              <p className="text-[11px] text-[#555]">
                {formatDateTime(finalDelivery)}
              </p>
            </div>
            <div className="text-right">
              {finalDelivery > Date.now() ? (
                <>
                  <Countdown targetMs={finalDelivery} />
                  <p className="text-[10px] text-[#555] mt-0.5">remaining</p>
                </>
              ) : (
                <span className="text-[12px] font-semibold text-green-400">
                  Completed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Distance + duration breakdown */}
        {deliveryMinutes && arrivalMinutes && (
          <div className="px-4 py-3 bg-[#111]/50">
            <div className="flex items-center justify-between text-[11px] text-[#444]">
              <span>Rider en route</span>
              <span>{arrivalMinutes} min</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              {/* Arrival segment */}
              <div
                className="h-1.5 rounded-full bg-[#ff2d2d]/60"
                style={{
                  width: `${(arrivalMinutes / (arrivalMinutes + deliveryMinutes)) * 100}%`,
                }}
              />
              {/* Delivery segment */}
              <div className="h-1.5 rounded-full bg-green-500/40 flex-1" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#444] mt-1.5">
              <span>
                {type === "ride" ? "Trip duration" : "Delivery duration"}
              </span>
              <span>{deliveryMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#666] mt-2 pt-2 border-t border-[#1e1e1e]">
              <span>Total time</span>
              <span>{arrivalMinutes + deliveryMinutes} min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
