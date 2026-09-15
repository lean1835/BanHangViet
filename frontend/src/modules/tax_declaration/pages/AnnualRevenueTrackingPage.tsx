import React, { useState } from "react";
import {
  Calendar,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { REPORT_UI } from "@/constants/report";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useGetAnnualRevenueTrackingQuery } from "../services/annualRevenueApi";
import { AnnualRevenueKpiCards } from "../components/AnnualRevenueKpiCards";
import { AnnualRevenueProgressBar } from "../components/AnnualRevenueProgressBar";
import { AnnualRevenueWarningAlert } from "../components/AnnualRevenueWarningAlert";
import { WarningThresholdConfigModal } from "../components/WarningThresholdConfigModal";
import { MonthlyRevenueBreakdownTable } from "../components/MonthlyRevenueBreakdownTable";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

export const AnnualRevenueTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();
  const isOwner = currentRole === USER_ROLES.OWNER;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Sinh danh sách các năm lựa chọn từ 2024 đến năm hiện tại + 1
  const yearOptions = [
    currentYear + 1,
    currentYear,
    currentYear - 1,
    currentYear - 2,
  ];

  const {
    data: trackingRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAnnualRevenueTrackingQuery({ year: selectedYear });

  const trackingData = trackingRes?.result;

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-auth-fade-in">
      {/* 1. Header Tiêu đề & Các Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800">
              {REPORT_UI.ANNUAL_REVENUE.TITLE}
            </h1>
            {trackingData?.isMandatory && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Hộ diện bắt buộc
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            {REPORT_UI.ANNUAL_REVENUE.DESCRIPTION}
          </p>
        </div>

        {/* Thanh công cụ chọn năm & cấu hình */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Chọn năm */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Chọn năm tính thuế"
              className="bg-transparent focus:outline-none cursor-pointer font-extrabold text-slate-800"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Cấu hình mức cảnh báo (Chỉ Chủ hộ hoặc Xem với Kế toán) */}
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isOwner
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/20 active:scale-95"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
            title={
              isOwner
                ? "Điều chỉnh tỷ lệ phần trăm cảnh báo ngưỡng"
                : "Kế toán chỉ được xem cấu hình cảnh báo"
            }
          >
            <Sliders className="w-4 h-4 stroke-[2.2]" />
            <span>{REPORT_UI.ANNUAL_REVENUE.BTN_CONFIG_THRESHOLD}</span>
          </button>

          {/* Nút chuyển sang Tờ khai thuế */}
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.REPORT_TAX_DECLARATION)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Xem Tờ khai thuế & Phụ lục bảng kê theo kỳ"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Tờ khai thuế kỳ</span>
          </button>
        </div>
      </div>

      {/* Xử lý trạng thái lỗi */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-bold block mb-1">
              Không thể tải dữ liệu theo dõi doanh thu lũy kế năm
            </strong>
            <span>{getApiErrorMessage(error, "Đã xảy ra lỗi khi tải dữ liệu doanh thu lũy kế.")}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 block font-bold text-blue-700 underline hover:text-blue-800 cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* 2. Banner Thông Báo & Cảnh Báo Pháp Lý (TC-02 & TC-03) */}
      <AnnualRevenueWarningAlert data={trackingData} />

      {/* 3. Thẻ KPI Tổng Quan Doanh Thu & Dự Báo (TC-01) */}
      <AnnualRevenueKpiCards data={trackingData} isLoading={isLoading} />

      {/* 4. Thanh Tiến Độ Đa Phân Đoạn (0 -> Ngưỡng cảnh báo -> 1 Tỷ) */}
      <AnnualRevenueProgressBar data={trackingData} />

      {/* 5. Bảng Phân Rã Doanh Thu 12 Tháng */}
      <MonthlyRevenueBreakdownTable
        breakdown={trackingData?.monthlyBreakdown}
        year={selectedYear}
        warningThresholdPercentage={trackingData?.warningThresholdPercentage}
      />

      {/* 6. Modal Cấu Hình Ngưỡng Cảnh Báo */}
      <WarningThresholdConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentPercentage={trackingData?.warningThresholdPercentage ?? 80}
        isOwner={isOwner}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default AnnualRevenueTrackingPage;
