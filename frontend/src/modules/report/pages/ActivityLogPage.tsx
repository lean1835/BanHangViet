import { useState } from "react";
import { 
  Activity, 
  Calendar, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  FileText, 
  CheckCircle2, 
  RotateCw, 
  PlusCircle, 
  AlertTriangle,
  Lock
} from "lucide-react";
import { useGetActivityLogsQuery } from "../services/reportApi";
import type { IActivityLogResponse } from "../types/IReport";

export const ActivityLogPage = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const { data, isLoading, isFetching, refetch } = useGetActivityLogsQuery({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    size: pageSize,
  });

  const logsPage = data?.result;
  const logsList: IActivityLogResponse[] = logsPage?.content || [];
  const totalPages = logsPage?.totalPages || 1;
  const totalElements = logsPage?.totalElements || 0;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getTargetTableLabel = (table?: string) => {
    if (!table) return "HỆ THỐNG";
    const t = table.toLowerCase();
    switch (t) {
      case "products": return "Sản phẩm";
      case "product_groups": return "Nhóm hàng";
      case "orders": return "Đơn hàng";
      case "shifts": return "Ca làm việc";
      case "invoices": return "Hóa đơn HĐĐT";
      case "goods_receipts": return "Phiếu nhập hàng";
      case "users":
      case "employees": return "Nhân viên";
      case "reports": return "Báo cáo / Quỹ";
      default: return table.toUpperCase();
    }
  };

  const getActionBadge = (action: string) => {
    const actUpper = (action || "").toUpperCase();
    if (actUpper.includes("CHOT_DOI_CHIEU") || actUpper.includes("LOCK")) {
      return {
        label: "CHỐT ĐỐI CHIẾU NGÀY",
        className: "bg-amber-100 text-amber-800 border-amber-300",
        icon: <Lock className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("OPEN_SHIFT")) {
      return {
        label: "MỞ CA BÁN HÀNG",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <Activity className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("CLOSE_SHIFT")) {
      return {
        label: "ĐÓNG CA BÁN HÀNG",
        className: "bg-purple-100 text-purple-700 border-purple-200",
        icon: <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("DANG_NHAP") || actUpper.includes("LOGIN")) {
      return {
        label: "ĐĂNG NHẬP",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <User className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("SUBMIT_TAX") || actUpper.includes("PHAT_HANH") || actUpper.includes("CREATE_INVOICE")) {
      return {
        label: "GỬI HÓA ĐƠN THUẾ",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("RESEND") || actUpper.includes("GUI_LAI")) {
      return {
        label: "GỬI LẠI HÓA ĐƠN",
        className: "bg-purple-100 text-purple-700 border-purple-200",
        icon: <RotateCw className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("CREATE_ORDER") || actUpper.includes("COMPLETE_ORDER")) {
      return {
        label: actUpper.includes("COMPLETE") ? "HOÀN THÀNH ĐƠN" : "TẠO ĐƠN HÀNG",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("CREATE_GOODS_RECEIPT")) {
      return {
        label: "NHẬP HÀNG",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <PlusCircle className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("TAO") || actUpper.includes("THÊM") || actUpper.includes("CREATE")) {
      return {
        label: action.replace(/_/g, " "),
        className: "bg-sky-100 text-sky-700 border-sky-200",
        icon: <PlusCircle className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("UPDATE") || actUpper.includes("SUA") || actUpper.includes("EDIT")) {
      return {
        label: action.replace(/_/g, " "),
        className: "bg-sky-100 text-sky-700 border-sky-200",
        icon: <RotateCw className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (actUpper.includes("HUY") || actUpper.includes("XOA") || actUpper.includes("DELETE")) {
      return {
        label: action.replace(/_/g, " "),
        className: "bg-rose-100 text-rose-700 border-rose-200",
        icon: <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    return {
      label: action.replace(/_/g, " "),
      className: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <FileText className="w-3 h-3 mr-1 shrink-0" />,
    };
  };

interface IReconciliationDetail {
  date?: string;
  totalCash?: number;
  totalTransfer?: number;
  totalDebt?: number;
  closingCashExpected?: number;
  closingCashActual?: number;
  errorInvoicesCount?: number;
}

interface IParsedLogPayload {
  reconciliation?: IReconciliationDetail;
  notes?: string;
  note?: string;
  date?: string;
  totalCash?: number;
  totalTransfer?: number;
  totalDebt?: number;
  closingCashExpected?: number;
  closingCashActual?: number;
  errorInvoicesCount?: number;
  openingCash?: number;
  name?: string;
  productName?: string;
  sku?: string;
  price?: number;
  sellingPrice?: number;
  costPrice?: number;
  stock?: number;
  unit?: string;
  category?: string;
  code?: string;
  orderCode?: string;
  itemCount?: number;
  itemsCount?: number;
  totalAmount?: number;
  totalPrice?: number;
  finalAmount?: number;
  totalPayment?: number;
  paymentMethod?: string;
  payment_method?: string;
  customerName?: string;
  receiptCode?: string;
  supplierName?: string;
  totalImportAmount?: number;
  groupName?: string;
  productCount?: number;
  productIds?: string[];
  description?: string;
  username?: string;
  fullName?: string;
  role?: string;
  phone?: string;
  invoiceSymbol?: string;
  invoiceNumber?: string;
  status?: string;
}

  const formatVnd = (val: number | string | undefined) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "0 đ";
    return Number(val).toLocaleString("vi-VN") + " đ";
  };

  const parseLogNotes = (log: IActivityLogResponse): React.ReactNode => {
    const rawVal = log.newValue || log.oldValue;
    if (!rawVal) return <span className="text-slate-400 font-normal">-</span>;

    const actionUpper = (log.action || "").toUpperCase();
    const tableLower = (log.targetTable || "").toLowerCase();

    let parsed: IParsedLogPayload | null = null;
    try {
      parsed = JSON.parse(rawVal) as IParsedLogPayload;
    } catch {
      return <span className="text-slate-700 font-medium">{rawVal}</span>;
    }

    if (!parsed || typeof parsed !== "object") {
      return <span className="text-slate-700 font-medium">{String(parsed)}</span>;
    }

    // 1. Chốt đối chiếu ngày (Lock Reconciliation)
    if (actionUpper.includes("CHOT_DOI_CHIEU") || actionUpper.includes("LOCK") || parsed.reconciliation) {
      const r: IReconciliationDetail = (parsed.reconciliation || parsed) as IReconciliationDetail;
      const totalRevenue = Number(r.totalCash || 0) + Number(r.totalTransfer || 0) + Number(r.totalDebt || 0);
      const diff = Number(r.closingCashActual || 0) - Number(r.closingCashExpected || 0);
      const errCount = Number(r.errorInvoicesCount || 0);
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          {r.date && <span className="font-bold text-slate-800">Chốt ngày: {r.date.split("-").reverse().join("/")}</span>}
          <span>Doanh thu: <strong className="text-emerald-700">{formatVnd(totalRevenue)}</strong></span>
          <span className="text-slate-500">
            Tiền mặt: {formatVnd(r.totalCash)} · CK: {formatVnd(r.totalTransfer)} · Nợ: {formatVnd(r.totalDebt)}
          </span>
          <span>
            Quỹ dự kiến: {formatVnd(r.closingCashExpected)} · Thực tế: {formatVnd(r.closingCashActual)}
            {diff !== 0 && (
              <strong className={diff > 0 ? "text-emerald-600 ml-1 font-bold" : "text-rose-600 ml-1 font-bold"}>
                ({diff > 0 ? "+" : ""}{formatVnd(diff)})
              </strong>
            )}
          </span>
          {errCount > 0 && (
            <span className="text-amber-700 font-bold">⚠ {errCount} hóa đơn lỗi</span>
          )}
          {parsed.notes && (
            <span className="text-blue-700 italic">Ghi chú: "{parsed.notes}"</span>
          )}
        </div>
      );
    }

    // 2. Ca làm việc (Shifts)
    if (tableLower === "shifts" || actionUpper.includes("SHIFT") || parsed.openingCash !== undefined) {
      const isClose = actionUpper.includes("CLOSE") || parsed.closingCashActual !== undefined;
      const note = parsed.note || parsed.notes;
      const diff = isClose ? Number(parsed.closingCashActual || 0) - Number(parsed.closingCashExpected || 0) : 0;
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">
            {isClose ? "Đóng ca làm việc" : "Mở ca làm việc"}
          </span>
          <span>Tiền đầu ca: <strong className="text-slate-700">{formatVnd(parsed.openingCash)}</strong></span>
          {isClose && (
            <span>
              Kỳ vọng: {formatVnd(parsed.closingCashExpected)} · Thực tế: <strong className="text-slate-800">{formatVnd(parsed.closingCashActual)}</strong>
              {diff !== 0 && (
                <span className={diff > 0 ? "text-emerald-600 ml-1 font-bold" : "text-rose-600 ml-1 font-bold"}>
                  ({diff > 0 ? "+" : ""}{formatVnd(diff)})
                </span>
              )}
            </span>
          )}
          {note && <span className="text-blue-600 italic">Ghi chú: "{note}"</span>}
        </div>
      );
    }

    // 3. Sản phẩm (Products)
    if (tableLower === "products" || parsed.sku || parsed.sellingPrice !== undefined || parsed.costPrice !== undefined) {
      const name = parsed.name || parsed.productName || "Sản phẩm";
      const sku = parsed.sku ? ` (${parsed.sku})` : "";
      const price = parsed.sellingPrice ?? parsed.price;
      const stock = parsed.stock !== undefined ? `${parsed.stock} ${parsed.unit || ""}`.trim() : null;
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">{name}<span className="text-slate-400 font-mono">{sku}</span></span>
          <div className="flex items-center gap-2 text-slate-600">
            {price !== undefined && <span>Giá bán: <strong className="text-emerald-700">{formatVnd(price)}</strong></span>}
            {stock !== null && <span>· Tồn: <strong className="text-slate-700">{stock}</strong></span>}
          </div>
          {parsed.category && <span className="text-slate-400">Nhóm: {parsed.category}</span>}
        </div>
      );
    }

    // 4. Nhóm sản phẩm (Product Groups)
    if (tableLower === "product_groups" || parsed.groupName || (parsed.name && parsed.productCount !== undefined)) {
      const name = parsed.name || parsed.groupName || "Nhóm hàng";
      const count = parsed.productCount ?? (Array.isArray(parsed.productIds) ? parsed.productIds.length : null);
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">Nhóm hàng: {name}</span>
          {count !== null && <span className="text-slate-600">Số sản phẩm thuộc nhóm: <strong>{count}</strong></span>}
          {parsed.description && <span className="text-slate-400 italic">{parsed.description}</span>}
        </div>
      );
    }

    // 5. Đơn hàng (Orders)
    if (tableLower === "orders" || parsed.orderCode || parsed.totalAmount !== undefined) {
      const code = parsed.orderCode || parsed.code || log.targetId || "Đơn hàng";
      const total = parsed.totalAmount ?? parsed.totalPrice;
      const method = parsed.paymentMethod || parsed.payment_method;
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">Mã đơn: {code}</span>
          {total !== undefined && <span>Tổng tiền: <strong className="text-emerald-700">{formatVnd(total)}</strong></span>}
          <div className="flex items-center gap-2 text-slate-500">
            {method && <span>Thanh toán: <strong className="text-slate-700">{method}</strong></span>}
            {parsed.itemCount !== undefined && <span>· Số lượng: {parsed.itemCount} món</span>}
          </div>
        </div>
      );
    }

    // 6. Phiếu nhập hàng (Goods Receipts)
    if (tableLower === "goods_receipts" || parsed.receiptCode) {
      const code = parsed.receiptCode || parsed.code || "Phiếu nhập";
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">Mã phiếu: {code}</span>
          {parsed.supplierName && <span>Nhà cung cấp: <strong className="text-slate-700">{parsed.supplierName}</strong></span>}
          {parsed.totalAmount !== undefined && <span>Tổng tiền nhập: <strong className="text-emerald-700">{formatVnd(parsed.totalAmount)}</strong></span>}
          {parsed.notes && <span className="text-blue-600 italic">Ghi chú: "{parsed.notes}"</span>}
        </div>
      );
    }

    // 7. Nhân viên (Employees / Users)
    if (tableLower === "users" || tableLower === "employees" || parsed.username) {
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">{parsed.fullName || parsed.username} <span className="text-slate-400 font-mono">(@{parsed.username})</span></span>
          {parsed.role && <span className="text-slate-600">Chức vụ: <strong>{parsed.role}</strong></span>}
        </div>
      );
    }

    // 8. Hóa đơn điện tử (Invoices)
    if (tableLower === "invoices" || parsed.invoiceSymbol || parsed.invoiceNumber) {
      const invStr = [parsed.invoiceSymbol, parsed.invoiceNumber].filter(Boolean).join("-") || "Hóa đơn";
      return (
        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed py-0.5">
          <span className="font-bold text-slate-800">Hóa đơn: {invStr}</span>
          {parsed.customerName && <span>Khách hàng: <strong>{parsed.customerName}</strong></span>}
          {parsed.totalPayment !== undefined && <span>Tổng tiền: <strong className="text-emerald-700">{formatVnd(parsed.totalPayment)}</strong></span>}
          {parsed.status && <span className="text-slate-500">Trạng thái: {parsed.status}</span>}
        </div>
      );
    }

    // 9. Generic JSON parser for any other JSON structure
    const entries: { key: string; val: string }[] = [];
    const keyMap: Record<string, string> = {
      notes: "Ghi chú",
      note: "Ghi chú",
      reason: "Lý do",
      status: "Trạng thái",
      message: "Thông báo",
      name: "Tên",
      code: "Mã",
      amount: "Số tiền",
      total: "Tổng tiền",
      ip: "Địa chỉ IP",
    };

    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== null && v !== undefined && typeof v !== "object") {
        const label = keyMap[k.toLowerCase()] || k;
        let valStr = String(v);
        if (typeof v === "number" && (k.toLowerCase().includes("amount") || k.toLowerCase().includes("price") || k.toLowerCase().includes("total") || k.toLowerCase().includes("cash"))) {
          valStr = formatVnd(v);
        }
        entries.push({ key: label, val: valStr });
      }
    });

    if (entries.length > 0) {
      return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-relaxed py-0.5">
          {entries.map((item, idx) => (
            <span key={idx} className="text-slate-700">
              <span className="text-slate-400 font-medium">{item.key}:</span>{" "}
              <strong className="text-slate-800">{item.val}</strong>
            </span>
          ))}
        </div>
      );
    }

    return <span className="text-slate-700 font-medium">{JSON.stringify(parsed)}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Từ:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
          />
          <span>Đến:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
          />
        </div>

        <div className="flex items-center gap-3">
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(0);
              }}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-kv-blue-primary" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Log Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        <div className="overflow-x-auto flex-1">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-8 h-8 animate-spin text-kv-blue-primary mb-2" />
              <span>Đang tải nhật ký hoạt động...</span>
            </div>
          ) : logsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <Activity className="w-10 h-10 text-slate-300 mb-2" />
              <span>Không tìm thấy nhật ký hoạt động nào phù hợp.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Thao tác / Hành động</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Chi tiết / Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logsList.map((log) => {
                  const badge = getActionBadge(log.action);
                  const notesText = parseLogNotes(log);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Time */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black text-[10px] flex items-center justify-center shrink-0 uppercase border border-slate-200">
                            {log.fullName ? log.fullName.charAt(0) : log.username.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block leading-tight">
                              {log.fullName || log.username}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">
                              @{log.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold border shadow-2xs ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Target Table */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700 font-bold">
                        {getTargetTableLabel(log.targetTable)}
                      </td>

                      {/* Detail / Notes */}
                      <td className="py-3 px-4 text-slate-700 font-medium min-w-[260px]">
                        {notesText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-slate-600 shrink-0">
          <span>
            Hiển thị <span className="text-slate-800">{logsList.length}</span> / {totalElements} bản ghi (Trang {page + 1}/{totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPage;
