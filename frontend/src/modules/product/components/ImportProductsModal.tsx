import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useImportProductsMutation } from "@/modules/product/services/productApi";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { STORAGE_KEYS } from "@/constants/app";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, Loader2 } from "lucide-react";
import type { IProduct } from "../types/IProduct";

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newProducts: Partial<IProduct>[]) => void;
}

interface ImportResultData {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    productName: string;
    errorMessage: string;
  }>;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const [importProducts, { isLoading: isUploading }] = useImportProductsMutation();

  const [step, setStep] = useState<"UPLOAD" | "RESULT">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultData, setResultData] = useState<ImportResultData | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    processUpload(file);
  };

  const processUpload = async (file: File) => {
    try {
      const res = await importProducts(file).unwrap();
      setResultData(res);
      setStep("RESULT");

      if (res.successCount > 0) {
        showSuccess(`Đã xử lý tệp Excel! ${res.successCount}/${res.totalRows} mặt hàng hợp lệ đã được nhập.`);
        addLogEntry("NHẬP_HÀNG_TỪ_FILE", `Tệp ${file.name}`);
        onImportSuccess([]);
      } else {
        showError(`Không có sản phẩm nào được nhập (${res.errorCount} dòng lỗi). Vui lòng kiểm tra lại tệp!`);
      }
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, "Tải lên và xử lý tệp Excel thất bại. Vui lòng kiểm tra định dạng file!");
      showError(errMsg);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/import-template`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Product_Import_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess("Đã tải tệp Excel mẫu tiêu chuẩn từ máy chủ!");
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, "Không thể tải tệp mẫu từ máy chủ.");
      showError(errMsg);
    }
  };

  const resetState = () => {
    setStep("UPLOAD");
    setSelectedFile(null);
    setResultData(null);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-auth-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Nhập danh mục hàng hóa từ tệp Excel
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Tạo nhanh nhiều mặt hàng từ bảng tính Excel theo mẫu quy định
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
          {isUploading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <div className="font-bold text-slate-800 text-sm">
                Đang gửi tệp "{selectedFile?.name}" lên máy chủ phân tích...
              </div>
              <p className="text-slate-400 text-xs font-semibold">
                Máy chủ đang đọc dữ liệu Excel, đối chiếu mã trùng và lưu vào CSDL
              </p>
            </div>
          )}

          {!isUploading && step === "UPLOAD" && (
            <div className="flex flex-col gap-5">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-kv-blue-primary transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="p-3 bg-blue-50 text-kv-blue-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Kéo thả tệp Excel vào đây hoặc <span className="text-kv-blue-primary underline">Chọn tệp từ máy tính</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Hỗ trợ các định dạng bảng tính .xlsx, .xls (Dung lượng tối đa 10MB)
                </p>
              </div>

              {/* Sample File Download Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-kv-blue-primary shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Chưa có tệp dữ liệu mẫu?</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Tải về tệp Excel mẫu tiêu chuẩn với các cột Mã SKU, Tên hàng, Đơn giá, Thuế suất từ Server
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-50 text-kv-blue-primary font-bold px-3.5 h-8 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" /> Tải tệp mẫu
                </button>
              </div>
            </div>
          )}

          {!isUploading && step === "RESULT" && resultData && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">
                  Tệp: <span className="font-mono text-kv-blue-primary">{selectedFile?.name || "DanhMuc.xlsx"}</span>
                </div>
                <div className="flex gap-4 text-[11px] font-bold">
                  <span className="text-slate-600">Tổng: {resultData.totalRows} dòng</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {resultData.successCount} dòng thành công
                  </span>
                  {resultData.errorCount > 0 && (
                    <span className="text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {resultData.errorCount} dòng bị lỗi
                    </span>
                  )}
                </div>
              </div>

              {/* Error Rows Table if any */}
              {resultData.errors.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Danh sách chi tiết các dòng bị lỗi (TC-02, TC-03):
                  </h4>
                  <div className="overflow-x-auto border border-rose-200 rounded-lg max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-rose-50 sticky top-0 border-b border-rose-200 text-rose-800 font-bold">
                        <tr>
                          <th className="p-2 w-20">Dòng thứ</th>
                          <th className="p-2">Tên sản phẩm</th>
                          <th className="p-2">Mô tả chi tiết lỗi từ máy chủ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 font-medium">
                        {resultData.errors.map((errItem, idx) => (
                          <tr key={idx} className="bg-rose-50/40 text-rose-900">
                            <td className="p-2 font-mono font-bold text-rose-700">Dòng {errItem.rowNumber}</td>
                            <td className="p-2 font-bold">{errItem.productName || "—"}</td>
                            <td className="p-2 font-semibold text-rose-600">{errItem.errorMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center flex flex-col items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  <div className="font-extrabold text-sm">Tất cả {resultData.totalRows} dòng dữ liệu đã được nhập thành công vào CSDL!</div>
                  <p className="text-xs font-semibold text-emerald-600">
                    Danh mục sản phẩm hiện tại đã được cập nhật tự động.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => {
              if (step === "RESULT") setStep("UPLOAD");
              else {
                onClose();
                resetState();
              }
            }}
            className="px-4 h-9 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs"
          >
            {step === "RESULT" ? "Chọn tệp khác" : "Đóng"}
          </button>

          {step === "RESULT" && (
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="px-5 h-9 rounded-lg font-bold bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors flex items-center gap-1.5 text-xs shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
