import React, { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  Layers,
  History,
  Plus,
  FolderOpen,
} from "lucide-react";
import { REPORT_UI } from "@/constants/report";
import type { ITaxPeriodOption } from "../types/ITaxDeclaration";
import {
  useGetAllTaxPeriodsQuery,
  useGetTaxPeriodDetailQuery,
  useGetTaxRevenueSummaryQuery,
  useGetSalesRegisterItemsQuery,
} from "../services/taxDeclarationApi";
import { useTaxPeriodValidation } from "../hooks/useTaxPeriodValidation";
import { useTaxDeclarationExport } from "../hooks/useTaxDeclarationExport";
import { usePeriodLockAction } from "../hooks/usePeriodLockAction";
import { TaxPeriodFilterBar } from "../components/TaxPeriodFilterBar";
import { TaxSummaryKpiCards } from "../components/TaxSummaryKpiCards";
import { TaxInvoiceAnnexTable } from "../components/TaxInvoiceAnnexTable";
import { TaxDeclarationPreviewModal } from "../components/TaxDeclarationPreviewModal";
import { MissingInfoAlertModal } from "../components/MissingInfoAlertModal";
import { LockPeriodConfirmModal } from "../components/LockPeriodConfirmModal";
import { UnlockPeriodModal } from "../components/UnlockPeriodModal";
import { GeneratePeriodModal } from "../components/GeneratePeriodModal";
import { PeriodLockAuditTimeline } from "../components/PeriodLockAuditTimeline";

