"use client";

import { CheckCircleIcon } from "@/components/Icons";

// Backend booking statuses:
//   DELIVERY: pending (customer pays) → accepted → arrived_at_pickup (optional) → in_progress
//             → arrived_at_dropoff (optional) → completed
//   RIDE:     pending (rider confirms) → rider_accepted (customer pays) → accepted → …same
//   either:   cancelled
// plus paymentStatus: unpaid | pending | paid

const AFTER_ACCEPT = [
  "accepted",
  "arrived_at_pickup",
  "in_progress",
  "arrived_at_dropoff",
  "completed",
];
const AFTER_PICKUP_ARRIVAL = [
  "arrived_at_pickup",
  "in_progress",
  "arrived_at_dropoff",
  "completed",
];
const AFTER_START = ["in_progress", "arrived_at_dropoff", "completed"];
const AFTER_DROPOFF_ARRIVAL = ["arrived_at_dropoff", "completed"];

export default function StatusTracker({
  status,
  paymentStatus,
  type,
}: {
  status: string;
  /** Omit on the rider side, where payment is always already confirmed. */
  paymentStatus?: string;
  type: "ride" | "delivery" | string;
}) {
  const isRide = type === "ride";
  const paid = paymentStatus === undefined ? true : paymentStatus === "paid";

  const tail = [
    {
      label: isRide ? "Rider at pickup" : "Arrived at pickup",
      done: AFTER_PICKUP_ARRIVAL.includes(status),
    },
    {
      label: isRide ? "Trip started" : "Package picked up",
      done: AFTER_START.includes(status),
    },
    {
      label: isRide ? "Arrived at destination" : "Arrived at drop-off",
      done: AFTER_DROPOFF_ARRIVAL.includes(status),
    },
    {
      label: isRide ? "Trip complete" : "Delivered",
      done: status === "completed",
    },
  ];

  const steps: { label: string; done: boolean }[] = isRide
    ? [
        { label: "Ride requested", done: true },
        {
          label: "Rider confirmed",
          done: status === "rider_accepted" || AFTER_ACCEPT.includes(status),
        },
        { label: "Payment confirmed", done: paid },
        ...tail,
      ]
    : [
        { label: "Booking placed", done: true },
        { label: "Payment confirmed", done: paid },
        { label: "Rider accepted", done: AFTER_ACCEPT.includes(status) },
        ...tail,
      ];

  const firstPending = steps.findIndex((s) => !s.done);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const active = i === firstPending;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                ${step.done ? "bg-[#ff2d2d] border-[#ff2d2d]" : "bg-transparent border-[#2a2a2a]"}`}
              >
                {step.done ? (
                  <CheckCircleIcon size={14} color="white" />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full ${active ? "bg-[#ff2d2d]" : "bg-[#2a2a2a]"}`}
                  />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-8 mt-1 ${step.done ? "bg-[#ff2d2d]/40" : "bg-[#1e1e1e]"}`}
                />
              )}
            </div>
            <div className="pt-1 pb-8">
              <p
                className={`text-[13px] font-medium ${step.done ? "text-[#e0e0e0]" : "text-[#555]"}`}
              >
                {step.label}
              </p>
              {active && (
                <p className="text-[11px] text-[#ff2d2d] mt-0.5">Up next</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
