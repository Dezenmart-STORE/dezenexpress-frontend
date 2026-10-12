"use client";

import { AvailableRider } from "@/lib/express/api";
import { VEHICLE_TYPES } from "@/lib/express/types";
import { StarIcon, PackageIcon } from "@/components/Icons";

interface Props {
  rider: AvailableRider;
  selected?: boolean;
  onSelect?: () => void;
  showActions?: boolean;
}

export default function RiderCard({
  rider,
  selected,
  onSelect,
  showActions = true,
}: Props) {
  const vehicle = VEHICLE_TYPES.find((v) => v.value === rider.vehicleType);
  const initials = rider.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onSelect}
      className={`bg-[#1a1a1a] border rounded-2xl p-4 transition-all cursor-pointer
        ${selected ? "border-[#ff2d2d] bg-[#ff2d2d]/5" : "border-[#222] hover:border-[#333]"}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar — no photo field on the real rider record, so always initials */}
        <div className="w-12 h-12 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-semibold text-[#e0e0e0] truncate">
              {rider.name}
            </p>
            {vehicle?.icon && (
              <span className="text-[13px]">{vehicle.icon}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#555]">
            {rider.rating != null && (
              <span className="flex items-center gap-1">
                <StarIcon size={11} color="#f59e0b" />
                <span className="text-[#aaa]">{rider.rating}</span>
              </span>
            )}
            {rider.totalTrips != null && (
              <span className="flex items-center gap-1">
                <PackageIcon size={11} color="#555" />
                {rider.totalTrips} trips
              </span>
            )}
            {rider.vehiclePlateNumber && (
              <span className="text-[#444]">{rider.vehiclePlateNumber}</span>
            )}
            {rider.availabilityStatus && (
              <span
                className={
                  rider.availabilityStatus === "online"
                    ? "text-green-400"
                    : "text-[#555]"
                }
              >
                {rider.availabilityStatus}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#555] capitalize mt-0.5">
            {rider.vehicleType}
          </p>
        </div>

        {/* No price/ETA/distance in the available-riders response — nothing to show here */}
      </div>

      {selected && showActions && (
        <button className="mt-3 w-full py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity">
          Select This Rider
        </button>
      )}
    </div>
  );
}
