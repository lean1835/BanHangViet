import React, { useState, useTransition, useMemo } from "react";
import {
  Printer,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  FolderTree,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateShort } from "@/utils/dateFormatter";
import {
  INVENTORY_VALUATION_UI,
  INVENTORY_VALUATION_MESSAGES,
} from "@/constants/inventoryValuation";
import {
  useGetInventoryValuationReportQuery,
  useExportInventoryValuationExcelMutation,
} from "../services/inventoryValuationApi";
import { InventoryValuationSummaryCards } from "../components/InventoryValuationSummaryCards";
import { InventoryValuationGroupTable } from "../components/InventoryValuationGroupTable";
import { InventoryValuationItemTable } from "../components/InventoryValuationItemTable";
import { MissingCostItemsTable } from "../components/MissingCostItemsTable";
import { InventoryValuationPrintModal } from "../components/InventoryValuationPrintModal";
import type {
  IGetInventoryValuationQueryParams,
  IProductGroupValuation,
  IInventoryValuationItem,
  IMissingCostProduct,
} from "../types/IInventoryValuation";

import { useSearchParams } from "react-router-dom";

const EMPTY_GROUPS: IProductGroupValuation[] = [];
const EMPTY_ITEMS: IInventoryValuationItem[] = [];
const EMPTY_MISSING_ITEMS: IMissingCostProduct[] = [];

