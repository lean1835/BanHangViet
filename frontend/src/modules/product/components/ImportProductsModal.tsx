import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  useImportProductsMutation,
  useGetProductsQuery,
  useLazyDownloadProductImportTemplateQuery,
} from "@/modules/product/services/productApi";
import { useGetTaxRatesQuery } from "@/modules/settings/services/taxRateApi";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import type { IProduct } from "../types/IProduct";

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newProducts: Partial<IProduct>[]) => void;
}

export interface IProductPreviewRow {
  id: string;
  rowNumber: number;
  sku: string;
  name: string;
  unit: string;
  sellingPrice: number | string;
  taxRatePercentage: number | string;
  groupName: string;
  initialStock: number | string;
  status: "SUCCESS" | "ERROR";
  errorMessage?: string;
  isSelected?: boolean;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const [importProducts, { isLoading: isSubmitting }] = useImportProductsMutation();
  const [triggerDownloadTemplate] = useLazyDownloadProductImportTemplateQuery();

  // Query existing products for client-side SKU duplication check across full catalog (up to 1000 items)
  const { data: existingProductsData } = useGetProductsQuery({ size: 1000 }, { skip: !isOpen });
  const existingProducts = useMemo(
    () => existingProductsData?.content || [],
    [existingProductsData]
  );

  // Pre-build Set for O(1) DB SKU lookup
  const existingSkuSet = useMemo(() => {
    const set = new Set<string>();
    existingProducts.forEach((p) => {
      if (p.sku) set.add(p.sku.trim().toLowerCase());
    });
    return set;
  }, [existingProducts]);

  // Query active tax rates for household
  const { data: taxRatesData = [] } = useGetTaxRatesQuery(undefined, { skip: !isOpen });
  const activeTaxRates = useMemo(
    () => taxRatesData.filter((tr) => tr.isActive),
    [taxRatesData]
  );

  const [step, setStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<IProductPreviewRow[]>([]);

  const hasPreviewRows = previewRows.length > 0;

  // Re-validate preview rows when existingSkuSet or activeTaxRates updates
  useEffect(() => {
    if (hasPreviewRows) {
      setPreviewRows((prev) =>
        prev.map((row, _, arr) => validateRow(row, arr, existingSkuSet, activeTaxRates))
      );
    }
  }, [existingSkuSet, activeTaxRates, hasPreviewRows]);

  const validateRow = (
    row: IProductPreviewRow,
    allRows: IProductPreviewRow[],
    skuSet: Set<string>,
    activeTaxList: { ratePercentage: number }[]
  ): IProductPreviewRow => {
    const sku = (row.sku || "").trim();
    const name = (row.name || "").trim();
    const unit = (row.unit || "").trim();
    const sellingPriceNum = Number(row.sellingPrice);

    let isError = false;
    let errorMessage = "";

    if (!sku) {
      isError = true;
      errorMessage = "Mã SKU không được để trống";
    } else {
      // Check duplicate against existing DB products in O(1)
      if (skuSet.has(sku.toLowerCase())) {
        isError = true;
        errorMessage = `Mã hàng (SKU) '${sku}' đã tồn tại trong hộ kinh doanh`;
      } else {
        // Check duplicate within file rows
        const duplicateInFile = allRows.some(
          (r) => r.id !== row.id && (r.sku || "").trim().toLowerCase() === sku.toLowerCase()
        );
        if (duplicateInFile) {
          isError = true;
          errorMessage = `Mã hàng (SKU) '${sku}' bị trùng lặp trong tệp Excel`;
        }
      }
    }

    if (!isError && !name) {
      isError = true;
      errorMessage = "Tên sản phẩm không được để trống";
    }

    if (!isError && !unit) {
      isError = true;
      errorMessage = "Đơn vị tính không được để trống";
    }

    if (!isError && (row.sellingPrice === "" || row.sellingPrice === null || row.sellingPrice === undefined)) {
      isError = true;
      errorMessage = "Giá bán không được để trống";
    } else if (!isError && (isNaN(sellingPriceNum) || sellingPriceNum <= 0)) {
      isError = true;
      errorMessage = "Giá bán phải là số lớn hơn 0";
    }

    // Tax Rate validation against DB
    if (!isError) {
      const rawTax = String(row.taxRatePercentage || "").trim();
      if (!rawTax) {
        if (activeTaxList.length === 0) {
          isError = true;
          errorMessage = "Chưa cấu hình danh mục thuế suất cho hộ kinh doanh";
        }
      } else {
        const cleanStr = rawTax.replace("%", "").replace(",", ".").trim();
        const numVal = parseFloat(cleanStr);
        if (isNaN(numVal)) {
          isError = true;
          errorMessage = "Mức thuế suất không đúng định dạng số";
        } else if (activeTaxList.length > 0) {
          const found = activeTaxList.some(
            (tr) =>
              Math.abs(tr.ratePercentage - numVal) < 0.001 ||
              Math.abs(tr.ratePercentage - numVal * 100) < 0.001
          );
          if (!found) {
            isError = true;
            errorMessage = `Không tìm thấy thuế suất (${rawTax}) trong danh mục thuế suất của hộ kinh doanh`;
          }
        }
      }
    }

    return {
      ...row,
      status: isError ? "ERROR" : "SUCCESS",
      errorMessage: isError ? errorMessage : undefined,
    };
  };

  interface ParseExcelResult {
    rows: IProductPreviewRow[];
    missingColumns: string[];
  }

  const parseExcelPreview = (file: File): Promise<ParseExcelResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          if (!buffer) return resolve({ rows: [], missingColumns: [] });
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) return resolve({ rows: [], missingColumns: [] });
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = (XLSX.utils.sheet_to_json(worksheet, { defval: "" }) || []) as Record<string, unknown>[];

