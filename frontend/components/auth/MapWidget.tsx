export default function MapWidget() {
  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[280px] border border-[#222] bg-[#1a2a1a]">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 500 280"
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width={500} height={280} fill="#1a2a1a" />
        <rect
          x={300}
          y={160}
          width={200}
          height={120}
          rx={4}
          fill="#1e3a1e"
          opacity={0.8}
        />
        <rect
          x={0}
          y={200}
          width={120}
          height={80}
          rx={4}
          fill="#1e3a1e"
          opacity={0.6}
        />
        <ellipse
          cx={220}
          cy={180}
          rx={60}
          ry={20}
          fill="#1a3a4a"
          opacity={0.7}
        />
        <rect x={0} y={100} width={500} height={8} fill="#2a2a2a" />
        <rect x={0} y={150} width={500} height={5} fill="#252525" />
        <rect x={0} y={60} width={500} height={4} fill="#222" />
        <rect x={0} y={200} width={500} height={6} fill="#252525" />
        <rect x={0} y={240} width={500} height={4} fill="#222" />
        <rect x={80} y={0} width={6} height={280} fill="#252525" />
        <rect x={160} y={0} width={5} height={280} fill="#222" />
        <rect x={250} y={0} width={8} height={280} fill="#2a2a2a" />
        <rect x={340} y={0} width={5} height={280} fill="#222" />
        <rect x={420} y={0} width={4} height={280} fill="#222" />
        <line
          x1={80}
          y1={100}
          x2={340}
          y2={200}
          stroke="#2a2a2a"
          strokeWidth={6}
        />
        <path
          d="M 120 104 Q 200 104 250 140 Q 300 175 380 168"
          stroke="#22c55e"
          strokeWidth={3}
          fill="none"
          strokeDasharray="6,3"
          opacity={0.9}
        />
        <rect x={370} y={88} width={28} height={16} rx={3} fill="#7c3aed" />
        <text
          x={384}
          y={100}
          fontSize={9}
          fill="#fff"
          textAnchor="middle"
          fontWeight="bold"
        >
          ATM
        </text>
        <circle cx={240} cy={175} r={8} fill="#ff2d2d" opacity={0.9} />
        <circle cx={310} cy={168} r={6} fill="#f59e0b" opacity={0.9} />
        <circle cx={160} cy={200} r={6} fill="#3b82f6" opacity={0.9} />
        <text
          x={400}
          y={50}
          fontSize={11}
          fill="#555"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          WES_IGHTON
        </text>
        <text
          x={380}
          y={250}
          fontSize={10}
          fill="#3a5a3a"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Clove Lakes
        </text>
      </svg>
      <div className="absolute top-3 left-3.5 bg-black/50 rounded-md px-2.5 py-1 text-[11px] text-[#aaa] backdrop-blur-sm border border-[#2a2a2a]">
        🗺 Live Delivery Map
      </div>
    </div>
  );
}
