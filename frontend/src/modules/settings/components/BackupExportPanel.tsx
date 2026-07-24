import React, { useState } from "react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { useNotification } from "@/hooks/useNotification";
import { Download, Database, ShieldAlert, CheckCircle2, Loader2, Calendar } from "lucide-react";

export const BackupExportPanel: React.FC = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [scopes, setScopes] = useState({
    products: true,
    orders: true,
    invoices: true,
    logs: false,
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

  const handleExport = () => {
    const selectedScopes = Object.entries(scopes)
      .filter(([, val]) => val)
      .map(([key]) => key);

    if (selectedScopes.length === 0) {
      showError("Vui lòng chọn ít nhất một phạm vi dữ liệu cần xuất!");
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showSuccess("Tạo tệp sao lưu thành công! Tệp tin đang được tải xuống.");
      addLogEntry("XUẤT_SAO_LƯU_DỮ_LIỆU", `Phạm vi: ${selectedScopes.join(", ")}`);

      // Simulate downloading a mock json backup file
      const backupData = {
        exportedAt: new Date().toISOString(),
        household: "BÁN HÀNG VIỆT",
        scope: selectedScopes,
        dataVersion: "1.0",
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BanHangViet_Backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }, 1500);
  };

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

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.invoices}
                  onChange={(e) => setScopes({ ...scopes, invoices: e.target.checked })}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <span className="font-bold">Danh sách Hóa đơn thuế GTGT</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.logs}
                  onChange={(e) => setScopes({ ...scopes, logs: e.target.checked })}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <span className="font-bold">Nhật ký thao tác hệ thống (Audit Logs)</span>
              </label>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex gap-2.5 text-amber-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              Tệp sao lưu mã hóa định dạng chuẩn giúp bạn dễ dàng lưu trữ độc lập hoặc đối chiếu sổ sách kinh doanh bất kỳ lúc nào.
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang khởi tạo tệp sao lưu...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Tải về tệp sao lưu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
