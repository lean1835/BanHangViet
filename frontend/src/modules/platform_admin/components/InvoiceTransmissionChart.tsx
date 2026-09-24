import React, { useState, useMemo } from "react";
import {
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Server,
  Radio,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { formatNumber } from "@/utils/formatCurrency";

type TimeRange = "24h" | "7d" | "30d";
type MetricType = "volume" | "latency";

interface TransmissionPoint {
  timeLabel: string;
  volume: number;       // số hóa đơn
  latencyMs: number;    // độ trễ truyền nhận CQT (ms)
  successRate: number;  // % thành công
}

// Dữ liệu mẫu thực tế theo chu kỳ kinh doanh bán lẻ
const DATA_24H: TransmissionPoint[] = [
  { timeLabel: "00:00", volume: 45, latencyMs: 110, successRate: 100 },
  { timeLabel: "02:00", volume: 18, latencyMs: 95, successRate: 100 },
  { timeLabel: "04:00", volume: 12, latencyMs: 90, successRate: 100 },
  { timeLabel: "06:00", volume: 120, latencyMs: 125, successRate: 100 },
  { timeLabel: "08:00", volume: 680, latencyMs: 145, successRate: 99.9 },
  { timeLabel: "10:00", volume: 1240, latencyMs: 168, successRate: 99.95 },
  { timeLabel: "11:30", volume: 1850, latencyMs: 195, successRate: 99.85 },
  { timeLabel: "13:00", volume: 920, latencyMs: 140, successRate: 100 },
  { timeLabel: "15:00", volume: 1430, latencyMs: 160, successRate: 99.9 },
  { timeLabel: "17:00", volume: 1680, latencyMs: 180, successRate: 99.9 },
  { timeLabel: "19:00", volume: 2150, latencyMs: 210, successRate: 99.8 },
  { timeLabel: "21:00", volume: 1350, latencyMs: 155, successRate: 100 },
  { timeLabel: "23:00", volume: 380, latencyMs: 120, successRate: 100 },
];

const DATA_7D: TransmissionPoint[] = [
  { timeLabel: "Thứ 2", volume: 9840, latencyMs: 152, successRate: 99.92 },
  { timeLabel: "Thứ 3", volume: 10450, latencyMs: 148, successRate: 99.95 },
  { timeLabel: "Thứ 4", volume: 11200, latencyMs: 155, successRate: 99.9 },
  { timeLabel: "Thứ 5", volume: 10800, latencyMs: 149, successRate: 99.94 },
  { timeLabel: "Thứ 6", volume: 13450, latencyMs: 175, successRate: 99.88 },
  { timeLabel: "Thứ 7", volume: 16800, latencyMs: 190, successRate: 99.82 },
  { timeLabel: "Chủ nhật", volume: 15200, latencyMs: 182, successRate: 99.86 },
];

const DATA_30D: TransmissionPoint[] = [
  { timeLabel: "Tuần 1", volume: 68500, latencyMs: 150, successRate: 99.93 },
  { timeLabel: "Tuần 2", volume: 74200, latencyMs: 158, successRate: 99.91 },
  { timeLabel: "Tuần 3", volume: 81400, latencyMs: 162, successRate: 99.89 },
  { timeLabel: "Tuần 4", volume: 92600, latencyMs: 170, successRate: 99.85 },
];

export const InvoiceTransmissionChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [metric, setMetric] = useState<MetricType>("volume");
  const [hoveredPoint, setHoveredPoint] = useState<TransmissionPoint | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);

  const dataset = useMemo(() => {
    switch (timeRange) {
      case "7d":
        return DATA_7D;
      case "30d":
        return DATA_30D;
      default:
        return DATA_24H;
    }
  }, [timeRange]);

  // Max value calculation
  const { maxVal, totalVolume, avgLatency, peakPoint } = useMemo(() => {
    const vals = dataset.map((d) => (metric === "volume" ? d.volume : d.latencyMs));
    const max = Math.max(...vals, 1);
    const totVol = dataset.reduce((s, d) => s + d.volume, 0);
    const avgLat = Math.round(dataset.reduce((s, d) => s + d.latencyMs, 0) / dataset.length);
    const peak = [...dataset].sort((a, b) => b.volume - a.volume)[0];
    return { maxVal: max, totalVolume: totVol, avgLatency: avgLat, peakPoint: peak };
  }, [dataset, metric]);

  // SVG Coordinates setup
  const SVG_WIDTH = 760;
  const SVG_HEIGHT = 220;
  const PADDING_LEFT = 48;
  const PADDING_RIGHT = 30;
  const PADDING_TOP = 25;
  const PADDING_BOTTOM = 35;

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    const count = dataset.length;
    return dataset.map((item, idx) => {
      const val = metric === "volume" ? item.volume : item.latencyMs;
      const x = PADDING_LEFT + (idx * chartWidth) / Math.max(count - 1, 1);
      const y = PADDING_TOP + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, item };
    });
  }, [dataset, metric, maxVal, chartWidth, chartHeight]);

  // Smooth SVG Path using Bezier curve
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      d += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const baselineY = PADDING_TOP + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${pathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [pathD, points, chartHeight]);

  const isVolume = metric === "volume";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-6 p-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-kv-blue-primary">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Biểu đồ phụ tải truyền nhận hóa đơn điện tử (Cloud Gateway)
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gateway Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Giám sát thông lượng truyền nhận, chữ ký số HSM và tỷ lệ phản hồi cấp mã từ Tổng cục Thuế.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setMetric("volume")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                isVolume
                  ? "bg-white text-kv-blue-primary shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <Zap size={13} />
              <span>Lưu lượng HĐ</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric("latency")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                !isVolume
                  ? "bg-white text-purple-700 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <Clock size={13} />
              <span>Độ trễ CQT (ms)</span>
            </button>
          </div>

          {/* Time Range Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setTimeRange("24h")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === "24h"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              24h qua
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === "7d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === "30d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              30 ngày
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div className="relative bg-slate-50/40 rounded-2xl border border-slate-100 p-4 pt-2">
        {/* Floating Tooltip */}
        {hoveredPoint && hoveredCoords && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 min-w-[170px] backdrop-blur-xs border border-slate-700"
            style={{
              left: `${(hoveredCoords.x / SVG_WIDTH) * 100}%`,
              top: `${(hoveredCoords.y / SVG_HEIGHT) * 100 - 8}%`,
            }}
          >
            <div className="font-bold text-slate-300 text-[10px] pb-1 border-b border-slate-700 flex items-center justify-between">
              <span>Mốc: {hoveredPoint.timeLabel}</span>
              <span className="text-emerald-400 font-extrabold">{hoveredPoint.successRate}% OK</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-slate-400 text-[11px]">Hóa đơn phát hành:</span>
              <span className="font-black text-sky-400">{formatNumber(hoveredPoint.volume)} HĐ</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 text-[11px]">Độ trễ phản hồi:</span>
              <span className="font-bold text-purple-300">{hoveredPoint.latencyMs} ms</span>
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          className="w-full h-[220px] overflow-visible"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoveredCoords(null);
          }}
        >
          <defs>
            {/* Gradient for Volume */}
            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0068FF" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#06B6D4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#0068FF" stopOpacity="0" />
            </linearGradient>

            {/* Gradient for Latency */}
            <linearGradient id="latGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#EC4899" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = PADDING_TOP + chartHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {isVolume ? (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val) : `${val}ms`}
                </text>
              </g>
            );
          })}

          {/* Area fill under the line */}
          <path
            d={areaD}
            fill={isVolume ? "url(#volGradient)" : "url(#latGradient)"}
            className="transition-all duration-300"
          />

          {/* Main curve line */}
          <path
            d={pathD}
            fill="none"
            stroke={isVolume ? "#0068FF" : "#8B5CF6"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Points & Hover targets */}
          {points.map(({ x, y, item }, idx) => {
            const isHovered = hoveredPoint === item;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint(item);
                  setHoveredCoords({ x, y });
                }}
              >
                {/* Active point indicator */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={isVolume ? "#0068FF" : "#8B5CF6"}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                {/* Invisible large target for easy hover */}
                <circle cx={x} cy={y} r="18" fill="transparent" />
              </g>
            );
          })}

          {/* X Axis time labels */}
          {points.map(({ x, item }, idx) => (
            <text
              key={idx}
              x={x}
              y={PADDING_TOP + chartHeight + 20}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={hoveredPoint === item ? "#0f172a" : "#64748b"}
              className="transition-colors duration-150 select-none"
            >
              {item.timeLabel}
            </text>
          ))}
        </svg>
      </div>

      {/* Realtime Transmission Diagnostics (4 metric cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
        {/* Total Invoices Transmitted */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng HĐ truyền nhận kỳ này
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatNumber(totalVolume)} <span className="text-xs font-semibold text-slate-400">HĐ</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} /> Tỷ lệ ký thành công 99.9%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-100 text-kv-blue-primary shrink-0">
            <FileCheck size={18} />
          </div>
        </div>

        {/* Peak Hourly Load */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Đỉnh tải phát sinh (Peak)
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatNumber(peakPoint?.volume || 0)} <span className="text-xs font-semibold text-slate-400">HĐ</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Mốc cao nhất: <strong>{peakPoint?.timeLabel}</strong>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Độ trễ trung bình CQT
            </span>
            <div className="text-xl font-black text-purple-700 mt-1">
              {avgLatency} <span className="text-xs font-semibold text-purple-500">ms</span>
            </div>
            <span className="text-[10px] text-purple-600 font-medium mt-1 block">
              Tốc độ ký HSM Cloud CA tức thời
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <Zap size={18} />
          </div>
        </div>

        {/* Transmission Channel Status */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cổng truyền nhận T-VAN
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <Server size={16} className="text-emerald-600" />
              <span>Trực tiếp Tổng cục Thuế</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Kênh dự phòng: VNPT / Viettel CA
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <Radio size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvoiceTransmissionChart;
