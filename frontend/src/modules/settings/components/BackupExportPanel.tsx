import React, { useState } from "react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { useNotification } from "@/hooks/useNotification";
import { STORAGE_KEYS } from "@/constants/app";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { Download, Database, ShieldAlert, CheckCircle2, Loader2, Calendar } from "lucide-react";

export const BackupExportPanel: React.FC = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [scopes, setScopes] = useState({
    products: true,
    orders: true,
    invoices: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // TC-03: Block Cashier (VT-02)
  if (currentRole === USER_ROLES.CASHIER) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-lg mx-auto my-6">
        <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-base mb-1">
          Giới hạn quyền truy cập sao lưu
        </h3>
        <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
          Chức năng xuất và sao lưu dữ liệu chỉ dành cho vai trò <strong>Chủ hộ kinh doanh</strong> và <strong>Kế toán</strong>. Vai trò của bạn ({ROLE_LABELS[currentRole]}) không được phép sử dụng tính năng này.
        </p>
      </div>
    );
  }

  const handleExport = async () => {
    const selectedScopes = Object.entries(scopes)
      .filter(([, val]) => val)
      .map(([key]) => key);

    if (selectedScopes.length === 0) {
      showError("Vui lòng chọn ít nhất một phạm vi dữ liệu cần xuất!");
      return;
    }

    // Map scope selection to Backend BackupType
    let type = "FULL";
    if (scopes.products && !scopes.invoices && !scopes.orders) {
      type = "PRODUCTS";
    } else if (scopes.invoices && !scopes.products && !scopes.orders) {
      type = "INVOICES";
    }

    // Calculate fromDate and toDate
    const now = new Date();
    let fromDateStr: string | undefined;
    let toDateStr: string | undefined = now.toISOString().split("T")[0];

    if (dateRange === "TODAY") {
      fromDateStr = toDateStr;
    } else if (dateRange === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      fromDateStr = firstDay.toISOString().split("T")[0];
    } else if (dateRange === "LAST_3_MONTHS") {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      fromDateStr = threeMonthsAgo.toISOString().split("T")[0];
    } else {
      // ALL
      fromDateStr = undefined;
      toDateStr = undefined;
    }

    setIsExporting(true);

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const queryParams = new URLSearchParams({ type });
      if (fromDateStr) queryParams.append("fromDate", fromDateStr);
      if (toDateStr) queryParams.append("toDate", toDateStr);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/backup/export?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const defaultExt = type === "FULL" ? "zip" : "xlsx";
      let filename = `BanHangViet_Backup_${type}_${now.toISOString().split("T")[0]}.${defaultExt}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess("Tạo tệp sao lưu thành công! Tệp tin đang được tải xuống.");
      addLogEntry("XUẤT_SAO_LƯU_DỮ_LIỆU", `Phạm vi: ${type} (${dateRange})`);
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Không thể tải tệp sao lưu từ máy chủ. Vui lòng thử lại sau!"
      );
      showError(errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const isZipExport = (scopes.products && (scopes.invoices || scopes.orders)) || (scopes.invoices && scopes.orders);

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight">
              Xuất và sao lưu dữ liệu hộ kinh doanh
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Tải về tệp dữ liệu sao lưu danh mục hàng hóa, đơn hàng và hóa đơn (CN-006)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 text-xs font-semibold text-slate-700">
          {/* Date range picker */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Khoảng thời gian sao lưu:
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-slate-300 h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold bg-white text-xs max-w-md"
            >
              <option value="TODAY">Hôm nay</option>
              <option value="THIS_MONTH">Tháng này (Từ đầu tháng)</option>
              <option value="LAST_3_MONTHS">3 Tháng gần nhất</option>
              <option value="ALL">Tất cả thời gian</option>
            </select>
          </div>

          {/* Scope selection */}
          <div className="flex flex-col gap-2.5 pt-2">
            <label className="font-bold text-slate-800">
              Phạm vi dữ liệu sao lưu: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.products}
                  onChange={(e) => setScopes({ ...scopes, products: e.target.checked })}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <span className="font-bold">Danh mục Hàng hóa sản phẩm</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.orders}
                  onChange={(e) => setScopes({ ...scopes, orders: e.target.checked })}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <span className="font-bold">Lịch sử Đơn bán hàng (Orders)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={scopes.invoices}
                  onChange={(e) => setScopes({ ...scopes, invoices: e.target.checked })}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <span className="font-bold">Danh sách Hóa đơn thuế GTGT</span>
              </label>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex gap-2.5 text-amber-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              {isZipExport
                ? "Tệp sao lưu nén (.zip) chứa 2 bản Excel (.xlsx) độc lập được xuất trực tiếp từ CSDL giúp bạn lưu trữ hoặc đối chiếu sổ sách kinh doanh."
                : "Tệp sao lưu Excel (.xlsx) định dạng chuẩn được xuất trực tiếp từ CSDL giúp bạn lưu trữ độc lập hoặc đối chiếu sổ sách kinh doanh."}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-6 h-10 rounded-lg transition-colors flex items-center gap-2 text-xs shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo tệp sao lưu từ máy chủ...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Tải về tệp sao lưu ({isZipExport ? ".zip" : ".xlsx"})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
