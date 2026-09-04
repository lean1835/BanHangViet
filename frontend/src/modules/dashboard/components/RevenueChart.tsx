import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IDailyRevenueProjection } from "@/modules/report/types/IReport";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useProgressAnimation } from "@/hooks/useProgressAnimation";

interface RevenueChartProps {
  totalRevenueToday: number;
  dailyRevenues?: IDailyRevenueProjection[];
}

export const RevenueChart = ({ totalRevenueToday, dailyRevenues }: RevenueChartProps) => {
  const [activeTab, setActiveTab] = useState<"today" | "week">("week");
  const animatedRevenue = useAnimatedNumber(totalRevenueToday, 1800, 150);
  const progress = useProgressAnimation([dailyRevenues, activeTab], 1800, 150);

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

  // Current sweep edge X from left (30) to right (450)
  const clipWidth = progress <= 0 ? 0 : progress >= 1 ? 480 : 30 + 420 * progress;

  // Calculate tracer dot Y coordinate on the curve as it sweeps
  const tracerY = useMemo(() => {
    if (progress <= 0 || progress >= 1 || currentPoints.length < 2) return null;
    for (let i = 0; i < currentPoints.length - 1; i++) {
      const pA = currentPoints[i];
      const pB = currentPoints[i + 1];
      if (clipWidth >= pA.x && clipWidth <= pB.x) {
        const ratio = (clipWidth - pA.x) / Math.max(pB.x - pA.x, 1);
        return pA.y + (pB.y - pA.y) * ratio;
      }
    }
    return currentPoints[currentPoints.length - 1]?.y ?? 170;
  }, [progress, clipWidth, currentPoints]);

  // Render SVG Path D attributes
  const linePath = currentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPath = `${linePath} L ${currentPoints[currentPoints.length - 1].x} 180 L ${currentPoints[0].x} 180 Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between flex-1 min-h-[300px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <span className="font-extrabold text-slate-800 text-sm">
          Biểu đồ doanh thu kỳ:{" "}
          <span className="text-kv-blue-primary tabular-nums transition-all">
            {formatCurrency(animatedRevenue)}
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
            7 ngày qua
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-3 py-0.5 font-bold rounded transition-all ${
              activeTab === "week"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Kỳ báo cáo
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

          {/* Glowing Tracer Dot at the cutting edge as it draws from left to right */}
          {tracerY !== null && (
            <g>
              <circle
                cx={clipWidth}
                cy={tracerY}
                r="8"
                fill="#0068FF"
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={clipWidth}
                cy={tracerY}
                r="5"
                fill="#0068FF"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Points dots: Ban đầu KHÔNG CÓ CHẤM NÀO, chỉ xuất hiện khi nét vẽ chạy tới từ trái qua phải */}
          {currentPoints.map((p, idx) => {
            const isRevealed = progress === 1 || clipWidth >= p.x;
            if (!isRevealed) return null; // K có chấm nào trước khi đường chạy tới!

            return (
              <g
                key={idx}
                className="group/dot cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5.5"
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
                className="transition-colors duration-200"
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
