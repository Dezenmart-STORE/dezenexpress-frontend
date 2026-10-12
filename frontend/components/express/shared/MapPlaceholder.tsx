"use client";

import { MapPinIcon } from "@/components/Icons";

interface Props {
  pickup?: string;
  destination?: string;
  height?: string;
}

export default function MapPlaceholder({
  pickup,
  destination,
  height = "h-48",
}: Props) {
  return (
    <div
      className={`${height} bg-[#111] border border-[#222] rounded-2xl relative overflow-hidden flex items-center justify-center`}
    >
      {/* Grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="#333"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Fake route line */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 80 80% C 30% 60%, 70% 40%, 80% 20%"
          stroke="#ff2d2d"
          strokeWidth="2"
          strokeDasharray="6,4"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Pickup pin */}
      <div className="absolute left-[15%] bottom-[20%] flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <MapPinIcon size={14} color="white" />
        </div>
        {pickup && (
          <div className="mt-1 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[10px] text-[#aaa] whitespace-nowrap max-w-[120px] truncate">
            {pickup}
          </div>
        )}
      </div>

      {/* Destination pin */}
      <div className="absolute right-[15%] top-[15%] flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[#ff2d2d] flex items-center justify-center shadow-lg">
          <MapPinIcon size={14} color="white" />
        </div>
        {destination && (
          <div className="mt-1 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[10px] text-[#aaa] whitespace-nowrap max-w-[120px] truncate">
            {destination}
          </div>
        )}
      </div>

      {/* Center label */}
      <div className="relative z-10 px-4 py-2 bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-xl">
        <p className="text-[11px] text-[#555] text-center">
          Map integration coming soon
        </p>
        <p className="text-[10px] text-[#444] text-center">
          Google Maps / Mapbox
        </p>
      </div>
    </div>
  );
}
