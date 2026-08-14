import React, { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  Layers,
  History,
} from "lucide-react";
import { REPORT_UI } from "@/constants/report";
import type {
  ITaxPeriodOption,
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
} from "../types/ITaxDeclaration";
import type {
  IPeriodLockAudit,
  IRolloverAdjustment,
} from "../types/ITaxPeriodLock";
import {
  useGetTaxDeclarationSummaryQuery,
  useGetTaxAnnexInvoicesQuery,
  useGetPeriodLockHistoryQuery,
  useGetRolloverAdjustmentsQuery,
} from "../services/taxDeclarationApi";
import { useTaxPeriodValidation } from "../hooks/useTaxPeriodValidation";
import { useTaxDeclarationExport } from "../hooks/useTaxDeclarationExport";
import { usePeriodLockAction } from "../hooks/usePeriodLockAction";
import { TaxPeriodFilterBar } from "../components/TaxPeriodFilterBar";
import { TaxSummaryKpiCards } from "../components/TaxSummaryKpiCards";
import { SimulatedTaxForm01 } from "../components/SimulatedTaxForm01";
import { TaxInvoiceAnnexTable } from "../components/TaxInvoiceAnnexTable";
import { TaxDeclarationPreviewModal } from "../components/TaxDeclarationPreviewModal";
import { MissingInfoAlertModal } from "../components/MissingInfoAlertModal";
import { LockPeriodConfirmModal } from "../components/LockPeriodConfirmModal";
import { UnlockPeriodModal } from "../components/UnlockPeriodModal";
import { RolloverAdjustmentNotice } from "../components/RolloverAdjustmentNotice";
import { PeriodLockAuditTimeline } from "../components/PeriodLockAuditTimeline";
import { formatCurrency } from "@/utils/formatCurrency";

const TAX_PERIODS_2026: ITaxPeriodOption[] = [
  {
    value: "Q3-2026",
    label: "Quý 3 / 2026 (01/07/2026 - 30/09/2026)",
    type: "QUARTER",
    quarter: 3,
    year: 2026,
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  },
  {
    value: "Q2-2026",
    label: "Quý 2 / 2026 (01/04/2026 - 30/06/2026) [Đã chốt]",
    type: "QUARTER",
    quarter: 2,
    year: 2026,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
  },
  {
    value: "Q1-2026",
    label: "Quý 1 / 2026 (01/01/2026 - 31/03/2026) [Đã chốt]",
    type: "QUARTER",
    quarter: 1,
    year: 2026,
    startDate: "2026-01-01",
    endDate: "2026-03-31",
  },
  {
    value: "M09-2026",
    label: "Tháng 09 / 2026 (01/09/2026 - 30/09/2026)",
    type: "MONTH",
    month: 9,
    year: 2026,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  },
  {
    value: "M08-2026",
    label: "Tháng 08 / 2026 (01/08/2026 - 31/08/2026)",
    type: "MONTH",
    month: 8,
    year: 2026,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    value: "M07-2026",
    label: "Tháng 07 / 2026 (01/07/2026 - 31/07/2026)",
    type: "MONTH",
    month: 7,
    year: 2026,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  },
];

