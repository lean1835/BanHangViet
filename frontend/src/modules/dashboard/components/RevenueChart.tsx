import { useState } from "react";
import {
  DASHBOARD_SECTIONS,
  DEFAULT_REVENUE_CHART_TAB,
  REVENUE_CHART_CONFIG,
  REVENUE_CHART_TABS,
} from "@/constants/dashboard";
import { MOCK_CLOCK } from "@/constants/mockData/clock";
import { formatCurrency } from "@/utils/formatCurrency";

type TChartSubTab = (typeof REVENUE_CHART_TABS)[number]["id"];

interface RevenueChartProps {
  totalRevenueToday: number;
}

export const RevenueChart = ({ totalRevenueToday }: RevenueChartProps) => {
  const [chartSubTab, setChartSubTab] =
    useState<TChartSubTab>(DEFAULT_REVENUE_CHART_TAB);
  const chart = REVENUE_CHART_CONFIG;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <span className="font-extrabold text-slate-800 text-sm">
          {DASHBOARD_SECTIONS.NET_REVENUE}{" "}
          <span className="text-kv-blue-primary">{formatCurrency(totalRevenueToday)}</span>
        </span>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border">
          {REVENUE_CHART_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChartSubTab(tab.id)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                chartSubTab === tab.id
                  ? "bg-white text-kv-blue-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 h-[240px] flex items-center justify-center relative bg-slate-50/20">
        <svg
          className="w-full h-full"
          viewBox={chart.VIEW_BOX}
          preserveAspectRatio={chart.PRESERVE_ASPECT_RATIO}
        >
          {chart.GRID_LINES.map((line) => (
            <line
              key={`${line.x1}-${line.y1}-${line.y2}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={chart.GRID_STROKE_WIDTH}
            />
          ))}

          {chart.Y_AXIS_LABELS.map((label) => (
            <text
              key={label.label}
              x={label.x}
              y={label.y}
              fill={chart.LABEL_COLOR}
              fontSize={chart.FONT.Y_AXIS_SIZE}
              fontWeight={chart.FONT.WEIGHT}
            >
              {label.label}
            </text>
          ))}

          <text
            x={chart.X_AXIS.x}
            y={chart.X_AXIS.y}
            fill={chart.AXIS_LABEL_COLOR}
            fontSize={chart.FONT.X_AXIS_SIZE}
            fontWeight={chart.FONT.WEIGHT}
            textAnchor={chart.FONT.TEXT_ANCHOR}
          >
            {MOCK_CLOCK.CHART_DATE_LABEL}
          </text>

          {totalRevenueToday > chart.MIN_REVENUE ? (
            <g>
              <rect
                x={chart.BAR.x}
                y={chart.BAR.y}
                width={chart.BAR.width}
                height={chart.BAR.height}
                rx={chart.BAR.radius}
                fill={`url(#${chart.GRADIENT_ID})`}
                className="transition-all duration-300"
              />
              <text
                x={chart.BAR_LABEL.x}
                y={chart.BAR_LABEL.y}
                fill={chart.BAR_LABEL_COLOR}
                fontSize={chart.FONT.BAR_LABEL_SIZE}
                fontWeight={chart.FONT.WEIGHT}
                textAnchor={chart.FONT.TEXT_ANCHOR}
              >
                {formatCurrency(totalRevenueToday)}
              </text>
            </g>
          ) : (
            <text
              x={chart.EMPTY_LABEL.x}
              y={chart.EMPTY_LABEL.y}
              fill={chart.LABEL_COLOR}
              fontSize={chart.FONT.EMPTY_LABEL_SIZE}
              fontWeight={chart.FONT.EMPTY_WEIGHT}
              textAnchor={chart.FONT.TEXT_ANCHOR}
            >
              {chart.EMPTY_MESSAGE}
            </text>
          )}

          <defs>
            <linearGradient
              id={chart.GRADIENT_ID}
              x1={chart.GRADIENT.X1}
              y1={chart.GRADIENT.Y1}
              x2={chart.GRADIENT.X2}
              y2={chart.GRADIENT.Y2}
            >
              <stop
                offset={chart.GRADIENT.START_OFFSET}
                stopColor={chart.GRADIENT_START}
                stopOpacity={chart.GRADIENT.START_OPACITY}
              />
              <stop
                offset={chart.GRADIENT.END_OFFSET}
                stopColor={chart.GRADIENT_END}
                stopOpacity={chart.GRADIENT.END_OPACITY}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
