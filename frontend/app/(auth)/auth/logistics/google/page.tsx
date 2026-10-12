import { Suspense } from "react";
import GoogleCallbackInner from "./GoogleCallbackInner";

export default function GoogleLogisticsCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-0.5">
              {(
                [
                  [1, 0.5],
                  [0.5, 1],
                ] as number[][]
              ).map((col, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  {col.map((op, ri) => (
                    <div
                      key={ri}
                      style={{ opacity: op }}
                      className="w-3 h-3 rounded-full bg-[#ff2d2d] animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[#555] text-xs font-[var(--font-dm)] tracking-widest uppercase">
              Signing you in...
            </p>
          </div>
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