export const TaxDeclarationPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ITaxPeriodOption>(
    TAX_PERIODS_2026[0]
  );
  const [activeTab, setActiveTab] = useState<
    "FORM" | "ANNEX" | "TAX_GROUPS" | "AUDIT_HISTORY"
  >("FORM");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);

  // Trạng thái khóa cục bộ của từng kỳ (quản lý reactive state)
  const [periodStatusOverrides, setPeriodStatusOverrides] = useState<
    Record<string, { status: "OPEN" | "LOCKED"; lockedAt?: string; lockedBy?: string }>
  >({});

  // 1. Kiểm tra validation & Phân quyền (TC-02 & TC-03)
  const {
    canExport,
    isMissingInfo,
    missingFields,
    roleAllowed,
    roleRestrictionReason,
    householdData,
  } = useTaxPeriodValidation();

  // 2. Query dữ liệu từ máy chủ
  const { data: summaryRes } = useGetTaxDeclarationSummaryQuery({
    periodCode: selectedPeriod.value,
    year: selectedPeriod.year,
    startDate: selectedPeriod.startDate,
    endDate: selectedPeriod.endDate,
  });

  const { data: annexRes } = useGetTaxAnnexInvoicesQuery({
    periodCode: selectedPeriod.value,
    year: selectedPeriod.year,
    startDate: selectedPeriod.startDate,
    endDate: selectedPeriod.endDate,
  });

  const { data: lockHistoryRes } = useGetPeriodLockHistoryQuery();
  const { data: rolloverRes } = useGetRolloverAdjustmentsQuery({
    periodCode: selectedPeriod.value,
    year: selectedPeriod.year,
  });

  // Mock / Calculated Fallback data chuẩn xác theo TC-01 & QTN-21 / QTN-22
  const summary: ITaxDeclarationSummary = useMemo(() => {
    if (summaryRes?.result) return summaryRes.result;

    const defaultLocked =
      selectedPeriod.value === "Q1-2026" || selectedPeriod.value === "Q2-2026";
    const currentOverride = periodStatusOverrides[selectedPeriod.value];

    const currentStatus = currentOverride
      ? currentOverride.status
      : defaultLocked
      ? "LOCKED"
      : "OPEN";

    return {
      periodCode: selectedPeriod.value,
      periodLabel: selectedPeriod.label.split(" (")[0],
      year: selectedPeriod.year,
      startDate: selectedPeriod.startDate,
      endDate: selectedPeriod.endDate,
      status: currentStatus,
      householdName: householdData?.name || "Hộ kinh doanh Bán Hàng Việt",
      taxCode: householdData?.taxCode || "8123456789",
      representativeName: householdData?.representativeName || "Nguyễn Văn A",
      address: householdData?.address || "Số 123 Trần Phú, Hải Châu, Đà Nẵng",
      phoneNumber: householdData?.phoneNumber || "0905123456",
      taxAuthorityName: "CHI CỤC THUẾ KHU VỰC QUẬN HẢI CHÂU",
      totalRevenue: 184000000,
      totalVatAmount: 7440000,
      totalPitAmount: 4960000,
      totalPayableTaxAmount: 12400000,
      taxGroups: [
        {
          taxRatePercentage: 8,
          categoryLabel: "Phân phối, cung cấp hàng hóa (Thuế suất 8%)",
          revenueBeforeTax: 120000000,
          vatRatePercent: 4.0,
          vatAmount: 4800000,
          pitRatePercent: 1.0,
          pitAmount: 1200000,
          totalTaxAmount: 6000000,
        },
        {
          taxRatePercentage: 5,
          categoryLabel: "Dịch vụ, ăn uống, tiêu dùng (Thuế suất 5%)",
          revenueBeforeTax: 64000000,
          vatRatePercent: 4.125,
          vatAmount: 2640000,
          pitRatePercent: 5.875,
          pitAmount: 3760000,
          totalTaxAmount: 6400000,
        },
      ],
      validInvoicesCount: 24,
      adjustedInvoicesCount: 2,
      cancelledInvoicesCount: 1,
      lockedAt:
        currentOverride?.lockedAt ||
        (defaultLocked ? "2026-07-05T09:00:00Z" : undefined),
      lockedBy:
        currentOverride?.lockedBy ||
        (defaultLocked ? "VT-01 (Chủ hộ - Nguyễn Văn A)" : undefined),
    };
  }, [summaryRes, selectedPeriod, householdData, periodStatusOverrides]);

  const annexInvoices: ITaxAnnexInvoice[] = useMemo(() => {
    if (annexRes?.result) return annexRes.result;

    return [
      {
        id: "INV-001",
        invoiceNumber: "00000123",
        invoiceSeries: "1C26TAA",
        issuedDate: "2026-08-10",
        buyerName: "Công ty TNHH Ánh Dương",
        buyerTaxCode: "0108999888",
        preTaxAmount: 50000000,
        taxRatePercentage: 8,
        taxAmount: 4000000,
        finalAmount: 54000000,
        taxAuthorityCode: "T26-0012345",
        isAdjustment: false,
      },
      {
        id: "INV-002",
        invoiceNumber: "00000124",
        invoiceSeries: "1C26TAA",
        issuedDate: "2026-08-11",
        buyerName: "Khách lẻ - Anh Hùng",
        preTaxAmount: 25000000,
        taxRatePercentage: 8,
        taxAmount: 2000000,
        finalAmount: 27000000,
        taxAuthorityCode: "T26-0012346",
        isAdjustment: false,
      },
      {
        id: "INV-003",
        invoiceNumber: "00000125",
        invoiceSeries: "1C26TAA",
        issuedDate: "2026-08-12",
        buyerName: "Nhà hàng Biển Xanh",
        buyerTaxCode: "0401222333",
        preTaxAmount: 40000000,
        taxRatePercentage: 5,
        taxAmount: 2000000,
        finalAmount: 42000000,
        taxAuthorityCode: "T26-0012347",
        isAdjustment: false,
      },
      {
        id: "INV-004",
        invoiceNumber: "00000126",
        invoiceSeries: "1C26TAA",
        issuedDate: "2026-08-13",
        buyerName: "Khách lẻ - Chị Mai",
        preTaxAmount: 24000000,
        taxRatePercentage: 5,
        taxAmount: 1200000,
        finalAmount: 25200000,
        taxAuthorityCode: "T26-0012348",
        isAdjustment: false,
      },
      {
        id: "INV-005",
        invoiceNumber: "00000127",
        invoiceSeries: "1C26TAA",
        issuedDate: "2026-08-14",
        buyerName: "Công ty TNHH Ánh Dương",
        buyerTaxCode: "0108999888",
        preTaxAmount: -5000000,
        taxRatePercentage: 8,
        taxAmount: -400000,
        finalAmount: -5400000,
        taxAuthorityCode: "T26-0012349",
        isAdjustment: true,
        originalInvoiceNumber: "00000123",
      },
    ];
  }, [annexRes]);

  // Danh sách các khoản điều chỉnh giảm bị chuyển tiếp sang kỳ sau (TC-02, QTN-21)
  const rolloverAdjustments: IRolloverAdjustment[] = useMemo(() => {
    if (rolloverRes?.result) return rolloverRes.result;

    if (summary.status === "LOCKED") {
      return [
        {
          id: "ROLLOVER-01",
          originalInvoiceNumber: "00000123",
          originalInvoiceSeries: "1C26TAA",
          returnTicketNumber: "PTH-0009",
          originalPeriod: summary.periodCode,
          rolloverPeriod: "Q4-2026",
          adjustmentAmount: -5000000,
          adjustmentTaxAmount: -400000,
          approvedDate: "2026-10-08",
          reason: "Khách trả hàng sau khi Quý 3 đã chốt sổ",
        },
      ];
    }
    return [];
  }, [rolloverRes, summary.status, summary.periodCode]);

  // Lịch sử kiểm toán chốt và mở lại kỳ (TC-04)
  const auditHistory: IPeriodLockAudit[] = useMemo(() => {
    if (lockHistoryRes?.result) return lockHistoryRes.result;

    return [
      {
        id: "AUDIT-01",
        periodCode: "Q2-2026",
        periodLabel: "Quý 2 / 2026",
        action: "LOCK",
        performedBy: "VT-01 (Chủ hộ - Nguyễn Văn A)",
        performedAt: "2026-07-05T09:00:00Z",
        notes: "Đã nộp tờ khai quý 2 qua hệ thống eTax",
        totalRevenueAtAction: 175000000,
        totalTaxAtAction: 11800000,
        validInvoicesCount: 22,
      },
      {
        id: "AUDIT-02",
        periodCode: "Q1-2026",
        periodLabel: "Quý 1 / 2026",
        action: "LOCK",
        performedBy: "VT-01 (Chủ hộ - Nguyễn Văn A)",
        performedAt: "2026-04-05T14:30:00Z",
        notes: "Khóa số liệu quý 1 theo quy định",
        totalRevenueAtAction: 160000000,
        totalTaxAtAction: 10500000,
        validInvoicesCount: 19,
      },
    ];
  }, [lockHistoryRes]);

  // 3. Hook xử lý xuất file (NCL-12-CN-003)
  const { handleExport, isExporting } = useTaxDeclarationExport({
    summary,
    annexInvoices,
    previewElementId: "tax-declaration-page-preview-form",
    onMissingInfoAlert: () => setIsMissingInfoModalOpen(true),
    isMissingInfo,
    roleAllowed,
  });

  // 4. Hook xử lý chốt kỳ & mở lại kỳ (NCL-12-CN-004)
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
    summary,
    onStatusChange: (newStatus, lockedAt, lockedBy) => {
      setPeriodStatusOverrides((prev) => ({
        ...prev,
        [selectedPeriod.value]: {
          status: newStatus,
          lockedAt,
          lockedBy,
        },
      }));
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Tiêu đề trang & Mô tả */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-kv-blue-primary" />
            <span>{REPORT_UI.TAX_DECLARATION.TITLE}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {REPORT_UI.TAX_DECLARATION.DESCRIPTION}
          </p>
        </div>
      </div>

      {/* 2. Thanh lọc kỳ tính thuế, Nút Xuất tệp & Nút Chốt/Mở lại kỳ */}
      <TaxPeriodFilterBar
        periods={TAX_PERIODS_2026}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        status={summary.status}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={canExport}
        roleRestrictionReason={roleRestrictionReason}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
        isOwner={isOwner}
        roleLockRestrictionReason={roleLockRestrictionReason}
      />

      {/* Banner thông báo Rollover nếu kỳ đã chốt (TC-02, QTN-21) */}
      {summary.status === "LOCKED" && rolloverAdjustments.length > 0 && (
        <RolloverAdjustmentNotice
          adjustments={rolloverAdjustments}
          currentPeriodLabel={summary.periodLabel}
        />
      )}

      {/* 3. Thẻ KPI Tổng hợp doanh thu & Nghĩa vụ thuế */}
      <TaxSummaryKpiCards summary={summary} />

      {/* 4. Tab Điều hướng Chi tiết */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("FORM")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "FORM"
                ? "bg-kv-blue-light text-kv-blue-primary border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{REPORT_UI.TAX_DECLARATION.TAB_SIMULATED_FORM}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ANNEX")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "ANNEX"
                ? "bg-kv-blue-light text-kv-blue-primary border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {REPORT_UI.TAX_DECLARATION.TAB_ANNEX_INVOICES} ({annexInvoices.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TAX_GROUPS")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "TAX_GROUPS"
                ? "bg-kv-blue-light text-kv-blue-primary border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{REPORT_UI.TAX_DECLARATION.TAB_TAX_GROUPS}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("AUDIT_HISTORY")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "AUDIT_HISTORY"
                ? "bg-kv-blue-light text-kv-blue-primary border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Nhật ký chốt kỳ (TC-04)</span>
          </button>
        </div>

        {/* Nội dung từng Tab */}
        {activeTab === "FORM" && (
          <div className="bg-slate-100/70 p-4 sm:p-6 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 text-xs">
              <span className="text-slate-500 italic">
                * Dưới đây là bản mô phỏng trực tiếp Mẫu 01/CNKD sẽ được in / xuất tệp
                {summary.status === "LOCKED" && " (ĐÃ ĐÓNG BĂNG DỮ LIỆU)"}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="text-kv-blue-primary font-bold hover:underline"
              >
                Mở rộng toàn màn hình & In ↗
              </button>
            </div>
            <SimulatedTaxForm01
              id="tax-declaration-page-preview-form"
              summary={summary}
            />
          </div>
        )}

        {activeTab === "ANNEX" && (
          <TaxInvoiceAnnexTable
            invoices={annexInvoices}
            periodLabel={summary.periodLabel}
          />
        )}

        {activeTab === "TAX_GROUPS" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Chi tiết phân rã doanh thu và nghĩa vụ thuế phát sinh theo từng mức thuế suất đang áp dụng tại hộ kinh doanh:
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-12">STT</th>
                    <th className="p-3">Nhóm ngành nghề / Mức thuế</th>
                    <th className="p-3 text-right">Doanh thu chịu thuế</th>
                    <th className="p-3 text-center">Thuế suất GTGT</th>
                    <th className="p-3 text-right">Tiền thuế GTGT</th>
                    <th className="p-3 text-center">Thuế suất TNCN</th>
                    <th className="p-3 text-right">Tiền thuế TNCN</th>
                    <th className="p-3 text-right">Tổng thuế phải nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {summary.taxGroups.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {g.categoryLabel}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatCurrency(g.revenueBeforeTax)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {g.vatRatePercent}%
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {formatCurrency(g.vatAmount)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {g.pitRatePercent}%
                      </td>
                      <td className="p-3 text-right font-bold text-indigo-600">
                        {formatCurrency(g.pitAmount)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-rose-600 text-sm">
                        {formatCurrency(g.totalTaxAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-black text-slate-900 border-t border-slate-300">
                    <td colSpan={2} className="p-3 text-center uppercase">
                      TỔNG CỘNG
                    </td>
                    <td className="p-3 text-right text-kv-blue-primary">
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right text-emerald-600">
                      {formatCurrency(summary.totalVatAmount)}
                    </td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right text-indigo-600">
                      {formatCurrency(summary.totalPitAmount)}
                    </td>
                    <td className="p-3 text-right text-rose-600 text-base">
                      {formatCurrency(summary.totalPayableTaxAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "AUDIT_HISTORY" && (
          <PeriodLockAuditTimeline
            history={auditHistory}
            periodLabel={summary.periodLabel}
          />
        )}
      </div>

      {/* 5. Modals */}
      <TaxDeclarationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        summary={summary}
        annexInvoices={annexInvoices}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={canExport}
      />

      <MissingInfoAlertModal
        isOpen={isMissingInfoModalOpen}
        onClose={() => setIsMissingInfoModalOpen(false)}
        missingFields={missingFields}
      />

      {/* Modal Chốt kỳ kê khai (NCL-12-CN-004) */}
      <LockPeriodConfirmModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        summary={summary}
        onConfirmLock={handleLockPeriod}
        isLoading={isLockingAction}
      />

      {/* Modal Mở lại kỳ kê khai (NCL-12-CN-004) */}
      <UnlockPeriodModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        periodLabel={summary.periodLabel}
        onConfirmUnlock={handleUnlockPeriod}
        isLoading={isLockingAction}
      />
    </div>
  );
};

export default TaxDeclarationPage;