          if (rawRows.length === 0) {
            return resolve({ rows: [], missingColumns: [] });
          }

          // Validate required column headers
          const availableHeaders = Object.keys(rawRows[0]);
          const requiredSpecs = [
            { name: "Mã SKU", keys: ["sku", "mã"] },
            { name: "Tên hàng hóa", keys: ["tên hàng", "tên sp", "sản phẩm", "tên"] },
            { name: "Đơn vị tính", keys: ["đơn vị", "dvt"] },
            { name: "Giá bán", keys: ["giá bán", "bán"] },
          ];

          const missingColumns = requiredSpecs
            .filter((spec) => {
              return !availableHeaders.some((header) => {
                const cleanHeader = header.trim().toLowerCase();
                return spec.keys.some((k) => cleanHeader === k.toLowerCase() || cleanHeader.includes(k.toLowerCase()));
              });
            })
            .map((spec) => spec.name);

          const rows: IProductPreviewRow[] = rawRows.map((rawRow, index) => {
            const findVal = (...keys: string[]): string => {
              // Pass 1: Exact match (case-insensitive)
              for (const k of Object.keys(rawRow)) {
                const cleanKey = k.trim().toLowerCase();
                if (keys.some((key) => cleanKey === key.toLowerCase())) {
                  return String(rawRow[k] ?? "").trim();
                }
              }
              // Pass 2: Fallback substring match
              for (const k of Object.keys(rawRow)) {
                const cleanKey = k.trim().toLowerCase();
                if (keys.some((key) => cleanKey.includes(key.toLowerCase()))) {
                  return String(rawRow[k] ?? "").trim();
                }
              }
              return "";
            };

            return {
              id: `prod-row-${index + 1}-${Date.now()}`,
              rowNumber: index + 2,
              sku: findVal("sku", "mã"),
              name: findVal("tên hàng", "tên sp", "sản phẩm"),
              unit: findVal("đơn vị", "dvt"),
              sellingPrice: findVal("giá bán", "bán"),
              taxRatePercentage: findVal("thuế"),
              groupName: findVal("nhóm"),
              initialStock: findVal("tồn"),
              status: "SUCCESS",
              isSelected: false,
            };
          });
          resolve({ rows, missingColumns });
        } catch {
          resolve({ rows: [], missingColumns: [] });
        }
      };
      reader.onerror = () => resolve({ rows: [], missingColumns: [] });
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    processPreview(file);
  };

  // Preview only: Parse & validate in FE WITHOUT calling backend API
  const processPreview = async (file: File) => {
    setIsParsing(true);
    try {
      const { rows: parsedRows, missingColumns } = await parseExcelPreview(file);

      if (missingColumns.length > 0) {
        showError(
          `Tệp Excel thiếu các cột bắt buộc: ${missingColumns.join(", ")}. Vui lòng kiểm tra lại cấu trúc file hoặc tải tệp mẫu!`
        );
        setSelectedFile(null);
        setStep("UPLOAD");
        return;
      }

      const validated = parsedRows.map((row, _, arr) =>
        validateRow(row, arr, existingSkuSet, activeTaxRates)
      );
      setPreviewRows(validated);
      setStep("PREVIEW");
      if (validated.length === 0) {
        showError("File Excel không chứa dòng dữ liệu nào!");
      } else {
        const errorRowsCount = validated.filter((r) => r.status === "ERROR").length;
        if (errorRowsCount > 0) {
          showError(
            `Đã tải tệp thành công (${validated.length} dòng), phát hiện ${errorRowsCount} dòng có lỗi (được tô đỏ). Vui lòng kiểm tra và sửa trực tiếp trên bảng!`
          );
        } else {
          showSuccess(
            `Đã đọc ${validated.length} dòng dữ liệu hợp lệ từ tệp Excel! Vui lòng kiểm tra kỹ trước khi bấm Hoàn tất.`
          );
        }
      }
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, "Đọc dữ liệu file Excel thất bại. Vui lòng kiểm tra lại định dạng file!");
      showError(errMsg);
    } finally {
      setIsParsing(false);
    }
  };

  // Optimized inline cell edit: If field is 'sku' or 'taxRatePercentage', revalidate all; otherwise revalidate targeted row only
  const handleCellChange = (
    rowId: string,
    field: keyof IProductPreviewRow,
    val: unknown
  ) => {
    setPreviewRows((prev) => {
      const updatedList = prev.map((r) => (r.id === rowId ? { ...r, [field]: val } : r));
      if (field === "sku" || field === "taxRatePercentage") {
        return updatedList.map((r) => validateRow(r, updatedList, existingSkuSet, activeTaxRates));
      } else {
        return updatedList.map((r) =>
          r.id === rowId ? validateRow(r, updatedList, existingSkuSet, activeTaxRates) : r
        );
      }
    });
  };

  // Row selection & deletion
  const handleToggleSelectRow = (rowId: string) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setPreviewRows((prev) => prev.map((r) => ({ ...r, isSelected: checked })));
  };

  const handleDeleteRow = (rowId: string) => {
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => r.id !== rowId);
      return updatedList.map((r) => validateRow(r, updatedList, existingSkuSet, activeTaxRates));
    });
  };

  const handleDeleteSelected = () => {
    const count = previewRows.filter((r) => r.isSelected).length;
    if (count === 0) return;
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => !r.isSelected);
      return updatedList.map((r) => validateRow(r, updatedList, existingSkuSet, activeTaxRates));
    });
    showSuccess(`Đã xóa ${count} dòng khỏi danh sách xem trước.`);
  };

  const handleDeleteErrors = () => {
    const errorCount = previewRows.filter((r) => r.status === "ERROR").length;
    if (errorCount === 0) return;
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => r.status !== "ERROR");
      return updatedList.map((r) => validateRow(r, updatedList, existingSkuSet, activeTaxRates));
    });
    showSuccess(`Đã xóa ${errorCount} dòng bị lỗi khỏi danh sách xem trước.`);
  };

  const buildCleanFileFromPreview = (
    rows: IProductPreviewRow[],
    filename: string
  ): File => {
    const headers = [
      "Mã SKU",
      "Tên hàng hóa",
      "Đơn vị tính",
      "Giá bán",
      "% Thuế suất",
      "Tên nhóm hàng",
      "Tồn ban đầu",
    ];

    const dataRows = rows.map((r) => [
      r.sku,
      r.name,
      r.unit || "Cái",
      r.sellingPrice !== "" ? Number(r.sellingPrice) : 0,
      r.taxRatePercentage !== "" ? Number(r.taxRatePercentage) : 0,
      r.groupName || "",
      r.initialStock !== "" ? Number(r.initialStock) : 0,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_Muc_Hang_Hoa");

    const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new File([blob], filename || "Import_Edited.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  // Submit to DB ONLY when user clicks "Hoàn tất"
  const handleCompleteImport = async () => {
    const errorCount = previewRows.filter((r) => r.status === "ERROR").length;
    if (errorCount > 0) {
      showError(
        `Còn ${errorCount} dòng bị lỗi (tô đỏ). Vui lòng chỉnh sửa trực tiếp hoặc xóa các dòng bị lỗi trước khi bấm Hoàn tất!`
      );
      return;
    }

    if (previewRows.length === 0) {
      showError("Không có dòng dữ liệu hợp lệ nào để nhập vào hệ thống!");
      return;
    }

    try {
      // Build updated clean file containing only valid & edited preview rows
      const cleanFile = buildCleanFileFromPreview(
        previewRows,
        selectedFile?.name || "Import_Edited.xlsx"
      );
      const res = await importProducts(cleanFile).unwrap();

      if (res.successCount > 0) {
        showSuccess(`Nhập thành công ${res.successCount}/${res.totalRows} mặt hàng vào CSDL!`);
        addLogEntry("NHẬP_HÀNG_TỪ_FILE", `Tệp ${selectedFile?.name || "Excel"}`);
        onImportSuccess([]);
        onClose();
        resetState();
      } else {
        const errorDetails =
          res.errors && res.errors.length > 0
            ? res.errors.map((e) => `Dòng ${e.rowNumber}: ${e.errorMessage}`).join("; ")
            : "";
        showError(
          `Không thể lưu sản phẩm vào CSDL (${res.errorCount} lỗi từ máy chủ)${
            errorDetails ? `: ${errorDetails}` : "."
          }`
        );

        if (res.errors && res.errors.length > 0) {
          const serverErrorMap = new Map(res.errors.map((e) => [e.rowNumber, e.errorMessage]));
          setPreviewRows((prev) =>
            prev.map((row, index) => {
              const backendRowNumber = index + 2;
              const serverErr = serverErrorMap.get(backendRowNumber);
              if (serverErr) {
                return {
                  ...row,
                  status: "ERROR",
                  errorMessage: `[Máy chủ] ${serverErr}`,
                };
              }
              return row;
            })
          );
        }
      }
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, "Lưu danh mục sản phẩm thất bại.");
      showError(errMsg);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await triggerDownloadTemplate().unwrap();
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
    setPreviewRows([]);
    setIsParsing(false);
  };

  if (!isOpen) return null;

  const totalRows = previewRows.length;
  const validCount = previewRows.filter((r) => r.status === "SUCCESS").length;
  const errorCount = previewRows.filter((r) => r.status === "ERROR").length;
  const selectedCount = previewRows.filter((r) => r.isSelected).length;
  const isAllSelected = totalRows > 0 && selectedCount === totalRows;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-backdrop-fade-in"
      onClick={() => {
        onClose();
        resetState();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-6xl overflow-hidden animate-modal-bounce-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Nhập danh mục hàng hóa từ tệp Excel
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Xem trước dữ liệu, sửa/xóa dòng bị lỗi trước khi bấm "Hoàn tất" để lưu vào hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs min-h-0">
          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <div className="font-bold text-slate-800 text-sm">
                Đang đọc và phân tích dữ liệu tệp "{selectedFile?.name}"...
              </div>
              <p className="text-slate-400 text-xs font-semibold">
                Dữ liệu đang được kiểm tra lỗi và chuẩn bị hiển thị bảng xem trước (chưa lưu vào CSDL)
              </p>
            </div>
          )}

          {!isParsing && step === "UPLOAD" && (
            <div className="flex flex-col gap-5 py-4">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-kv-blue-primary transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/50 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="p-3 bg-blue-50 text-kv-blue-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
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
                      Tải về tệp Excel mẫu tiêu chuẩn với các cột Mã SKU, Tên hàng, Đơn giá, Thuế suất từ Server
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-50 text-kv-blue-primary font-bold px-3.5 h-8 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" /> Tải tệp mẫu
                </button>
              </div>
            </div>
          )}

          {!isParsing && step === "PREVIEW" && (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Summary Stats & Batch Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="font-bold text-slate-800">
                    Tệp: <span className="font-mono text-kv-blue-primary">{selectedFile?.name || "DanhMuc.xlsx"}</span>
                  </span>
                  <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-md text-[11px]">
                    Tổng: {totalRows} dòng
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {validCount} hợp lệ
                  </span>
                  {errorCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {errorCount} bị lỗi
                    </span>
                  )}
                  {selectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-md text-[11px]">
                      Đã chọn: {selectedCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa {selectedCount} dòng chọn
                    </button>
                  )}
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteErrors}
                      className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Xóa tất cả dòng lỗi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep("UPLOAD")}
                    className="bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Chọn tệp khác
                  </button>
                </div>
              </div>

              {/* Full Data Interactive Preview Table */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl max-h-[50vh] min-h-[220px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5 w-16 text-center">Dòng</th>
                      <th className="p-2.5 w-24 text-center">Trạng thái</th>
                      <th className="p-2.5 w-28">Mã SKU *</th>
                      <th className="p-2.5 min-w-[160px]">Tên hàng hóa *</th>
                      <th className="p-2.5 w-24">Đơn vị</th>
                      <th className="p-2.5 w-28 text-right">Giá bán</th>
                      <th className="p-2.5 w-20 text-right">% Thuế</th>
                      <th className="p-2.5 w-28">Nhóm hàng</th>
                      <th className="p-2.5 w-24 text-right">Tồn đầu</th>
                      <th className="p-2.5 min-w-[200px]">Chi tiết lỗi / Ghi chú</th>
                      <th className="p-2.5 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                          Không có dòng dữ liệu nào trong bảng xem trước.
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row) => {
                        const isError = row.status === "ERROR";
                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              row.isSelected
                                ? "bg-blue-50/70"
                                : isError
                                ? "bg-rose-50/80 border-l-4 border-rose-500 text-rose-900 font-semibold"
                                : "hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            {/* Selection Checkbox */}
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.isSelected || false}
                                onChange={() => handleToggleSelectRow(row.id)}
                                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                              />
                            </td>

                            {/* Row Index */}
                            <td className={`p-2.5 text-center font-mono font-bold ${isError ? "text-rose-700" : "text-slate-500"}`}>
                              Dòng {row.rowNumber}
                            </td>

                            {/* Status Badge */}
                            <td className="p-2.5 text-center">
                              {isError ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 text-rose-600" /> Bị lỗi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Hợp lệ
                                </span>
                              )}
                            </td>

                            {/* SKU Input */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.sku}
                                onChange={(e) => handleCellChange(row.id, "sku", e.target.value)}
                                className={`w-full h-8 px-2 border rounded font-mono text-xs font-bold focus:outline-none ${
                                  isError && !row.sku?.trim()
                                    ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>

                            {/* Name Input */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleCellChange(row.id, "name", e.target.value)}
                                className={`w-full h-8 px-2 border rounded text-xs font-semibold focus:outline-none ${
                                  isError && !row.name?.trim()
                                    ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>

                            {/* Unit */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.unit}
                                onChange={(e) => handleCellChange(row.id, "unit", e.target.value)}
                                className={`w-full h-8 px-2 border rounded text-xs focus:outline-none ${
                                  isError && !row.unit?.trim()
                                    ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>

                            {/* Selling Price */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={0}
                                value={row.sellingPrice}
                                onChange={(e) => handleCellChange(row.id, "sellingPrice", e.target.value)}
                                className={`w-full h-8 px-2 border rounded text-xs text-right font-mono font-bold focus:outline-none ${
                                  isError && (row.sellingPrice === "" || Number(row.sellingPrice) <= 0)
                                    ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>

                            {/* Tax % */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={0}
                                value={row.taxRatePercentage}
                                onChange={(e) => handleCellChange(row.id, "taxRatePercentage", e.target.value)}
                                className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right font-mono text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                              />
                            </td>

                            {/* Group Name */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.groupName || ""}
                                onChange={(e) => handleCellChange(row.id, "groupName", e.target.value)}
                                placeholder="Nhóm hàng"
                                className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                              />
                            </td>

                            {/* Initial Stock */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={0}
                                value={row.initialStock}
                                onChange={(e) => handleCellChange(row.id, "initialStock", e.target.value)}
                                className="w-full h-8 px-2 border border-slate-200 rounded text-xs text-right font-mono text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                              />
                            </td>

                            {/* Error Details Column */}
                            <td className="p-2.5">
                              {isError ? (
                                <span className="font-bold text-rose-700 flex items-center gap-1">
                                  {row.errorMessage}
                                </span>
                              ) : (
                                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                  Sẵn sàng import
                                </span>
                              )}
                            </td>

                            {/* Delete single row */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (step === "PREVIEW") setStep("UPLOAD");
              else {
                onClose();
                resetState();
              }
            }}
            className="px-4 h-9 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs"
          >
            {step === "PREVIEW" ? "Chọn tệp khác" : "Đóng"}
          </button>

          {step === "PREVIEW" && (
            <button
              type="button"
              onClick={handleCompleteImport}
              disabled={isSubmitting || totalRows === 0}
              className={`px-5 h-9 rounded-lg font-bold text-white transition-colors flex items-center gap-1.5 text-xs shadow-sm ${
                errorCount > 0
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-kv-blue-primary hover:bg-kv-blue-dark"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang thêm vào CSDL...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Hoàn tất ({validCount}/{totalRows} dòng)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
