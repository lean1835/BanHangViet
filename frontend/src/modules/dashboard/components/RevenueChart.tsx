import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IDailyRevenueProjection } from "@/modules/report/types/IReport";
import { useProgressAnimation } from "@/hooks/useProgressAnimation";

interface RevenueChartProps {
  totalRevenueToday: number;
  dailyRevenues?: IDailyRevenueProjection[];
}

export const RevenueChart = ({ totalRevenueToday, dailyRevenues }: RevenueChartProps) => {
  const [activeTab, setActiveTab] = useState<"today" | "week">("week");
  const progress = useProgressAnimation([dailyRevenues, activeTab, totalRevenueToday], 1500, 100);

  const currentPoints = useMemo(() => {
    const rawList = activeTab === "today"
      ? (dailyRevenues || []).slice(0, 7)
      : (dailyRevenues || []);

    const listToUse = [...rawList].reverse();

    if (listToUse.length === 0) {
      return [
        { x: 30, y: 170, label: "-", val: 0 },
        { x: 450, y: 170, label: "-", val: 0 },
      ];
    }

    const maxVal = Math.max(...listToUse.map((r) => r.netRevenue), 1);
    const count = listToUse.length;

    return listToUse.map((item, idx) => {
      const x = 30 + (idx * 420) / Math.max(count - 1, 1);
      const y = 170 - (item.netRevenue * 130) / maxVal;

      const dateParts = item.salesDate.split("-");
      const label = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : item.salesDate;

      return {
        x,
        y,
        label,
        val: item.netRevenue,
      };
    });
  }, [dailyRevenues, activeTab]);

  // Current total revenue for the active tab
  const currentRevenueSum = useMemo(() => {
    if (activeTab === "today") {
      const slice7 = (dailyRevenues || []).slice(0, 7);
      return slice7.reduce((sum, r) => sum + (r.netRevenue || 0), 0);
    }
    return totalRevenueToday;
  }, [activeTab, dailyRevenues, totalRevenueToday]);

  // Animated revenue synced in perfect lockstep with chart line draw progress
  const animatedRevenue = Math.round(currentRevenueSum * progress);

  // Current sweep edge X from left (30) to right (450)
  // For clipPath: reveals from 0 to 480
  const clipWidth = progress <= 0 ? 0 : progress >= 1 ? 480 : 30 + 420 * progress;

  const firstPoint = currentPoints[0];
  const lastPoint = currentPoints[currentPoints.length - 1];

  // Tracer dot position: precisely tracked along line segment
  const tracerPos = useMemo(() => {
    if (progress <= 0 || progress >= 1 || currentPoints.length < 2 || !firstPoint || !lastPoint) return null;

    const clampedX = Math.min(Math.max(clipWidth, firstPoint.x), lastPoint.x);

    for (let i = 0; i < currentPoints.length - 1; i++) {
      const pA = currentPoints[i];
      const pB = currentPoints[i + 1];
      if (clampedX >= pA.x && clampedX <= pB.x) {
        const span = Math.max(pB.x - pA.x, 1);
        const ratio = (clampedX - pA.x) / span;
        return { x: clampedX, y: pA.y + (pB.y - pA.y) * ratio };
      }
    }
    return { x: clampedX, y: lastPoint.y };
  }, [progress, clipWidth, currentPoints, firstPoint, lastPoint]);

  // Render SVG Path D attributes
  const linePath = currentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPath = `${linePath} L ${lastPoint?.x ?? 450} 180 L ${firstPoint?.x ?? 30} 180 Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-[300px]">
      {/* Header with constant 2-line layout to prevent abrupt wrap shift */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-slate-800 text-sm">
            Biểu đồ doanh thu kỳ:{" "}
            <span className="text-kv-blue-primary tabular-nums">
              {formatCurrency(animatedRevenue)}
            </span>
          </span>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border text-[10px] w-fit">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-3 py-0.5 font-bold rounded transition-colors ${
              activeTab === "today"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-3 py-0.5 font-bold rounded transition-colors ${
              activeTab === "week"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Kỳ báo cáo
          </button>
        </div>
      </div>

      {/* SVG Chart Container with stable fixed height */}
      <div className="p-5 flex-1 flex flex-col justify-end relative bg-slate-50/10 min-h-[220px] overflow-hidden">
        {/* SVG Line Chart */}
        <svg className="w-full h-[200px]" viewBox="0 0 480 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0068FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0068FF" stopOpacity="0.0" />
            </linearGradient>

            {/* Sweep ClipPath: reveals from 0 (trắng tinh) to 480 (toàn bộ) from LEFT to RIGHT */}
            <clipPath id="chartSweepClip">
              <rect x="0" y="0" width={clipWidth} height="200" />
            </clipPath>
          </defs>

          {/* Grid lines (static background) */}
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

          {/* Clipped Line and Area: sweeps smoothly from LEFT to RIGHT */}
          <g clipPath="url(#chartSweepClip)">
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
          </g>

          {/* Glowing Tracer Dot gliding along the line without CSS ping transform jitter */}
          {tracerPos && (
            <g>
              <circle
                cx={tracerPos.x}
                cy={tracerPos.y}
                r="7"
                fill="#0068FF"
                fillOpacity="0.25"
              />
              <circle
                cx={tracerPos.x}
                cy={tracerPos.y}
                r="4.5"
                fill="#0068FF"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Points dots: Rendered with smooth opacity transition without DOM unmounting */}
          {currentPoints.map((p, idx) => {
            const isRevealed = progress === 1 || clipWidth >= p.x;

            return (
              <g
                key={idx}
                className="group/dot cursor-pointer"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transition: "opacity 180ms ease-out",
                  pointerEvents: isRevealed ? "auto" : "none",
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5.5"
                  fill="#ffffff"
                  stroke="#0068FF"
                  strokeWidth="2.5"
                  className="transition-transform duration-150 group-hover/dot:scale-125"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="#0068FF"
                  fillOpacity="0"
                  className="group-hover/dot:fill-opacity-10 transition-opacity duration-150"
                />
                {/* Tooltip on Hover */}
                <title>{p.label}: {p.val.toLocaleString("vi-VN")} đ</title>
              </g>
            );
          })}

          {/* Axis Labels */}
          {currentPoints.map((p, idx) => {
            const isLabelRevealed = progress === 1 || clipWidth >= p.x;
            return (
              <text
                key={idx}
                x={p.x}
                y="196"
                fill={isLabelRevealed ? "#64748b" : "#cbd5e1"}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                className="transition-colors duration-200 select-none"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
