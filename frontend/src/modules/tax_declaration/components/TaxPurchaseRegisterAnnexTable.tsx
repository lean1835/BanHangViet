import React, { useState, useMemo, useCallback } from "react";
import {
  Building2,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  ShoppingBag,
} from "lucide-react";
import type {
  ITaxPurchaseRegisterSummaryResponse,
  ITaxPurchaseRegisterItemResponse,
} from "../types/ITaxPurchaseRegister";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";

interface ITaxPurchaseRegisterAnnexTableProps {
  summary?: ITaxPurchaseRegisterSummaryResponse;
  periodLabel?: string;
  isLoading?: boolean;
  filterMissingOnly?: boolean;
}

interface IExtendedPurchaseItem extends ITaxPurchaseRegisterItemResponse {
  groupKey: string;
  isUnidentified: boolean;
  supplierNameDisplay: string;
  supplierTaxCodeDisplay?: string | null;
  groupSubtotalQuantity: number;
  groupSubtotalAmount: number;
  groupReceiptCount: number;
  globalIndex: number;
}

interface IGroupDisplayOnPage {
  groupKey: string;
  isUnidentified: boolean;
  supplierName: string;
  supplierTaxCode?: string | null;
  groupSubtotalQuantity: number;
  groupSubtotalAmount: number;
  groupReceiptCount: number;
  totalGroupItemsCount: number;
  items: IExtendedPurchaseItem[];
}

export const TaxPurchaseRegisterAnnexTable: React.FC<
  ITaxPurchaseRegisterAnnexTableProps
