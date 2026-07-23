import { useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

interface RevenueChartProps {
  totalRevenueToday: number;
}

export const RevenueChart = ({ totalRevenueToday }: RevenueChartProps) => {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");

  // Chart coordinates & points for smooth rendering
  // Width: 500, Height: 200
  const pointsToday = [
    { x: 30, y: 170, label: "08:00", val: 0 },
    { x: 100, y: 140, label: "10:00", val: 120000 },
    { x: 170, y: 80, label: "12:00", val: 560000 },
    { x: 240, y: 110, label: "14:00", val: 320000 },
    { x: 310, y: 60, label: "16:00", val: 890000 },
    { x: 380, y: 95, label: "18:00", val: 420000 },
    { x: 450, y: 40, label: "20:00", val: 1250000 },
  ];

  const pointsWeek = [
    { x: 30, y: 160, label: "T2", val: 1200000 },
    { x: 100, y: 110, label: "T3", val: 2400000 },
    { x: 170, y: 130, label: "T4", val: 1800000 },
    { x: 240, y: 70, label: "T5", val: 3500000 },
    { x: 310, y: 90, label: "T6", val: 2900000 },
    { x: 380, y: 50, label: "T7", val: 4800000 },
    { x: 450, y: 30, label: "CN", val: 5500000 },
  ];

  const currentPoints = activeTab === "today" ? pointsToday : pointsWeek;

  // Render SVG Path D attributes
  const linePath = currentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPath = `${linePath} L ${currentPoints[currentPoints.length - 1].x} 180 L ${currentPoints[0].x} 180 Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-[300px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <span className="font-extrabold text-slate-800 text-sm">
          Biểu đồ doanh thu ngày:{" "}
          <span className="text-kv-blue-primary">
            {formatCurrency(totalRevenueToday || 3560000)}
          </span>
        </span>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border text-[10px]">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-3 py-0.5 font-bold rounded transition-all ${
              activeTab === "today"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-3 py-0.5 font-bold rounded transition-all ${
              activeTab === "week"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tuần này
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-end relative bg-slate-50/10 min-h-[220px]">
        {/* SVG Line Chart */}
        <svg className="w-full h-full" viewBox="0 0 480 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0068FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0068FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[40, 75, 110, 145, 180].map((yVal, idx) => (
            <line
              key={idx}
              x1="30"
              y1={yVal}
              x2="450"
              y2={yVal}
              stroke="#e2e8f0"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
          ))}

          {/* Gradient area under the line */}
          <path d={fillPath} fill="url(#chartGradient)" />

          {/* Smooth line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0068FF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points dots */}
          {currentPoints.map((p, idx) => (
            <g key={idx} className="group/dot cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#ffffff"
                stroke="#0068FF"
                strokeWidth="2.5"
                className="transition-all duration-150 hover:r-7"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                fill="#0068FF"
                fillOpacity="0"
                className="hover:fill-opacity-10 transition-all duration-150"
              />
              {/* Simple Tooltip on Hover */}
              <title>{p.label}: {p.val.toLocaleString("vi-VN")} đ</title>
            </g>
          ))}

          {/* Axis Labels */}
          {currentPoints.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y="196"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
