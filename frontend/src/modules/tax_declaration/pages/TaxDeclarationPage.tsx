import React, { useState, useMemo, useEffect } from "react";
import {
  FileSpreadsheet,
  Layers,
  History,
  Plus,
  FolderOpen,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  FileDown,
  Lock,
  Loader2,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { REPORT_UI } from "@/constants/report";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import type { ITaxPeriodOption } from "../types/ITaxDeclaration";
import {
  useGetAllTaxPeriodsQuery,
  useGetTaxPeriodDetailQuery,
  useGetTaxRevenueSummaryQuery,
  useGetSalesRegisterItemsQuery,
  useGetPurchaseRegisterSummaryQuery,
  useGetActiveRemindersQuery,
  useMarkDeclarationAsExportedMutation,
  downloadPurchaseRegisterExcel,
  downloadTaxDeclarationExcel,
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
import { TaxPurchaseKpiSummaryCards } from "../components/TaxPurchaseKpiSummaryCards";
import { TaxPurchaseRegisterAnnexTable } from "../components/TaxPurchaseRegisterAnnexTable";
import { MissingSupplierWarningBanner } from "../components/MissingSupplierWarningBanner";
import { GeneratePurchaseRegisterModal } from "../components/GeneratePurchaseRegisterModal";
import { TaxReminderSettingsModal } from "../components/TaxReminderSettingsModal";
import { TaxPeriodProgressChecklistBanner } from "../components/TaxPeriodProgressChecklistBanner";

export const TaxDeclarationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ANNEX" | "TAX_GROUPS" | "PURCHASE_REGISTER" | "AUDIT_HISTORY"
  >("ANNEX");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGeneratePurchaseModalOpen, setIsGeneratePurchaseModalOpen] = useState(false);
  const [isReminderSettingsModalOpen, setIsReminderSettingsModalOpen] = useState(false);
  const [isExportingPurchase, setIsExportingPurchase] = useState(false);
  const [missingSupplierFilterOnly, setMissingSupplierFilterOnly] = useState(false);

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
      const formattedStartDate = formatDateOnly(p.startDate);
      const formattedEndDate = formatDateOnly(p.endDate);
      return {
        value: p.id,
        label: `${typeLabel}/${p.year} (${formattedStartDate} - ${formattedEndDate})${statusLabel}`,
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

  // 3b. Query bảng kê mua vào (NCL-12-CN-006)
  const {
    data: purchaseSummaryRes,
    isLoading: isPurchaseSummaryLoading,
    refetch: refetchPurchaseSummary,
  } = useGetPurchaseRegisterSummaryQuery(currentPeriodId!, {
    skip: !currentPeriodId,
  });

  // NCL-12-CN-007: Lấy danh sách nhắc lịch nộp tờ khai đang kích hoạt
  const { data: remindersRes, refetch: refetchReminders } = useGetActiveRemindersQuery();
  const [markDeclarationAsExported, { isLoading: isMarkingExported }] =
    useMarkDeclarationAsExportedMutation();

  const handleMarkAsExported = async () => {
    if (!currentPeriodId) return;
    try {
      await markDeclarationAsExported(currentPeriodId).unwrap();
      refetchReminders();
      refetchPeriods();
      showSuccess("Đã cập nhật trạng thái: Đã xuất tờ khai thuế thành công!");
    } catch {
      // Fallback: nếu gọi API đánh dấu gặp lỗi, tải tệp Excel để máy chủ tự động cập nhật cờ đã xuất
      try {
        const periodLabel =
          currentPeriod?.periodType === "MONTHLY"
            ? `T${currentPeriod.periodNumber}`
            : `Q${currentPeriod?.periodNumber}`;
        const fileName = `To_khai_thue_${periodLabel}_${currentPeriod?.year}.xlsx`;
        await downloadTaxDeclarationExcel(currentPeriodId, fileName);
        refetchReminders();
        refetchPeriods();
        showSuccess("Đã tải tờ khai và cập nhật trạng thái thành công!");
      } catch (err2: unknown) {
        const msg =
          err2 instanceof Error
            ? err2.message
            : "Không thể cập nhật trạng thái xuất tờ khai.";
        showError(msg);
      }
    }
  };

  // Tự động nhận diện periodId và tab từ URL query params (deep link từ thông báo)
  useEffect(() => {
    const pId = searchParams.get("periodId");
    if (pId) {
      setSelectedPeriodId(pId);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam === "purchase-register") {
      setActiveTab("PURCHASE_REGISTER");
    } else if (tabParam === "tax-groups") {
      setActiveTab("TAX_GROUPS");
    } else if (tabParam === "audit") {
      setActiveTab("AUDIT_HISTORY");
    }
  }, [searchParams]);

  // Tìm nhắc việc cho kỳ đang chọn hoặc kỳ đang quá hạn cần chú ý
  const currentPeriodReminder = useMemo(() => {
    if (!currentPeriodId) return null;
    return remindersRes?.result?.find((r) => r.periodId === currentPeriodId) || null;
  }, [remindersRes?.result, currentPeriodId]);

  const currentPeriod = periodDetailRes?.result;
  const revenueSummary = summaryRes?.result;
  const salesRegisterItems = salesRegisterRes?.result?.content || [];
  const purchaseSummary = purchaseSummaryRes?.result;

  // Tính số lượng dòng chi tiết hàng hóa mua vào
  const purchaseItemsCount = useMemo(() => {
    if (!purchaseSummary) return 0;
    const validCount = (purchaseSummary.validSuppliers || []).reduce(
      (acc, g) => acc + (g.items?.length || 0),
      0
    );
    const unidentifiedCount =
      purchaseSummary.unidentifiedSuppliers?.items?.length || 0;
    return validCount + unidentifiedCount;
  }, [purchaseSummary]);

  // Nhãn hiển thị kỳ gọn gàng cho Bảng kê mua vào (ví dụ: Tháng 07/2026 hoặc Quý 3/2026)
  const cleanPeriodLabel = useMemo(() => {
    if (!currentPeriod) return "";
    const typeLabel =
      currentPeriod.periodType === "QUARTERLY"
        ? `Quý ${currentPeriod.periodNumber}`
        : `Tháng ${String(currentPeriod.periodNumber).padStart(2, "0")}`;
    return `${typeLabel}/${currentPeriod.year}`;
  }, [currentPeriod]);

  // Handler xuất tệp Excel bảng kê mua vào (NCL-12-CN-006)
  const handleExportPurchaseRegister = async () => {
    if (!currentPeriodId) return;
    try {
      setIsExportingPurchase(true);
      const periodLabel =
        currentPeriod?.periodType === "MONTHLY"
          ? `T${currentPeriod.periodNumber}`
          : `Q${currentPeriod?.periodNumber}`;
      const fileName = `Bang_ke_hang_hoa_mua_vao_${periodLabel}_${currentPeriod?.year}.xlsx`;
      await downloadPurchaseRegisterExcel(currentPeriodId, fileName);
      showSuccess("Xuất tệp Excel bảng kê hàng hóa mua vào thành công!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể xuất file Excel bảng kê mua vào.";
      showError(msg);
    } finally {
      setIsExportingPurchase(false);
    }
  };

  // 4. Hook xử lý xuất file Excel / PDF / XML (NCL-12-CN-003)
  const { handleExport, isExporting } = useTaxDeclarationExport({
    period: currentPeriod,
    revenueSummary,
    registerItems: salesRegisterItems,
    householdData,
    previewElementId: "tax-declaration-form-simulation",
    onMissingInfoAlert: () => setIsMissingInfoModalOpen(true),
    onExportSuccess: () => {
      refetchPeriods();
      refetchReminders();
    },
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
      refetchReminders();
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-auth-fade-in">
      {/* 1. Tiêu đề trang, Mô tả & Nút Cài đặt nhắc hạn (NCL-12-CN-007) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-slate-800">
            {REPORT_UI.TAX_DECLARATION.TITLE}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {REPORT_UI.TAX_DECLARATION.DESCRIPTION}
          </p>
        </div>

        {/* Nút cấu hình nhắc hạn nộp tờ khai (NCL-12-CN-007) */}
        <button
          type="button"
          onClick={() => setIsReminderSettingsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none shrink-0 self-start sm:self-center"
        >
          <BellRing className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Cài đặt nhắc hạn</span>
        </button>
      </div>

      {/* Banner liên kết Theo dõi doanh thu lũy kế năm (NCL-12-CN-005) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-white shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wide">
              Theo dõi doanh thu lũy kế năm & Cảnh báo ngưỡng 1 tỷ
            </h3>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Kiểm tra tiến độ doanh thu thực tế so với ngưỡng bắt buộc áp dụng HĐĐT khởi tạo từ máy tính tiền.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.REPORT_ANNUAL_REVENUE)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-900 text-xs font-extrabold hover:bg-blue-50 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <span>Xem lũy kế năm</span>
          <ChevronRight className="w-4 h-4" />
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

      {/* 2b. Banner cảnh báo hạn nộp tờ khai & Checklist tiến độ (NCL-12-CN-007) */}
      <TaxPeriodProgressChecklistBanner
        reminder={currentPeriodReminder}
        onSelectTab={(t) => setActiveTab(t)}
        onOpenExport={() => setIsPreviewModalOpen(true)}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        onMarkAsExported={handleMarkAsExported}
        isMarkingExported={isMarkingExported}
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
          {/* 3. Thẻ KPI Tổng hợp doanh thu & Nghĩa vụ thuế */}
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

              {/* Tab Bảng kê hàng hóa mua vào */}
              <button
                type="button"
                onClick={() => setActiveTab("PURCHASE_REGISTER")}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "PURCHASE_REGISTER"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs translate-y-0"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <ShoppingBag
                  className={`w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:scale-110 ${
                    activeTab === "PURCHASE_REGISTER" ? "text-blue-600" : "text-slate-500"
                  }`}
                />
                <span>
                  Bảng kê mua vào {purchaseSummary ? `(${purchaseItemsCount})` : ""}
                </span>
                {purchaseSummary?.hasMissingSupplierReceipts && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                    title="Có chứng từ thiếu thông tin NCC"
                  />
                )}
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

            {/* Nội dung Tab Bảng kê mua vào */}
            {activeTab === "PURCHASE_REGISTER" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {purchaseSummary ? (
                  <>
                    {/* Action Toolbar màu xanh - trắng - xám theo vibe web */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Bảng kê hàng hóa, dịch vụ mua vào — {cleanPeriodLabel}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentPeriod.status === "LOCKED"
                            ? "Kỳ đã chốt sổ: Số liệu mua vào đã khóa, chỉ xem và xuất file Excel."
                            : "Dữ liệu tổng hợp từ các phiếu nhập kho phát sinh trong kỳ."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {currentPeriod.status === "LOCKED" ? (
                          <div title="Kỳ kê khai đã chốt sổ, không thể chỉnh sửa hay lập lại số liệu">
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed shrink-0"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Số liệu đã khóa</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsGeneratePurchaseModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs transition-colors shadow-2xs cursor-pointer select-none shrink-0"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Cập nhật</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleExportPurchaseRegister}
                          disabled={isExportingPurchase}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer select-none disabled:opacity-50 shrink-0"
                        >
                          {isExportingPurchase ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          ) : (
                            <FileDown className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Xuất Excel</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Thẻ KPI Mua vào */}
                    <TaxPurchaseKpiSummaryCards
                      summary={purchaseSummary}
                      isLoading={isPurchaseSummaryLoading}
                    />

                    {/* Banner Cảnh báo ngoại lệ chứng từ thiếu NCC */}
                    {purchaseSummary.hasMissingSupplierReceipts && (
                      <MissingSupplierWarningBanner
                        missingCount={purchaseSummary.missingSupplierReceiptCount}
                        missingAmount={
                          purchaseSummary.unidentifiedSuppliers?.subtotalAmount || 0
                        }
                        customMessage={purchaseSummary.warningMessage}
                        isFilterActive={missingSupplierFilterOnly}
                        onToggleFilter={() =>
                          setMissingSupplierFilterOnly((prev) => !prev)
                        }
                      />
                    )}

                    {/* Bảng kê hàng hóa mua vào phân nhóm NCC */}
                    <TaxPurchaseRegisterAnnexTable
                      summary={purchaseSummary}
                      periodLabel={cleanPeriodLabel}
                      isLoading={isPurchaseSummaryLoading}
                      filterMissingOnly={missingSupplierFilterOnly}
                    />
                  </>
                ) : (
                  /* Empty State khi chưa lập bảng kê mua vào */
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3 shadow-2xs">
                      <ShoppingBag className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Chưa lập bảng kê hàng hóa mua vào cho kỳ này
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Hệ thống sẽ tổng hợp toàn bộ các phiếu nhập kho đã lưu trong kỳ, trừ phần hàng đã trả lại NCC, rồi gom nhóm theo từng Nhà cung cấp.
                    </p>
                    {currentPeriod.status === "LOCKED" ? (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 font-medium text-xs">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kỳ đã chốt sổ, không thể lập mới bảng kê</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsGeneratePurchaseModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Lập bảng kê mua vào</span>
                      </button>
                    )}
                  </div>
                )}
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

      {/* Modal Lập bảng kê mua vào kỳ mới (NCL-12-CN-006) */}
      <GeneratePurchaseRegisterModal
        isOpen={isGeneratePurchaseModalOpen}
        onClose={() => setIsGeneratePurchaseModalOpen(false)}
        defaultPeriodType={currentPeriod?.periodType}
        defaultYear={currentPeriod?.year}
        defaultPeriodNumber={currentPeriod?.periodNumber}
        onSuccess={(newPeriodId) => {
          if (newPeriodId === currentPeriodId) {
            refetchPurchaseSummary();
          } else {
            setSelectedPeriodId(newPeriodId);
          }
          refetchPeriods();
        }}
      />

      {/* Modal Cài đặt nhắc lịch nộp tờ khai (NCL-12-CN-007) */}
      <TaxReminderSettingsModal
        isOpen={isReminderSettingsModalOpen}
        onClose={() => setIsReminderSettingsModalOpen(false)}
        isOwner={isOwner}
      />
    </div>
  );
};

export default TaxDeclarationPage;