> = ({
  summary,
  periodLabel = "Kỳ kê khai",
  isLoading = false,
  filterMissingOnly = false,
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const pageSize = 8;

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Lọc theo từ khóa tìm kiếm (mã hàng, tên hàng, số phiếu, tên NCC, số hóa đơn)
  const filterItem = useCallback(
    (item: ITaxPurchaseRegisterItemResponse) => {
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase().trim();
      return (
        item.productName.toLowerCase().includes(kw) ||
        item.productCode.toLowerCase().includes(kw) ||
        item.receiptNumber.toLowerCase().includes(kw) ||
        (item.supplierInvoiceNumber &&
          item.supplierInvoiceNumber.toLowerCase().includes(kw)) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(kw))
      );
    },
    [searchKeyword]
  );

  // Tập hợp toàn bộ các dòng hàng thỏa mãn điều kiện lọc để phân trang chuẩn xác
  const allFilteredItems = useMemo(() => {
    const list: IExtendedPurchaseItem[] = [];
    let idx = 0;
    const validSuppliers = summary?.validSuppliers || [];
    const unidentifiedSuppliers = summary?.unidentifiedSuppliers;

    // 1. Nhóm các nhà cung cấp hợp lệ (nếu không bật chế độ chỉ lọc chứng từ thiếu NCC)
    if (!filterMissingOnly && validSuppliers.length > 0) {
      validSuppliers.forEach((g, gIdx) => {
        const key = g.supplierId || `supplier-${gIdx}`;
        const matchedItems = (g.items || []).filter(filterItem);
        matchedItems.forEach((item) => {
          list.push({
            ...item,
            groupKey: key,
            isUnidentified: false,
            supplierNameDisplay: g.supplierName,
            supplierTaxCodeDisplay: g.supplierTaxCode,
            groupSubtotalQuantity: g.subtotalQuantity,
            groupSubtotalAmount: g.subtotalAmount,
            groupReceiptCount: g.receiptCount,
            globalIndex: idx++,
          });
        });
      });
    }

    // 2. Nhóm chứng từ thiếu thông tin nhà cung cấp
    if (unidentifiedSuppliers) {
      const matchedItems = (unidentifiedSuppliers.items || []).filter(filterItem);
      matchedItems.forEach((item) => {
        list.push({
          ...item,
          groupKey: "unidentified",
          isUnidentified: true,
          supplierNameDisplay: "CHỨNG TỪ THIẾU THÔNG TIN NHÀ CUNG CẤP",
          supplierTaxCodeDisplay: null,
          groupSubtotalQuantity: unidentifiedSuppliers.subtotalQuantity,
          groupSubtotalAmount: unidentifiedSuppliers.subtotalAmount,
          groupReceiptCount: unidentifiedSuppliers.receiptCount,
          globalIndex: idx++,
        });
      });
    }

    return list;
  }, [summary?.validSuppliers, summary?.unidentifiedSuppliers, filterItem, filterMissingOnly]);

  const totalPages = Math.ceil(allFilteredItems.length / pageSize) || 1;

  // Lấy các dòng hàng cho trang hiện tại (tối đa 8 records)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allFilteredItems.slice(start, start + pageSize);
  }, [allFilteredItems, currentPage, pageSize]);

  // Gom nhóm các dòng hàng của trang hiện tại theo Nhà cung cấp
  const groupsOnCurrentPage = useMemo(() => {
    const map = new Map<string, IGroupDisplayOnPage>();
    for (const item of paginatedItems) {
      if (!map.has(item.groupKey)) {
        map.set(item.groupKey, {
          groupKey: item.groupKey,
          isUnidentified: item.isUnidentified,
          supplierName: item.supplierNameDisplay,
          supplierTaxCode: item.supplierTaxCodeDisplay,
          groupSubtotalQuantity: item.groupSubtotalQuantity,
          groupSubtotalAmount: item.groupSubtotalAmount,
          groupReceiptCount: item.groupReceiptCount,
          totalGroupItemsCount: allFilteredItems.filter(
            (i) => i.groupKey === item.groupKey
          ).length,
          items: [],
        });
      }
      map.get(item.groupKey)!.items.push(item);
    }
    return Array.from(map.values());
  }, [paginatedItems, allFilteredItems]);

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-pulse min-h-[400px]">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
      {/* Header thanh công cụ tìm kiếm và thông tin kỳ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
            <span>Bảng kê hàng hóa, dịch vụ mua vào</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {periodLabel}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng hợp từ các phiếu nhập kho phát sinh trong kỳ, phân nhóm theo Nhà cung cấp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0 stroke-[2.2]" />
            <input
              type="text"
              placeholder="Tìm theo mã hàng, tên hàng, số phiếu..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
            {allFilteredItems.length} dòng hàng
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        {/* Bảng chi tiết */}
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <tr>
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3 w-28">Số phiếu nhập</th>
                <th className="p-3 w-32">Ngày chứng từ</th>
                <th className="p-3 w-32">Số HĐ nhà CC</th>
                <th className="p-3 w-28">Mã hàng</th>
                <th className="p-3">Tên mặt hàng / Quy cách</th>
                <th className="p-3 text-center w-16">ĐVT</th>
                <th className="p-3 text-right w-24">Số lượng</th>
                <th className="p-3 text-right w-28">Đơn giá nhập</th>
                <th className="p-3 text-right w-32">Thành tiền</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allFilteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-8 text-center text-slate-400 italic"
                  >
                    {searchKeyword
                      ? "Không tìm thấy mặt hàng hoặc chứng từ phù hợp với từ khóa."
                      : "Chưa có dữ liệu bảng kê mua vào cho kỳ này."}
                  </td>
                </tr>
              )}

              {/* Render các nhóm hiển thị trên trang hiện tại */}
              {groupsOnCurrentPage.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.groupKey]);

                if (group.isUnidentified) {
                  return (
                    <React.Fragment key={group.groupKey}>
                      {/* Header nhóm chứng từ thiếu NCC */}
                      <tr
                        onClick={() => toggleGroupCollapse(group.groupKey)}
                        className="bg-slate-50 hover:bg-slate-100/80 font-bold text-slate-800 border-t border-b border-slate-200 cursor-pointer select-none transition-colors"
                      >
                        <td
                          colSpan={7}
                          className="p-3 text-slate-800 font-bold text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="p-0.5 rounded text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              {isCollapsed ? (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 stroke-[2]" />
                            <span className="uppercase text-slate-800">
                              CHỨNG TỪ THIẾU THÔNG TIN NHÀ CUNG CẤP
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300">
                              Không đưa vào hồ sơ kê khai
                            </span>
                            <span className="text-[11px] font-normal text-slate-500 ml-auto">
                              {group.groupReceiptCount} phiếu •{" "}
                              {group.totalGroupItemsCount} dòng
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-700">
                          {new Intl.NumberFormat("vi-VN").format(
                            group.groupSubtotalQuantity
                          )}
                        </td>
                        <td className="p-3 text-right text-[10px] uppercase font-semibold text-slate-400">
                          Loại trừ:
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 text-xs">
                          {formatCurrency(group.groupSubtotalAmount)}
                        </td>
                      </tr>

                      {/* Chi tiết từng dòng thiếu NCC */}
                      {!isCollapsed &&
                        group.items.map((item) => (
                          <tr
                            key={item.id || item.globalIndex}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="p-3 text-center text-amber-600 font-medium">
                              {item.globalIndex + 1}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              <span className="inline-flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.receiptNumber}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-normal">
                              {formatDateShort(item.receiptDate)}
                            </td>
                            <td className="p-3 text-slate-400 italic">Thiếu HĐ</td>
                            <td className="p-3 font-mono font-medium text-slate-600 text-[11px]">
                              {item.productCode}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {item.productName}
                            </td>
                            <td className="p-3 text-center text-slate-500 font-normal">
                              {item.unitName || "-"}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-700">
                              {new Intl.NumberFormat("vi-VN").format(
                                item.baseQuantity
                              )}
                            </td>
                            <td className="p-3 text-right text-slate-700 font-normal">
                              {formatCurrency(item.basePurchasePrice)}
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-900">
                              {formatCurrency(item.totalAmount)}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                }

                // Nhóm nhà cung cấp hợp lệ
                return (
                  <React.Fragment key={group.groupKey}>
                    <tr
                      onClick={() => toggleGroupCollapse(group.groupKey)}
                      className="bg-slate-50 hover:bg-slate-100/80 font-bold text-slate-800 border-t border-b border-slate-200 cursor-pointer select-none transition-colors"
                    >
                      <td
                        colSpan={7}
                        className="p-3 text-slate-800 font-bold text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-0.5 rounded text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="uppercase font-bold text-slate-800">
                            {group.supplierName}
                          </span>
                          {group.supplierTaxCode ? (
                            <span className="text-[11px] font-normal text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              MST: <strong>{group.supplierTaxCode}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] font-normal text-slate-400 italic">
                              (Chưa có MST)
                            </span>
                          )}
                          <span className="text-[11px] font-normal text-slate-500 ml-auto">
                            {group.groupReceiptCount} phiếu nhập •{" "}
                            {group.totalGroupItemsCount} dòng hàng
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700">
                        {new Intl.NumberFormat("vi-VN").format(
                          group.groupSubtotalQuantity
                        )}
                      </td>
                      <td className="p-3 text-right text-[10px] uppercase font-semibold text-slate-400">
                        Tổng NCC:
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 text-xs">
                        {formatCurrency(group.groupSubtotalAmount)}
                      </td>
                    </tr>

                    {/* Chi tiết từng dòng hàng của NCC nếu không bị thu gọn */}
                    {!isCollapsed &&
                      group.items.map((item) => (
                        <tr
                          key={item.id || item.globalIndex}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-3 text-center text-slate-400 font-medium">
                            {item.globalIndex + 1}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              {item.receiptNumber}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-normal">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              {formatDateShort(item.receiptDate)}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-normal">
                            {item.supplierInvoiceNumber || (
                              <span className="text-slate-300 italic">-</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-600 text-[11px]">
                            {item.productCode}
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            {item.productName}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-normal">
                            {item.unitName || "-"}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            {new Intl.NumberFormat("vi-VN").format(
                              item.baseQuantity
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-700 font-normal">
                            {formatCurrency(item.basePurchasePrice)}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

              {/* Dòng Tổng cộng Toàn kỳ */}
              {summary && (
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td
                    colSpan={7}
                    className="p-3 text-center uppercase text-xs tracking-wide"
                  >
                    TỔNG CỘNG HÀNG HÓA MUA VÀO TOÀN KỲ
                  </td>
                  <td className="p-3 text-right text-slate-800 font-bold text-xs">
                    {new Intl.NumberFormat("vi-VN").format(
                      summary.grandTotalQuantity
                    )}
                  </td>
                  <td className="p-3 text-right text-[10px] uppercase text-slate-400 font-semibold">
                    Tổng tiền:
                  </td>
                  <td className="p-3 text-right text-slate-900 font-extrabold text-sm">
                    {formatCurrency(summary.grandTotalAmount)}
                  </td>
                </tr>
              )}

              {/* Dòng Chi phí Hợp lệ đủ điều kiện kê khai */}
              {summary && (
                <tr className="bg-white font-semibold text-slate-700 border-t border-slate-100">
                  <td colSpan={7} className="p-3 text-right text-xs">
                    Chi phí đủ điều kiện kê khai thuế (Có đầy đủ thông tin NCC):
                  </td>
                  <td
                    colSpan={3}
                    className="p-3 text-right font-bold text-slate-900 text-sm"
                  >
                    {formatCurrency(summary.eligibleForTaxDeductionAmount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang đồng nhất 8 record */}
        <TablePaginationFooter
          currentPage={currentPage - 1}
          pageSize={pageSize}
          totalElements={allFilteredItems.length}
          totalPages={totalPages}
          onPageChange={(zeroBasedPage) => setCurrentPage(zeroBasedPage + 1)}
          recordUnit="dòng hàng"
        />
      </div>
    </div>
  );
};