export const TaxDeclarationPage: React.FC = () => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ANNEX" | "TAX_GROUPS" | "AUDIT_HISTORY"
  >("ANNEX");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // 1. Kiểm tra validation & Phân quyền (TC-02 & TC-03)
  const {
    canExport,
    isMissingInfo,
    missingFields,
    roleAllowed,
    roleRestrictionReason,
    householdData,
  } = useTaxPeriodValidation();

  // 2. Query danh sách tất cả các kỳ kê khai từ Backend
  const {
    data: periodsRes,
    isLoading: isPeriodsLoading,
    refetch: refetchPeriods,
  } = useGetAllTaxPeriodsQuery();

  // Chuyển đổi danh sách kỳ sang options cho dropdown
  const periodOptions: ITaxPeriodOption[] = useMemo(() => {
    const list = periodsRes?.result || [];
    return list.map((p) => {
      const typeLabel =
        p.periodType === "QUARTERLY"
          ? `Quý ${p.periodNumber}`
          : `Tháng ${p.periodNumber}`;
      const statusLabel = p.status === "LOCKED" ? " [Đã chốt]" : "";
      return {
        value: p.id,
        label: `${typeLabel} / ${p.year} (${p.startDate} - ${p.endDate})${statusLabel}`,
        type: p.periodType,
        periodNumber: p.periodNumber,
        year: p.year,
        startDate: p.startDate,
        endDate: p.endDate,
        periodId: p.id,
        status: p.status,
      };
    });
  }, [periodsRes?.result]);

  // Kỳ đang được chọn (mặc định lấy kỳ đầu tiên nếu chưa chọn)
  const currentPeriodId =
    selectedPeriodId || (periodOptions.length > 0 ? periodOptions[0].value : null);
  const selectedPeriodOption = periodOptions.find(
    (p) => p.value === currentPeriodId
  );

  // 3. Query chi tiết kỳ, tóm tắt doanh thu theo thuế suất và bảng kê hóa đơn
  const { data: periodDetailRes, isLoading: isDetailLoading } =
    useGetTaxPeriodDetailQuery(currentPeriodId!, {
      skip: !currentPeriodId,
    });
  const { data: summaryRes, isLoading: isSummaryLoading } =
    useGetTaxRevenueSummaryQuery(currentPeriodId!, {
      skip: !currentPeriodId,
    });
  const { data: salesRegisterRes, isLoading: isRegisterLoading } =
    useGetSalesRegisterItemsQuery(
      { periodId: currentPeriodId!, page: 0, size: 100 },
      { skip: !currentPeriodId }
    );

  const currentPeriod = periodDetailRes?.result;
  const revenueSummary = summaryRes?.result;
  const salesRegisterItems = salesRegisterRes?.result?.content || [];

  // 4. Hook xử lý xuất file Excel / PDF / XML (NCL-12-CN-003)
  const { handleExport, isExporting } = useTaxDeclarationExport({
    period: currentPeriod,
    revenueSummary,
    registerItems: salesRegisterItems,
    householdData,
    previewElementId: "tax-declaration-page-preview-form",
    onMissingInfoAlert: () => setIsMissingInfoModalOpen(true),
    isMissingInfo,
    roleAllowed,
  });

  // 5. Hook xử lý chốt kỳ & mở lại kỳ (NCL-12-CN-004)
  const {
    isOwner,
    roleLockRestrictionReason,
    isLockModalOpen,
    setIsLockModalOpen,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    handleLockPeriod,
    handleUnlockPeriod,
    isLoading: isLockingAction,
  } = usePeriodLockAction({
    period: currentPeriod,
    onSuccess: () => {
      refetchPeriods();
    },
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-12">
      {/* 1. Tiêu đề trang & Mô tả */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-2xs inline-flex items-center justify-center">
              <FileText className="w-5 h-5 shrink-0 stroke-[2.2]" />
            </span>
            <span>{REPORT_UI.TAX_DECLARATION.TITLE}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {REPORT_UI.TAX_DECLARATION.DESCRIPTION}
          </p>
        </div>

        {/* Nút Lập bảng kê kỳ mới trên Header */}
        <button
          type="button"
          onClick={() => setIsGenerateModalOpen(true)}
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-bold text-xs transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
          <span>Lập bảng kê kỳ mới</span>
        </button>
      </div>

      {/* 2. Thanh lọc kỳ tính thuế, Nút Xuất tệp & Nút Chốt/Mở lại kỳ */}
      <TaxPeriodFilterBar
        periods={periodOptions}
        selectedPeriod={selectedPeriodOption}
        onSelectPeriod={(opt) => setSelectedPeriodId(opt.value)}
        status={currentPeriod?.status}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={canExport}
        roleRestrictionReason={roleRestrictionReason}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
        onOpenCreatePeriodModal={() => setIsGenerateModalOpen(true)}
        isOwner={isOwner}
        roleLockRestrictionReason={roleLockRestrictionReason}
      />

      {/* Trường hợp chưa có kỳ kê khai nào được lập */}
      {!isPeriodsLoading && periodOptions.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-xs">
            <FolderOpen className="h-8 w-8 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Chưa có kỳ kê khai thuế nào được tạo
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Hệ thống sẽ tự động quét và tổng hợp toàn bộ hóa đơn điện tử hợp lệ đã được Cơ quan Thuế cấp mã trong kỳ để lập bảng kê và tính doanh thu chịu thuế.
          </p>
          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 active:scale-95 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Plus className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>Lập bảng kê kỳ đầu tiên</span>
          </button>
        </div>
      )}

      {/* Khi đã có kỳ được chọn */}
      {currentPeriod && (
        <>
          {/* 3. Thẻ KPI Tổng hợp doanh thu & Nghĩa vụ thuế (CN-002) */}
          <TaxSummaryKpiCards
            period={currentPeriod}
            summary={revenueSummary}
            isLoading={isDetailLoading || isSummaryLoading}
          />

          {/* 4. Tab Điều hướng Chi tiết */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("ANNEX")}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "ANNEX"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs translate-y-0"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:scale-110" />
                <span>
                  {REPORT_UI.TAX_DECLARATION.TAB_ANNEX_INVOICES} ({salesRegisterItems.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("TAX_GROUPS")}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "TAX_GROUPS"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs translate-y-0"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:scale-110" />
                <span>{REPORT_UI.TAX_DECLARATION.TAB_TAX_GROUPS}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("AUDIT_HISTORY")}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "AUDIT_HISTORY"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs translate-y-0"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <History className="w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:rotate-45" />
                <span>Nhật ký thao tác & Chốt kỳ</span>
              </button>
            </div>

            {/* Nội dung từng Tab */}
            {activeTab === "ANNEX" && (
              <div className="animate-in fade-in duration-200">
                <TaxInvoiceAnnexTable
                  invoices={salesRegisterItems}
                  periodLabel={currentPeriod.periodName}
                  isLoading={isRegisterLoading}
                />
              </div>
            )}

            {activeTab === "TAX_GROUPS" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-xs text-slate-500">
                  Chi tiết phân rã doanh thu và nghĩa vụ thuế phát sinh theo từng mức thuế suất đang áp dụng tại hộ kinh doanh:
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center w-12">STT</th>
                        <th className="p-3">Mức thuế suất</th>
                        <th className="p-3">Mô tả / Ngành hàng</th>
                        <th className="p-3 text-center">Số lượng HĐ</th>
                        <th className="p-3 text-right">Doanh thu chịu thuế</th>
                        <th className="p-3 text-right">Tiền thuế phát sinh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {revenueSummary?.taxRateSummaries &&
                      revenueSummary.taxRateSummaries.length > 0 ? (
                        revenueSummary.taxRateSummaries.map((g, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3 font-bold text-blue-700">
                              Thuế suất {g.taxRatePercentage}%
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {g.taxRateName ||
                                `Nhóm hàng chịu thuế suất ${g.taxRatePercentage}%`}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">
                              {g.invoiceCount}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(g.revenueAmount)}
                            </td>
                            <td className="p-3 text-right font-extrabold text-rose-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(g.taxAmount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-slate-400 italic"
                          >
                            Chưa có dữ liệu phân nhóm thuế suất trong kỳ này.
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50/90 font-black text-slate-900 border-t border-slate-300">
                        <td colSpan={3} className="p-3 text-center uppercase">
                          TỔNG CỘNG NGHĨA VỤ THUẾ CỦA KỲ
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {currentPeriod.totalValidInvoices} HĐ
                        </td>
                        <td className="p-3 text-right text-blue-700 font-extrabold">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(currentPeriod.totalRevenue)}
                        </td>
                        <td className="p-3 text-right text-rose-600 text-sm font-black">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(currentPeriod.totalTaxAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "AUDIT_HISTORY" && (
              <div className="animate-in fade-in duration-200">
                <PeriodLockAuditTimeline period={currentPeriod} />
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. Modals */}
      <TaxDeclarationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        period={currentPeriod}
        revenueSummary={revenueSummary}
        registerItems={salesRegisterItems}
        householdData={householdData}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={canExport}
      />

      <MissingInfoAlertModal
        isOpen={isMissingInfoModalOpen}
        onClose={() => setIsMissingInfoModalOpen(false)}
        missingFields={missingFields}
      />

      {/* Modal Lập bảng kê kỳ mới (CN-001) */}
      <GeneratePeriodModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={(newPeriodId) => {
          setSelectedPeriodId(newPeriodId);
          refetchPeriods();
        }}
      />

      {/* Modal Chốt kỳ kê khai (NCL-12-CN-004) */}
      <LockPeriodConfirmModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        period={currentPeriod}
        onConfirmLock={handleLockPeriod}
        isLoading={isLockingAction}
      />

      {/* Modal Mở lại kỳ kê khai (NCL-12-CN-004) */}
      <UnlockPeriodModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        periodLabel={currentPeriod?.periodName || ""}
        onConfirmUnlock={handleUnlockPeriod}
        isLoading={isLockingAction}
      />
    </div>
  );
};

export default TaxDeclarationPage;
