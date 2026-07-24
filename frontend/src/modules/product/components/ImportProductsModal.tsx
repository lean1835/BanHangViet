import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, Loader2 } from "lucide-react";
import type { IProduct } from "../types/IProduct";

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newProducts: Partial<IProduct>[]) => void;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { showSuccess } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const [step, setStep] = useState<"UPLOAD" | "PARSING" | "PREVIEW">("UPLOAD");
  const [fileName, setFileName] = useState("");

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file.name);
  };

  const processFile = (name: string) => {
    setFileName(name);
    setStep("PARSING");

    setTimeout(() => {
      setStep("PREVIEW");
    }, 1200);
  };

  const handleConfirmImport = () => {
    // 4 valid items parsed from mock file
    const validItems: Partial<IProduct>[] = [
      {
        id: `prod-import-1-${Date.now()}`,
        sku: "SP-008",
        name: "Sữa tươi tiệt trùng TH True Milk 1L",
        unit: "Hộp",
        price: 36000,
        stockQuantity: 50,
        taxRateId: "VAT8",
        taxRatePercentage: 8,
      },
      {
        id: `prod-import-2-${Date.now()}`,
        sku: "SP-009",
        name: "Bánh quy bơ Pháp Lu hộp 200g",
        unit: "Hộp",
        price: 52000,
        stockQuantity: 30,
        taxRateId: "VAT8",
        taxRatePercentage: 8,
      },
      {
        id: `prod-import-3-${Date.now()}`,
        sku: "SP-010",
        name: "Kẹo cao su Doublemint tép 5 lá",
        unit: "Thanh",
        price: 7000,
        stockQuantity: 100,
        taxRateId: "VAT10",
        taxRatePercentage: 10,
      },
      {
        id: `prod-import-4-${Date.now()}`,
        sku: "SP-011",
        name: "Nước giải khát Coca-Cola lon 330ml",
        unit: "Lon",
        price: 10000,
        stockQuantity: 120,
        taxRateId: "VAT10",
        taxRatePercentage: 10,
      },
    ];

    onImportSuccess(validItems);
    showSuccess("Đã nhập thành công 4 mặt hàng hợp lệ vào danh mục sản phẩm!");
    addLogEntry("NHẬP_HÀNG_TỪ_FILE", `Tệp ${fileName || "Danh_muc_hang_hoa.xlsx"}`);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep("UPLOAD");
    setFileName("");
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
                Nhập danh mục hàng hóa từ tệp Excel (CN-005)
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
          {step === "UPLOAD" && (
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
                  Hỗ trợ các định dạng bảng tính .xlsx, .xls, .csv (Dung lượng tối đa 10MB)
                </p>
              </div>

              {/* Sample File Download Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-kv-blue-primary shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Chưa có tệp dữ liệu mẫu?</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Tải về tệp Excel mẫu tiêu chuẩn với các cột Mã hàng, Tên hàng, Đơn giá, Thuế suất
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = "/Mau_Nhap_Danh_Muc_Hang_Hoa.xlsx";
                    link.download = "Mau_Nhap_Danh_Muc_Hang_Hoa.xlsx";
                    link.click();
                    showSuccess("Đã tải tệp Excel mẫu Mau_Nhap_Danh_Muc_Hang_Hoa.xlsx về máy!");
                  }}
                  className="bg-white hover:bg-slate-50 text-kv-blue-primary font-bold px-3.5 h-8 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" /> Tải tệp mẫu
                </button>
              </div>
            </div>
          )}

          {step === "PARSING" && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <div className="font-bold text-slate-800 text-sm">Đang phân tích tệp dữ liệu "{fileName}"...</div>
              <p className="text-slate-400 text-xs font-semibold">
                Hệ thống đang kiểm tra tính hợp lệ của từng dòng sản phẩm và mã số trùng lặp
              </p>
            </div>
          )}

          {step === "PREVIEW" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">
                  Tệp: <span className="font-mono text-kv-blue-primary">{fileName || "Danh_muc_hang.xlsx"}</span>
                </div>
                <div className="flex gap-3 text-[11px] font-bold">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4 dòng hợp lệ
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> 2 dòng bị lỗi
                  </span>
                </div>
              </div>

              {/* Parsed Rows Preview Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Mã SKU</th>
                      <th className="p-2">Tên mặt hàng</th>
                      <th className="p-2 text-right">Đơn giá bán</th>
                      <th className="p-2 text-center">Thuế suất</th>
                      <th className="p-2">Trạng thái xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Row 1 - Valid */}
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-bold">1</td>
                      <td className="p-2 font-mono font-bold text-slate-800">SP-008</td>
                      <td className="p-2 font-bold text-slate-800">Sữa tươi tiệt trùng TH True Milk 1L</td>
                      <td className="p-2 text-right font-bold text-slate-800">36,000 đ</td>
                      <td className="p-2 text-center font-bold">8%</td>
                      <td className="p-2 font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                      </td>
                    </tr>
                    {/* Row 2 - Valid */}
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-bold">2</td>
                      <td className="p-2 font-mono font-bold text-slate-800">SP-009</td>
                      <td className="p-2 font-bold text-slate-800">Bánh quy bơ Pháp Lu hộp 200g</td>
                      <td className="p-2 text-right font-bold text-slate-800">52,000 đ</td>
                      <td className="p-2 text-center font-bold">8%</td>
                      <td className="p-2 font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                      </td>
                    </tr>
                    {/* Row 3 - Error */}
                    <tr className="bg-rose-50/40 text-rose-800">
                      <td className="p-2 font-bold">3</td>
                      <td className="p-2 font-mono font-bold">VT001</td>
                      <td className="p-2 font-bold">Mì tôm Hảo Hảo tôm chua cay</td>
                      <td className="p-2 text-right font-bold">120,000 đ</td>
                      <td className="p-2 text-center font-bold">10%</td>
                      <td className="p-2 font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Lỗi: Mã SKU đã tồn tại (TC-03)
                      </td>
                    </tr>
                    {/* Row 4 - Valid */}
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-bold">4</td>
                      <td className="p-2 font-mono font-bold text-slate-800">SP-010</td>
                      <td className="p-2 font-bold text-slate-800">Kẹo cao su Doublemint tép 5 lá</td>
                      <td className="p-2 text-right font-bold text-slate-800">7,000 đ</td>
                      <td className="p-2 text-center font-bold">10%</td>
                      <td className="p-2 font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                      </td>
                    </tr>
                    {/* Row 5 - Error */}
                    <tr className="bg-rose-50/40 text-rose-800">
                      <td className="p-2 font-bold">5</td>
                      <td className="p-2 font-mono font-bold">SP-012</td>
                      <td className="p-2 font-bold">Nước mắm Nam Ngư 500ml</td>
                      <td className="p-2 text-right font-bold">0 đ</td>
                      <td className="p-2 text-center font-bold">8%</td>
                      <td className="p-2 font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Lỗi: Đơn giá bán rỗng/không hợp lệ (TC-02)
                      </td>
                    </tr>
                    {/* Row 6 - Valid */}
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-bold">6</td>
                      <td className="p-2 font-mono font-bold text-slate-800">SP-011</td>
                      <td className="p-2 font-bold text-slate-800">Nước giải khát Coca-Cola lon 330ml</td>
                      <td className="p-2 text-right font-bold text-slate-800">10,000 đ</td>
                      <td className="p-2 text-center font-bold">10%</td>
                      <td className="p-2 font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => {
              if (step === "PREVIEW") setStep("UPLOAD");
              else onClose();
            }}
            className="px-4 h-9 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs"
          >
            {step === "PREVIEW" ? "Chọn lại tệp khác" : "Hủy bỏ"}
          </button>

          {step === "PREVIEW" && (
            <button
              onClick={handleConfirmImport}
              className="px-5 h-9 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 text-xs shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> Hoàn tất nhập (4 mặt hàng)
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
