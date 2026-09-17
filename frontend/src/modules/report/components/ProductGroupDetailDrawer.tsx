import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetProductGroupDetailQuery } from "../services/reportApi";

interface ProductGroupDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  fromDate?: string;
  toDate?: string;
}

export const ProductGroupDetailDrawer: React.FC<ProductGroupDetailDrawerProps> = ({
  isOpen,
  onClose,
  groupId,
  fromDate,
  toDate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Lắng nghe phím ESC để đóng Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useGetProductGroupDetailQuery(
    {
      groupId: groupId || "",
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
    {
      skip: !groupId || !isOpen,
      refetchOnMountOrArgChange: true,
    }
  );

  const detailData = apiResponse?.result;
  const items = useMemo(() => detailData?.items || [], [detailData?.items]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.productSku || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Right Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-kv-blue-primary bg-kv-blue-light px-2.5 py-0.5 rounded-full">
                  Chi tiết nhóm hàng
                </span>
                {isFetching && (
                  <Loader2 className="w-3.5 h-3.5 text-kv-blue-primary animate-spin" />
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                {detailData?.groupName || "Đang tải..."}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng doanh thu nhóm:{" "}
                <strong className="text-slate-900 font-bold">
                  {formatCurrency(detailData?.totalRevenue ?? 0)}
                </strong>
                {" • "}
                {items.length} mặt hàng
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Đóng (phím ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mặt hàng trong nhóm..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-kv-blue-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Content Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 mx-auto mb-2 text-kv-blue-primary animate-spin" />
                <p className="text-xs font-medium">Đang tải danh sách mặt hàng...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Không có mặt hàng nào phù hợp</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-3">Mặt hàng</th>
                      <th className="px-3.5 py-3 text-right">SL Bán</th>
                      <th className="px-3.5 py-3 text-right">Doanh thu</th>
                      <th className="px-3.5 py-3 text-right">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {item.productSku || "---"}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                          {item.quantitySold} {item.unit || ""}
                        </td>
                        <td className="px-3.5 py-3 text-right font-black text-slate-900">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold text-kv-blue-primary">
                          {item.percentageInGroup.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Nhấn <kbd className="px-1.5 py-0.5 rounded-xs bg-white border border-slate-200 font-mono text-[10px]">ESC</kbd> để đóng</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