export const InventoryValuationPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [, startTransition] = useTransition();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab view: "groups" (Nhóm hàng) | "items" (Từng mặt hàng) | "missingCost" (Chưa có giá vốn)
  const [activeTab, setActiveTab] = useState<"groups" | "items" | "missingCost">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "items") return "items";
    if (tabParam === "missingCost") return "missingCost";
    if (searchParams.get("groupId")) return "items";
    return "groups";
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters from searchParams with local search debouncing
  const asOfDate = searchParams.get("asOfDate") || "";
  const groupId = searchParams.get("groupId") || "";
  const sortBy = searchParams.get("sortBy") || "inventoryValue";
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || "desc";

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  const queryParams: IGetInventoryValuationQueryParams = {
    asOfDate: asOfDate || undefined,
    groupId: groupId || undefined,
    search: debouncedSearch.trim() || undefined,
    sortBy,
    sortDir,
  };

  const {
    data: report,
    isLoading,
    error,
  } = useGetInventoryValuationReportQuery(queryParams);

  const [exportExcel, { isLoading: isExporting }] =
    useExportInventoryValuationExcelMutation();

  const handleSortChange = (field: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (sortBy === field) {
      newParams.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      newParams.set("sortBy", field);
      newParams.set("sortDir", "desc");
    }
    setSearchParams(newParams);
  };

  const handleGroupSelect = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set("groupId", id);
      setActiveTab("items");
    } else {
      newParams.delete("groupId");
    }
    setSearchParams(newParams);
  };

  const handleExport = async () => {
    try {
      const blob = await exportExcel({
        asOfDate: asOfDate || undefined,
        groupId: groupId || undefined,
        search: debouncedSearch.trim() || undefined,
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileDate = asOfDate || new Date().toISOString().split("T")[0];
      link.download = `bao-cao-gia-tri-ton-kho-${fileDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(INVENTORY_VALUATION_MESSAGES.EXPORT_SUCCESS);
    } catch {
      showError(INVENTORY_VALUATION_MESSAGES.EXPORT_FAILED);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const summary = report?.summary;
  const groups = report?.groupValuations ?? EMPTY_GROUPS;
  const items = report?.items ?? EMPTY_ITEMS;
  const missingCostItems = report?.missingCostItems ?? EMPTY_MISSING_ITEMS;
  const hasMissingCost = (summary?.missingCostProductsCount || 0) > 0;

  // Đồng bộ số liệu KPI thẻ tóm tắt với bảng (loại bỏ vốn âm do hàng bán âm kho)
  const normalizedSummary = useMemo(() => {
    if (!summary) return undefined;

    // Tổng vốn thực tế từ các nhóm hàng (không tính vốn âm)
    const validGroupsValuation = groups.reduce((sum, g) => {
      if ((g.totalStockQuantity || 0) < 0 && (g.totalInventoryValue || 0) <= 0) return sum;
      return sum + Math.max(0, g.totalInventoryValue || 0);
    }, 0);

    const validGroupsRetail = groups.reduce((sum, g) => {
      if ((g.totalStockQuantity || 0) < 0 && (g.totalRetailValue || 0) <= 0) return sum;
      return sum + Math.max(0, g.totalRetailValue || 0);
    }, 0);

    const totalValuation =
      (summary.totalInventoryValue || 0) > 0
        ? summary.totalInventoryValue
        : validGroupsValuation > 0
        ? validGroupsValuation
        : 0;

    const totalRetail =
      (summary.totalRetailValue || 0) > 0
        ? summary.totalRetailValue
        : validGroupsRetail > 0
        ? validGroupsRetail
        : 0;

    const potentialGrossProfit = Math.max(0, totalRetail - totalValuation);
    const potentialMargin =
      totalRetail > 0
        ? Math.round((potentialGrossProfit / totalRetail) * 10000) / 100
        : 0;

    return {
      ...summary,
      totalInventoryValue: totalValuation,
      totalRetailValue: totalRetail,
      potentialGrossProfit,
      potentialProfitMargin: potentialMargin,
    };
  }, [summary, groups]);

  return (
    <div className="flex flex-col gap-6 animate-auth-fade-in pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {INVENTORY_VALUATION_UI.TITLE}
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {INVENTORY_VALUATION_UI.SUBTITLE}
            {summary?.asOfDate && (
              <span> • Thời điểm chốt: <strong>{formatDateShort(summary.asOfDate)}</strong></span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="font-bold px-3.5 h-9 rounded-lg flex items-center gap-1.5 text-xs transition-all bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>{INVENTORY_VALUATION_UI.PRINT_BTN}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 text-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" />
            )}
            <span>{INVENTORY_VALUATION_UI.EXPORT_BTN}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 shadow-xs text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-400 border-t-kv-blue-primary" />
          <span className="text-xs font-semibold text-slate-600">
            Đang tải dữ liệu định giá tồn kho...
          </span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{INVENTORY_VALUATION_MESSAGES.LOAD_FAILED}</span>
        </div>
      ) : (
        <>
          {/* 2. KPI Summary Cards */}
          <InventoryValuationSummaryCards
            summary={normalizedSummary}
            onViewMissingCost={() => setActiveTab("missingCost")}
          />

          {/* 3. Navigation Tabs & Quick Search */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab 1: Theo nhóm hàng */}
              <button
                type="button"
                onClick={() => startTransition(() => setActiveTab("groups"))}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "groups"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                }`}
              >
                <FolderTree className="w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:scale-110" />
                <span>Theo nhóm hàng ({groups.length})</span>
              </button>

              {/* Tab 2: Từng mặt hàng */}
              <button
                type="button"
                onClick={() => startTransition(() => setActiveTab("items"))}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                  activeTab === "items"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 stroke-[2] transition-transform duration-200 group-hover:scale-110" />
                <span>Từng mặt hàng ({items.length})</span>
              </button>

              {/* Tab 3: Chưa có giá vốn */}
              {hasMissingCost && (
                <button
                  type="button"
                  onClick={() => startTransition(() => setActiveTab("missingCost"))}
                  className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none focus:outline-none ${
                    activeTab === "missingCost"
                      ? "bg-amber-50 text-amber-800 border border-amber-200 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 stroke-[2]" />
                  <span>Chưa có giá vốn ({missingCostItems.length})</span>
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                    title="Có mặt hàng tồn kho chưa có giá vốn nhập kho"
                  />
                </button>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  if (activeTab === "groups" && val.trim().length > 0) {
                    setActiveTab("items");
                  }
                }}
                placeholder={INVENTORY_VALUATION_UI.SEARCH_PLACEHOLDER}
                className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-medium text-slate-700 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* 4. Tab Contents */}
          {activeTab === "groups" && (
            <div className="animate-in fade-in duration-200">
              <InventoryValuationGroupTable
                groups={groups}
                selectedGroupId={groupId}
                onSelectGroup={handleGroupSelect}
              />
            </div>
          )}

          {activeTab === "items" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {groupId && (
                <div className="flex items-center justify-between bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-semibold">
                  <span>
                    Đang xem danh sách mặt hàng thuộc nhóm: <strong>{groups.find((g) => g.groupId === groupId)?.groupName || groupId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGroupSelect("")}
                    className="px-2.5 py-0.5 rounded bg-blue-200/60 hover:bg-blue-200 text-blue-800 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ✕ Xem tất cả nhóm
                  </button>
                </div>
              )}
              <InventoryValuationItemTable
                items={items}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
              />
            </div>
          )}

          {activeTab === "missingCost" && (
            <div className="animate-in fade-in duration-200">
              <MissingCostItemsTable
                items={missingCostItems}
                onBackToValuation={() => setActiveTab("items")}
              />
            </div>
          )}
        </>
      )}

      {/* Standard Accounting Document Print Modal */}
      <InventoryValuationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        report={report}
        summary={normalizedSummary}
      />
    </div>
  );
};

export default InventoryValuationPage;
