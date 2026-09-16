import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IProductGroupValuation } from "../types/IInventoryValuation";

interface InventoryValuationGroupTableProps {
  groups: IProductGroupValuation[];
  selectedGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
  defaultCollapsed?: boolean;
  pageSize?: number;
}

export const InventoryValuationGroupTable: React.FC<
  InventoryValuationGroupTableProps
> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  defaultCollapsed = false,
  pageSize = 8,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [currentPage, setCurrentPage] = useState(0);

  const totalElements = groups.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const paginatedGroups = useMemo(() => {
    const start = currentPage * pageSize;
    return groups.slice(start, start + pageSize);
  }, [groups, currentPage, pageSize]);

  // Giá trị vốn thực tế của từng nhóm (quy tắc kho: nhóm âm kho có vốn đọng = 0 đ)
  const getGroupValuation = (g: IProductGroupValuation) => {
    if ((g.totalStockQuantity || 0) < 0 && (g.totalInventoryValue || 0) <= 0) return 0;
    return Math.max(0, g.totalInventoryValue || 0);
  };

  const getGroupRetail = (g: IProductGroupValuation) => {
    if ((g.totalStockQuantity || 0) < 0 && (g.totalRetailValue || 0) <= 0) return 0;
    return Math.max(0, g.totalRetailValue || 0);
  };

  const totalValuation = groups.reduce(
    (sum, g) => sum + getGroupValuation(g),
    0
  );

  // Tổng vốn của các nhóm dương để tính tỷ trọng an toàn và chính xác ngay cả khi có nhóm bị âm kho
  const totalPositiveValuation = useMemo(() => {
    const sumPositive = groups
      .map(getGroupValuation)
      .reduce((sum, v) => sum + v, 0);
    return sumPositive > 0 ? sumPositive : Math.abs(totalValuation);
  }, [groups, totalValuation]);

  const totalItems = groups.reduce((sum, g) => sum + (g.productCount || 0), 0);
  const totalStock = groups.reduce(
    (sum, g) => sum + (g.totalStockQuantity || 0),
    0
  );
  const totalRetail = groups.reduce(
    (sum, g) => sum + getGroupRetail(g),
    0
  );

  const selectedGroupName = groups.find(
    (g) => g.groupId === selectedGroupId
  )?.groupName;

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">
                Cơ Cấu Giá Trị Tồn Kho Theo Nhóm Hàng
              </h3>
              {selectedGroupId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Đang lọc: {selectedGroupName || "Nhóm đã chọn"}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGroup?.("");
                    }}
                    className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Bỏ lọc nhóm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Phân tích tỷ trọng dòng tiền vốn theo từng ngành hàng (nhấp để lọc mặt hàng)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {groups.length} nhóm
            </span>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1"
              title={isCollapsed ? "Mở rộng bảng nhóm hàng" : "Thu gọn bảng nhóm hàng"}
            >
              {isCollapsed ? (
                <>
                  <span>Mở rộng</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Thu gọn</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsed Summary */}
        {isCollapsed ? (
          <div
            onClick={() => setIsCollapsed(false)}
            className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-200 flex items-center justify-between cursor-pointer text-xs transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-600">
                Tổng cộng <strong>{groups.length}</strong> nhóm ngành hàng
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-blue-700">
                Tổng vốn: {formatCurrency(totalValuation)}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Tồn: <strong>{formatNumber(totalStock)}</strong> sp
              </span>
            </div>
            <span className="text-blue-600 font-bold text-[11px] flex items-center gap-1">
              Nhấp để xem chi tiết nhóm hàng <ChevronDown className="h-3.5 w-3.5" />
            </span>
          </div>
        ) : (
          /* Expanded Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Nhóm hàng</th>
                  <th className="p-3 text-center">Số mặt hàng</th>
                  <th className="p-3 text-right">Tổng số lượng tồn</th>
                  <th className="p-3 text-right font-extrabold text-blue-700">
                    Tổng vốn tồn kho (đ)
                  </th>
                  <th className="p-3 w-44">Tỷ trọng vốn (%)</th>
                  <th className="p-3 text-right">Tổng giá trị bán (đ)</th>
                  <th className="p-3 text-center">Ngày tồn TB</th>
                  {onSelectGroup && <th className="p-3 w-20 text-center">Lọc</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedGroups.map((grp, idx) => {
                  const isSelected = selectedGroupId === grp.groupId;
                  const grpValue = grp.totalInventoryValue || 0;
                  const pct =
                    grp.valuePercentage && grp.valuePercentage > 0
                      ? grp.valuePercentage
                      : grpValue > 0 && totalPositiveValuation > 0
                      ? Math.round((grpValue / totalPositiveValuation) * 10000) / 100
                      : 0;

                  return (
                    <tr
                      key={grp.groupId || `unassigned-${idx}`}
                      onClick={() => onSelectGroup && onSelectGroup(grp.groupId || "")}
                      className={`transition-all ${
                        isSelected
                          ? "bg-blue-50/70 border-l-4 border-l-blue-600"
                          : "hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <td className="p-3 text-center text-slate-400 font-bold">
                        {currentPage * pageSize + idx + 1}
                      </td>

                      <td className="p-3">
                        <span className="font-extrabold text-slate-800 block text-xs">
                          {grp.groupName || "Chưa phân nhóm"}
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-600">
                        {formatNumber(grp.productCount)}
                      </td>

                      {/* Tổng số lượng tồn */}
                      <td className="p-3 text-right font-semibold">
                        {(grp.totalStockQuantity || 0) < 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-rose-600 font-bold">
                              {formatNumber(grp.totalStockQuantity)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Âm kho
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700">
                            {formatNumber(grp.totalStockQuantity)}
                          </span>
                        )}
                      </td>

                      {/* Tổng vốn tồn kho */}
                      <td className="p-3 text-right">
                        {(grp.totalStockQuantity || 0) < 0 && (grp.totalInventoryValue || 0) <= 0 ? (
                          <div>
                            <span className="font-bold text-slate-400">0 đ</span>
                            <span className="block text-[10px] text-rose-500 font-medium">Tồn âm (0 đ)</span>
                          </div>
                        ) : (
                          <span className="font-black text-blue-700">
                            {formatCurrency(grp.totalInventoryValue)}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-700 w-10 text-right">
                            {formatNumber(pct)}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-right text-slate-600 font-semibold">
                        {(grp.totalStockQuantity || 0) < 0 && (grp.totalRetailValue || 0) <= 0
                          ? "0 đ"
                          : formatCurrency(grp.totalRetailValue)}
                      </td>

                      <td className="p-3 text-center text-slate-700 font-medium">
                        {formatNumber(grp.averageDaysInStock || 0)} ngày
                      </td>

                      {onSelectGroup && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGroup(isSelected ? "" : grp.groupId || "");
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-kv-blue-primary text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            title={
                              isSelected ? "Bỏ lọc nhóm này" : "Lọc danh sách theo nhóm"
                            }
                          >
                            {isSelected ? "Đang lọc" : "Lọc"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {groups.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Chưa có số liệu phân tích nhóm hàng.
                    </td>
                  </tr>
                )}
              </tbody>
              {groups.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-extrabold text-slate-800">
                    <td colSpan={2} className="p-3 text-right uppercase text-[11px]">
                      Tổng Cộng Toàn Kho:
                    </td>
                    <td className="p-3 text-center font-black">
                      {formatNumber(totalItems)}
                    </td>
                    <td className="p-3 text-right font-black">
                      {formatNumber(totalStock)}
                    </td>
                    <td className="p-3 text-right font-black text-blue-700 text-sm">
                      {formatCurrency(totalValuation)}
                    </td>
                    <td className="p-3 font-black text-slate-700">100%</td>
                    <td className="p-3 text-right font-black text-slate-700">
                      {formatCurrency(totalRetail)}
                    </td>
                    <td colSpan={2} className="p-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {!isCollapsed && totalElements > 0 && (
        <TablePaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          recordUnit="nhóm hàng"
        />
      )}
    </div>
  );
};

export default InventoryValuationGroupTable;
