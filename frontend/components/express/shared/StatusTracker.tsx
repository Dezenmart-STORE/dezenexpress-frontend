"use client";

import { RequestStatus, ServiceType } from "@/lib/express/types";
import { CheckCircleIcon } from "@/components/Icons";

const RIDE_STEPS: { status: RequestStatus; label: string }[] = [
  { status: "accepted", label: "Rider accepted" },
  { status: "payment_confirmed", label: "Payment confirmed" },
  { status: "arrived", label: "Rider arrived" },
  { status: "trip_started", label: "Trip started" },
  { status: "trip_completed", label: "Trip completed" },
];

const DELIVERY_STEPS: { status: RequestStatus; label: string }[] = [
  { status: "accepted", label: "Rider accepted" },
  { status: "payment_confirmed", label: "Payment confirmed" },
  { status: "arrived", label: "Arrived at pickup" },
  { status: "picked_up", label: "Package picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
];

const STATUS_ORDER: RequestStatus[] = [
  "requested",
  "riders_displayed",
  "selected",
  "accepted",
  "payment_confirmed",
  "arrived",
  "picked_up",
  "in_transit",
  "trip_started",
  "trip_completed",
  "delivered",
  "completed",
];

function getStepIndex(status: RequestStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export default function StatusTracker({
  status,
  type,
}: {
  status: RequestStatus;
  type: ServiceType;
}) {
  const steps = type === "ride" ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIdx = getStepIndex(status);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const stepIdx = getStepIndex(step.status);
        const done = stepIdx <= currentIdx;
        const active = stepIdx === currentIdx;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                ${done ? "bg-[#ff2d2d] border-[#ff2d2d]" : "bg-transparent border-[#2a2a2a]"}`}
              >
                {done ? (
                  <CheckCircleIcon size={14} color="white" />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full ${active ? "bg-[#ff2d2d]" : "bg-[#2a2a2a]"}`}
                  />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-8 mt-1 ${done ? "bg-[#ff2d2d]/40" : "bg-[#1e1e1e]"}`}
                />
              )}
            </div>
            {/* Label */}
            <div className="pt-1 pb-8">
              <p
                className={`text-[13px] font-medium ${done ? "text-[#e0e0e0]" : "text-[#555]"}`}
              >
                {step.label}
              </p>
              {active && (
                <p className="text-[11px] text-[#ff2d2d] mt-0.5">
                  Current status
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
