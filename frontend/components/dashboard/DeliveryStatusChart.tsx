const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
const data = [
  { pending: 12, pickedUp: 8, inTransit: 6, delivered: 10 },
  { pending: 10, pickedUp: 9, inTransit: 5, delivered: 8 },
  { pending: 18, pickedUp: 12, inTransit: 8, delivered: 5 },
  { pending: 14, pickedUp: 10, inTransit: 7, delivered: 6 },
  { pending: 8, pickedUp: 6, inTransit: 5, delivered: 14 },
  { pending: 10, pickedUp: 8, inTransit: 6, delivered: 10 },
];
const COLORS = {
  pending: "#3b82f6",
  pickedUp: "#f59e0b",
  inTransit: "#22c55e",
  delivered: "#84cc16",
};
const MAX = 40,
  H = 160,
  BW = 12,
  GAP = 3,
  GW = (BW + GAP) * 4;

const legends = [
  { key: "pending", color: "#3b82f6", label: "Pending" },
  { key: "pickedUp", color: "#f59e0b", label: "Picked Up" },
  { key: "inTransit", color: "#22c55e", label: "In Transit" },
  { key: "delivered", color: "#84cc16", label: "Delivered" },
];

export default function DeliveryStatusChart() {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="font-[var(--font-syne)] font-semibold text-sm text-[#e0e0e0]">
          Deliveries Status Chart
        </span>
        <span className="text-[#555] cursor-pointer text-lg tracking-widest">
          ···
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${months.length * (GW + 14) + 30} ${H + 40}`}
        className="overflow-visible"
      >
        {[0, 10, 20, 30, 40].map((v) => {
          const y = H - (v / MAX) * H;
          return (
            <g key={v}>
              <text x={0} y={y + 4} fontSize={9} fill="#444" textAnchor="end">
                {v}k
              </text>
              <line
                x1={14}
                y1={y}
                x2={months.length * (GW + 14) + 30}
                y2={y}
                stroke="#222"
                strokeWidth={1}
              />
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = 20 + i * (GW + 14);
          const bars = [
            { val: d.pending, color: COLORS.pending },
            { val: d.pickedUp, color: COLORS.pickedUp },
            { val: d.inTransit, color: COLORS.inTransit },
            { val: d.delivered, color: COLORS.delivered },
          ];
          return (
            <g key={i}>
              {bars.map((b, j) => {
                const bh = (b.val / MAX) * H;
                return (
                  <rect
                    key={j}
                    x={x + j * (BW + GAP)}
                    y={H - bh}
                    width={BW}
                    height={bh}
                    rx={3}
                    fill={b.color}
                    opacity={0.85}
                  />
                );
              })}
              <text
                x={x + GW / 2 - 4}
                y={H + 16}
                fontSize={9}
                fill="#555"
                textAnchor="middle"
              >
                {months[i]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex gap-3.5 mt-3 flex-wrap">
        {legends.map((l) => (
          <div
            key={l.key}
            className="flex items-center gap-1.5 text-[11px] text-[#888]"
          >
            <div
              style={{ background: l.color }}
              className="w-1.5 h-1.5 rounded-full"
            />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
