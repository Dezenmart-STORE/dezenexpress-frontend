"use client";
import { useState } from "react";

const line1 = [22, 28, 25, 35, 30, 38, 33];
const line2 = [18, 20, 32, 26, 24, 20, 15];
const W = 300,
  H = 140,
  MAX = 40,
  N = line1.length;

const toPath = (d: number[]) =>
  d
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${(i / (N - 1)) * W} ${H - (v / MAX) * H}`,
    )
    .join(" ");

const toArea = (d: number[]) =>
  `M 0,${H} L ${d.map((v, i) => `${(i / (N - 1)) * W},${H - (v / MAX) * H}`).join(" L ")} L ${W},${H} Z`;

export default function LineChartWidget() {
  const [filter] = useState("Last 7 Days");
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="font-[var(--font-syne)] font-semibold text-sm text-[#e0e0e0]">
          Header
        </span>
        <button className="bg-transparent border-none text-[#888] text-xs cursor-pointer flex items-center gap-1 hover:text-[#ccc] transition-colors">
          {filter} <span>∨</span>
        </button>
      </div>
      <svg
        width="100%"
        viewBox={`-24 -8 ${W + 30} ${H + 30}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {[0, 10, 20, 30, 40].map((v) => {
          const y = H - (v / MAX) * H;
          return (
            <g key={v}>
              <text x={-4} y={y + 3} fontSize={9} fill="#444" textAnchor="end">
                {v}k
              </text>
              <line
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke="#1e1e1e"
                strokeWidth={1}
              />
            </g>
          );
        })}
        <path d={toArea(line1)} fill="rgba(34,197,94,0.08)" />
        <path d={toArea(line2)} fill="rgba(59,130,246,0.06)" />
        <path
          d={toPath(line1)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={toPath(line2)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {line1.map((v, i) => (
          <circle
            key={i}
            cx={(i / (N - 1)) * W}
            cy={H - (v / MAX) * H}
            r={3}
            fill="#22c55e"
          />
        ))}
      </svg>
    </div>
  );
}
