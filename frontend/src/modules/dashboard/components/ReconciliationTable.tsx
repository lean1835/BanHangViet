import { useState } from "react";
import { useGetShiftsHistoryQuery } from "@/modules/shift/services/shiftApi";
import { useNotification } from "@/hooks/useNotification";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";

interface ReconciliationTableProps {
  invoices: IInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<IInvoice[]>>;
  addLogEntry: (action: string, target: string) => void;
}

export const ReconciliationTable = ({
  invoices,
  setInvoices,
  addLogEntry,
}: ReconciliationTableProps) => {
  const [activeTab, setActiveTab] = useState<"shifts" | "failedInvoices">("shifts");
  const { showSuccess } = useNotification();

  // Query shifts history
  const { data: shiftsHistoryData, isLoading: isShiftsLoading } = useGetShiftsHistoryQuery();
  const dbShifts = shiftsHistoryData?.result || [];

  // Shifts list (db or fallback)
  const shiftsList = dbShifts.length > 0 ? dbShifts : [
    {
      id: "s-00124",
      fullName: "Nguyễn Văn Bán",
      username: "nhanvien_viet",
      openingCash: 1000000,
      closingCashExpected: 3500000,
      closingCashActual: 3500000,
      differenceAmount: 0,
      status: "CLOSED",
    },
    {
      id: "s-00123",
      fullName: "Nguyễn Văn Bán",
      username: "nhanvien_viet",
      openingCash: 1000000,
      closingCashExpected: 2800000,
      closingCashActual: 2750000,
      differenceAmount: -50000,
      status: "CLOSED",
    },
    {
      id: "s-00122",
      fullName: "Chủ Hộ Việt",
      username: "chuho_viet",
      openingCash: 2000000,
      closingCashExpected: null,
      closingCashActual: null,
      differenceAmount: null,
      status: "OPEN",
    }
  ];

  // Failed invoices list (from context or fallback)
  const contextFailedInvoices = invoices.filter(
    (inv) => inv.status === E_INVOICE_STATUS.SEND_ERROR
  );

  const [failedInvoices, setLocalFailedInvoices] = useState<any[]>(() => {
    if (contextFailedInvoices.length > 0) return contextFailedInvoices;
    return [
      {
        id: "inv-failed-1",
        lookupCode: "HD-VT009",
        symbol: "1C26TAA",
        customer: "Lê Văn C",
        finalAmount: 450000,
        time: "2026-07-22 10:15:30",
        errorDetails: "Lỗi kết nối CQT (Mã lỗi: 901)",
        status: E_INVOICE_STATUS.SEND_ERROR,
      },
      {
        id: "inv-failed-2",
        lookupCode: "HD-VT010",
        symbol: "1C26TAA",
        customer: "Khách vãng lai",
        finalAmount: 85000,
        time: "2026-07-22 11:20:12",
        errorDetails: "MST người bán không hợp lệ (Mã lỗi: 902)",
        status: E_INVOICE_STATUS.SEND_ERROR,
      }
    ];
  });

  const handleResend = (id: string, lookupCode: string) => {
    // Simulate successful resend
    setLocalFailedInvoices((prev) => prev.filter((item) => item.id !== id));
    showSuccess(`Đã gửi lại hóa đơn ${lookupCode} thành công lên cơ quan thuế!`);
    addLogEntry("GỬI_LẠI_HÓA_ĐƠN", `Hóa đơn lỗi ${lookupCode}`);

    // If it is in the global state, update its status
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) =>
        inv.id === id ? { ...inv, status: E_INVOICE_STATUS.ISSUED } : inv
      )
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[380px]">
      {/* Tabs Header */}
      <div className="bg-slate-50 border-b border-slate-200 flex justify-between items-center px-4 shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("shifts")}
            className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all ${
              activeTab === "shifts"
                ? "border-kv-blue-primary text-kv-blue-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Đối chiếu tiền cuối ngày
          </button>
          <button
            onClick={() => setActiveTab("failedInvoices")}
            className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "failedInvoices"
                ? "border-kv-blue-primary text-kv-blue-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Hóa đơn gửi lỗi
            {failedInvoices.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {failedInvoices.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "shifts" ? (
          <div className="w-full h-full">
            {isShiftsLoading ? (
              <div className="text-center text-slate-400 py-10 text-xs font-medium">Đang tải ca làm việc...</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2 px-3">Mã ca</th>
                    <th className="py-2 px-3">Nhân viên</th>
                    <th className="py-2 px-3 text-right">Tiền đầu ca</th>
                    <th className="py-2 px-3 text-right">Doanh thu dự kiến</th>
                    <th className="py-2 px-3 text-right">Thực tế bàn giao</th>
                    <th className="py-2 px-3 text-right">Chênh lệch</th>
                    <th className="py-2 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiftsList.map((shift: any) => {
                    const diff = shift.differenceAmount ?? 0;
                    return (
                      <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{shift.id}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {shift.fullName || shift.username}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                          {formatCurrency(shift.openingCash)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                          {shift.closingCashExpected !== null
                            ? formatCurrency(shift.closingCashExpected - shift.openingCash)
                            : "--"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                          {shift.closingCashActual !== null
                            ? formatCurrency(shift.closingCashActual)
                            : "--"}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-extrabold ${
                            diff < 0
                              ? "text-rose-500"
                              : diff > 0
                              ? "text-kv-green"
                              : "text-slate-600"
                          }`}
                        >
                          {diff !== 0 ? formatCurrency(diff) : "0 đ"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              shift.status === "OPEN"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : diff !== 0
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {shift.status === "OPEN"
                              ? "Đang mở"
                              : diff !== 0
                              ? "Lệch tiền"
                              : "Khớp tiền"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            {failedInvoices.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs font-semibold">
                Không có hóa đơn gửi lỗi nào cần xử lý.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2 px-3">Mã hóa đơn</th>
                    <th className="py-2 px-3">Khách hàng</th>
                    <th className="py-2 px-3 text-right">Tổng tiền</th>
                    <th className="py-2 px-3">Ngày tạo</th>
                    <th className="py-2 px-3">Chi tiết lỗi</th>
                    <th className="py-2 px-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.lookupCode}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{inv.customer}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-bold">
                        {formatCurrency(inv.finalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">{inv.time}</td>
                      <td className="py-2.5 px-3 text-rose-500 font-semibold truncate max-w-[200px]" title={inv.errorDetails}>
                        {inv.errorDetails || "Lỗi truyền nhận"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleResend(inv.id, inv.lookupCode)}
                          className="bg-kv-blue-primary text-white border-none py-1 px-3.5 text-[11px] font-bold rounded hover:bg-kv-blue-dark transition-colors"
                        >
                          Gửi lại
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
