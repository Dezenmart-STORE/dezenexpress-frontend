import { Suspense } from "react";
import TrackService from "@/components/express/customer/TrackService";

export default function Page() {
  return (
    <Suspense fallback={<TrackFallback />}>
      <TrackService />
    </Suspense>
  );
}

function TrackFallback() {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Track Your Order
        </h1>
        <p className="text-[12px] text-[#555]">Loading...</p>
      </div>
    </div>
  );
}
