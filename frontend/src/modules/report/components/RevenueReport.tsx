import React from "react";
import {
  getTodayRevenueBarHeight,
  REPORT_UI,
  REVENUE_CHART_CONFIG,
} from "@/constants/report";
import { MOCK_BEST_SELLING_PRODUCTS } from "@/constants/mockData/report";
import { formatCurrency } from "@/utils/formatCurrency";

interface RevenueReportProps {
  totalRevenueToday: number;
}

export const RevenueReport: React.FC<RevenueReportProps> = ({ totalRevenueToday }) => {
  const todayBarHeight = getTodayRevenueBarHeight(totalRevenueToday);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
            {REPORT_UI.REVENUE.TITLE}
          </h3>
          <div className="h-[250px] relative bg-slate-50/10 p-4 border border-dashed rounded-lg flex items-center justify-center">
            {/* Interactive reports SVG */}
            <svg className="w-full h-full" viewBox={REVENUE_CHART_CONFIG.VIEW_BOX}>
              {/* Lines */}
              {REVENUE_CHART_CONFIG.GRID_LINES.map((line) => (
                <line
                  key={line.y}
                  x1={REVENUE_CHART_CONFIG.GRID_X.START}
                  y1={line.y}
                  x2={REVENUE_CHART_CONFIG.GRID_X.END}
                  y2={line.y}
                  stroke={line.color}
                />
              ))}

              {/* Labels Y */}
              {REVENUE_CHART_CONFIG.Y_AXIS_LABELS.map((axisLabel) => (
                <text
                  key={axisLabel.y}
                  x={REVENUE_CHART_CONFIG.Y_AXIS_LABEL_X}
                  y={axisLabel.y}
                  fill={REVENUE_CHART_CONFIG.COLORS.AXIS_LABEL}
                  fontSize={REVENUE_CHART_CONFIG.FONT.SIZE}
                  fontWeight={REVENUE_CHART_CONFIG.FONT.WEIGHT}
                >
                  {axisLabel.label}
                </text>
              ))}

              {REVENUE_CHART_CONFIG.SHIFT_BARS.map((bar) => (
                <React.Fragment key={bar.id}>
                  <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    rx={bar.radius}
                    fill={REVENUE_CHART_CONFIG.COLORS.SHIFT}
                  />
                  <text
                    x={bar.labelX}
                    y={bar.valueY}
                    fill={REVENUE_CHART_CONFIG.COLORS.SHIFT_LABEL}
                    fontSize={REVENUE_CHART_CONFIG.FONT.SIZE}
                    fontWeight={REVENUE_CHART_CONFIG.FONT.WEIGHT}
                    textAnchor={REVENUE_CHART_CONFIG.FONT.TEXT_ANCHOR}
                  >
                    {bar.valueLabel}
                  </text>
                  <text
                    x={bar.labelX}
                    y={bar.axisY}
                    fill={REVENUE_CHART_CONFIG.COLORS.SHIFT_LABEL}
                    fontSize={REVENUE_CHART_CONFIG.FONT.SIZE}
                    fontWeight={REVENUE_CHART_CONFIG.FONT.WEIGHT}
                    textAnchor={REVENUE_CHART_CONFIG.FONT.TEXT_ANCHOR}
                  >
                    {bar.axisLabel}
                  </text>
                </React.Fragment>
              ))}

              {/* Today's shift (if active) */}
              <rect
                x={REVENUE_CHART_CONFIG.TODAY_BAR.x}
                y={REVENUE_CHART_CONFIG.TODAY_BAR.baselineY - todayBarHeight}
                width={REVENUE_CHART_CONFIG.TODAY_BAR.width}
                height={todayBarHeight}
                rx={REVENUE_CHART_CONFIG.TODAY_BAR.radius}
                fill={REVENUE_CHART_CONFIG.COLORS.TODAY}
              />
              <text
                x={REVENUE_CHART_CONFIG.TODAY_BAR.labelX}
                y={REVENUE_CHART_CONFIG.TODAY_BAR.valueBaselineY - todayBarHeight}
                fill={REVENUE_CHART_CONFIG.COLORS.TODAY}
                fontSize={REVENUE_CHART_CONFIG.FONT.SIZE}
                fontWeight={REVENUE_CHART_CONFIG.FONT.WEIGHT}
                textAnchor={REVENUE_CHART_CONFIG.FONT.TEXT_ANCHOR}
              >
                {totalRevenueToday > REVENUE_CHART_CONFIG.MIN_REVENUE
                  ? (
                      totalRevenueToday /
                      REVENUE_CHART_CONFIG.THOUSAND_DIVISOR
                    ).toFixed(REVENUE_CHART_CONFIG.DECIMAL_PLACES) +
                    REVENUE_CHART_CONFIG.VALUE_SUFFIX
                  : REVENUE_CHART_CONFIG.EMPTY_VALUE_LABEL}
              </text>
              <text
                x={REVENUE_CHART_CONFIG.TODAY_BAR.labelX}
                y={REVENUE_CHART_CONFIG.TODAY_BAR.axisY}
                fill={REVENUE_CHART_CONFIG.COLORS.SHIFT_LABEL}
                fontSize={REVENUE_CHART_CONFIG.FONT.SIZE}
                fontWeight={REVENUE_CHART_CONFIG.FONT.WEIGHT}
                textAnchor={REVENUE_CHART_CONFIG.FONT.TEXT_ANCHOR}
              >
                {REVENUE_CHART_CONFIG.TODAY_BAR.axisLabel}
              </text>
            </svg>
          </div>
        </div>

        <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
            {REPORT_UI.REVENUE.BEST_SELLERS_TITLE}
          </h3>
          <div className="overflow-x-auto">
            <table className="responsive-data-table responsive-data-table--page w-full text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="pb-2">{REPORT_UI.REVENUE.BEST_SELLER_COLUMNS.NAME}</th>
                  <th className="pb-2 text-right">
                    {REPORT_UI.REVENUE.BEST_SELLER_COLUMNS.QUANTITY}
                  </th>
                  <th className="pb-2 text-right">
                    {REPORT_UI.REVENUE.BEST_SELLER_COLUMNS.REVENUE}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {totalRevenueToday > REVENUE_CHART_CONFIG.MIN_REVENUE ? (
                  MOCK_BEST_SELLING_PRODUCTS.map((product) => (
                    <tr key={product.name}>
                      <td className="py-2.5 font-bold text-slate-800">
                        {product.name}
                      </td>
                      <td className="py-2.5 text-right font-bold text-indigo-600">
                        {product.quantityLabel}
                      </td>
                      <td className="py-2.5 text-right font-bold">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={REVENUE_CHART_CONFIG.BEST_SELLER_COLUMN_COUNT}
                      className="py-8 text-center text-slate-400 font-medium"
                    >
                      {REPORT_UI.REVENUE.EMPTY_BEST_SELLERS}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
