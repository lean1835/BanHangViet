import React, { useState } from "react";
import type { ISupplier } from "../types/supplier";
import { useGetSupplierPaymentsQuery } from "../services/supplierApi";

interface SupplierDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: ISupplier | null;
  onEdit: (supplier: ISupplier) => void;
  onOpenPayModal: (supplier: ISupplier) => void;
}

export const SupplierDetailDrawer: React.FC<SupplierDetailDrawerProps> = ({
  isOpen,
  onClose,
  supplier,
  onEdit,
  onOpenPayModal,
}) => {
  const [activeTab, setActiveTab] = useState<"INFO" | "PAYMENTS" | "RECEIPTS">("INFO");

  const { data: payments = [] } = useGetSupplierPaymentsQuery(supplier?.id || "", {
    skip: !supplier?.id,
  });

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-auth-fade-in">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 bg-slate-800 text-white flex items-center justify-between">
          <div>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded font-mono font-semibold text-slate-300">
              {supplier.code}
            </span>
            <h2 className="text-lg font-extrabold mt-1">{supplier.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết nhà cung cấp"
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(supplier)}
              className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Sửa thông tin
            </button>
          </div>
          {supplier.currentDebt > 0 && (
            <button
              type="button"
              onClick={() => onOpenPayModal(supplier)}
              className="px-3 h-8 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Thanh toán nợ
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-600 px-5">
          <button
            type="button"
            onClick={() => setActiveTab("INFO")}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === "INFO"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PAYMENTS")}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === "PAYMENTS"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Lịch sử thanh toán nợ ({payments.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 font-semibold">
          {activeTab === "INFO" && (
            <div className="space-y-6">
              {/* Financial Highlight Box */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nợ cần trả</span>
                  <span className="text-sm font-extrabold text-rose-600">
                    {supplier.currentDebt.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tổng mua</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {supplier.totalPurchase.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      supplier.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {supplier.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs border-b pb-1 uppercase tracking-wide">
                  Thông tin liên hệ & Công ty
                </h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-slate-400 block">Số điện thoại:</span>
                    <span className="text-slate-800 font-bold">{supplier.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email:</span>
                    <span className="text-slate-800">{supplier.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nhóm NCC:</span>
                    <span className="text-slate-800 font-bold">{supplier.groupName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mã số thuế:</span>
                    <span className="text-slate-800 font-mono">{supplier.taxCode || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Địa chỉ:</span>
                    <span className="text-slate-800">{supplier.address || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Ghi chú:</span>
                    <span className="text-slate-800 italic">{supplier.notes || "Không có ghi chú"}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400">
                <p>Ngày tạo: {new Date(supplier.createdAt).toLocaleString("vi-VN")}</p>
                {supplier.createdByUserName && <p>Người tạo: {supplier.createdByUserName}</p>}
              </div>
            </div>
          )}

          {activeTab === "PAYMENTS" && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">Chưa có lịch sử thanh toán nợ nào.</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Mã phiếu</th>
                        <th className="p-2.5">Ngày trả</th>
                        <th className="p-2.5">Số tiền</th>
                        <th className="p-2.5">Hình thức</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-kv-blue-primary">{p.paymentCode}</td>
                          <td className="p-2.5">{new Date(p.paymentDate).toLocaleDateString("vi-VN")}</td>
                          <td className="p-2.5 font-bold text-emerald-600">
                            {p.amount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="p-2.5">
                            {p.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
