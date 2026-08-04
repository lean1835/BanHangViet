import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useGetCustomersQuery } from "@/modules/customer/services/customerApi";
import {
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
} from "@/modules/order/services/orderApi";
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
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import type { IOrderImportRow } from "../types/IOrderImport";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import {
  parseOrderExcelFile,
  downloadOrderImportTemplate,
  validateOrderImportRow,
  COLUMN_NAME_MAP,
  PAYMENT_METHOD_OPTIONS,
} from "../utils/excelOrderParser";
import { baseApi } from "@/stores/baseApi";
import { useAppDispatch } from "@/hooks/useRedux";
import { API_TAG_TYPES } from "@/constants/api";
import { ORDER_PAYMENT_METHOD } from "@/constants/order";

interface ImportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportOrdersModal: React.FC<ImportOrdersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // RTK Query Mutations for real backend order creation
  const [createOrder] = useCreateOrderMutation();
  const [addOrderItem] = useAddOrderItemMutation();
  const [applyDiscount] = useApplyDiscountMutation();
  const [setPaymentMethod] = useSetPaymentMethodMutation();
  const [completeOrder] = useCompleteOrderMutation();

  // Fetch full product catalog to match and validate SKUs accurately across pages
  const { data: productsResponse, isSuccess: isProductsLoaded } = useGetProductsQuery({ size: 1000 }, {
    skip: !isOpen,
  });
  const products = useMemo(
    () => productsResponse?.content || [],
    [productsResponse]
  );

  // Pre-build Map for O(1) SKU lookup
  const productSkuMap = useMemo(() => {
    const map = new Map<string, IProduct>();
    products.forEach((p) => {
      if (p.sku) {
        map.set(p.sku.toLowerCase(), p);
      }
    });
    return map;
  }, [products]);

  // Fetch customer catalog to match customer names
  const { data: customersData } = useGetCustomersQuery(undefined, { skip: !isOpen });
  const customers = useMemo(() => customersData || [], [customersData]);
  const customerNameMap = useMemo(() => {
    const map = new Map<string, ICustomer>();
    customers.forEach((c) => {
      if (c.name) {
        map.set(c.name.trim().toLowerCase(), c);
      }
    });
    return map;
  }, [customers]);

  const [step, setStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importRows, setImportRows] = useState<IOrderImportRow[]>([]);

  const hasImportRows = importRows.length > 0;

  // Re-validate rows when product catalog completes loading
  useEffect(() => {
    if (isProductsLoaded && hasImportRows) {
      setImportRows((prevRows) =>
        prevRows.map((row) =>
          validateOrderImportRow(row, products, productSkuMap, true)
        )
      );
    }
  }, [isProductsLoaded, hasImportRows, products, productSkuMap]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    try {
      const rows = await parseOrderExcelFile(file, products, isProductsLoaded);
      setImportRows(rows);
      setStep("PREVIEW");
      if (rows.length === 0) {
        showError("File Excel không có dòng dữ liệu nào!");
      } else {
        showSuccess(`Đã đọc ${rows.length} dòng từ tệp Excel!`);
      }
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Không thể đọc tệp Excel. Vui lòng kiểm tra lại định dạng tệp!"
      );
      showError(errMsg);
    } finally {
      setIsParsing(false);
    }
  };

  // Re-validate row on any field change
  const handleCellChange = (
    rowId: string,
    field: keyof IOrderImportRow,
    value: unknown
  ) => {
    setImportRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row;
        const updated = { ...row, [field]: value };
        return validateOrderImportRow(updated, products, productSkuMap, isProductsLoaded);
      })
    );
  };

  // Toggle selection
  const handleToggleSelectRow = (rowId: string) => {
    setImportRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setImportRows((prev) => prev.map((r) => ({ ...r, isSelected: checked })));
  };

  // Row deletion
  const handleDeleteRow = (rowId: string) => {
    setImportRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleDeleteSelected = () => {
    const selectedCount = importRows.filter((r) => r.isSelected).length;
    if (selectedCount === 0) return;
    setImportRows((prev) => prev.filter((r) => !r.isSelected));
    showSuccess(`Đã xóa ${selectedCount} dòng khỏi danh sách preview.`);
  };

  const handleDeleteErrors = () => {
    const errorCount = importRows.filter((r) => !r.isValid).length;
    if (errorCount === 0) return;
    setImportRows((prev) => prev.filter((r) => r.isValid));
    showSuccess(`Đã loại bỏ ${errorCount} dòng bị lỗi khỏi danh sách preview.`);
  };

  // Summary statistics
  const totalRows = importRows.length;
  const validRowsCount = importRows.filter((r) => r.isValid).length;
  const errorRowsCount = importRows.filter((r) => !r.isValid).length;
  const selectedRowsCount = importRows.filter((r) => r.isSelected).length;
  const isAllSelected = totalRows > 0 && selectedRowsCount === totalRows;

  // Flatten error list for detailed panel
  const allFieldErrors = useMemo(() => {
    const list: Array<{
      rowId: string;
      rowNumber: number;
      field: string;
      columnName: string;
      message: string;
    }> = [];

    importRows.forEach((row) => {
      if (!row.isValid && row.errors) {
        Object.entries(row.errors).forEach(([field, message]) => {
          list.push({
            rowId: row.id,
            rowNumber: row.rowNumber,
            field,
            columnName: COLUMN_NAME_MAP[field] || field,
            message,
          });
        });
      }
    });
    return list;
  }, [importRows]);

  const handleDownloadTemplate = () => {
    try {
      downloadOrderImportTemplate();
      showSuccess("Đã tải tệp Excel mẫu đơn hàng tiêu chuẩn!");
    } catch {
      showError("Không thể tạo tệp mẫu Excel.");
    }
  };

  const handleImportSubmit = async () => {
    if (errorRowsCount > 0) {
      showError(
        `Còn ${errorRowsCount} dòng bị lỗi. Vui lòng sửa trực tiếp hoặc xóa các dòng bị lỗi trước khi tải vào hệ thống!`
      );
      return;
    }

    if (totalRows === 0) {
      showError("Không có dòng dữ liệu nào để tải vào hệ thống!");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const validRows = importRows.filter((r) => r.isValid);
      const BATCH_SIZE = 3;

      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const chunk = validRows.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (row) => {
            try {
              // 1. Create order in DB with matched customerId if available
              const custNameTrimmed = (row.customerName || "").trim().toLowerCase();
              const matchedCustomer = customerNameMap.get(custNameTrimmed);
              const createRes = await createOrder({
                customerId: matchedCustomer?.id,
              }).unwrap();

              const orderId = createRes.result?.id;
              if (!orderId) {
                failCount++;
                return;
              }

              // 2. Attach matched product if available (O(1) Map lookup)
              const skuKey = (row.productSku || "").toLowerCase();
              const matchedProduct = productSkuMap.get(skuKey);
              if (matchedProduct) {
                await addOrderItem({
                  orderId,
                  productId: matchedProduct.id,
                  quantity: Number(row.quantity) || 1,
                }).unwrap();
              }

              // 3. Apply discount if specified
              const discount = Number(row.discountAmount) || 0;
              if (discount > 0) {
                await applyDiscount({
                  orderId,
                  discountType: "CASH",
                  discountValue: discount,
                }).unwrap();
              }

              // 4. Set payment method & amount given
              const unitPrice = Number(row.unitPrice) || 0;
              const qty = Number(row.quantity) || 1;
              const totalAmount = Math.max(0, unitPrice * qty - discount);
              const isDebt = row.paymentMethod === ORDER_PAYMENT_METHOD.DEBT;
              const amountGiven = isDebt ? 0 : totalAmount;
              const paymentMethod =
                (row.paymentMethod as "CASH" | "BANK_TRANSFER" | "DEBT") || "CASH";

              await setPaymentMethod({
                orderId,
                paymentMethod,
                amountGiven,
              }).unwrap();

              // 5. Complete order
              await completeOrder({
                orderId,
                amountGiven,
              }).unwrap();

              successCount++;
            } catch {
              failCount++;
            }
          })
        );
      }

      addLogEntry(
        "IMPORT_EXCEL_ORDER",
        `Nhập thành công ${successCount}/${totalRows} đơn hàng từ tệp ${selectedFile?.name || "Excel"}`
      );

      if (successCount > 0) {
        showSuccess(
          `Đã tải thành công ${successCount}/${totalRows} đơn hàng vào CSDL hệ thống!${
            failCount > 0 ? ` (${failCount} đơn thất bại)` : ""
          }`
        );
        if (onSuccess) onSuccess();
        onClose();
        resetState();
      } else {
        showError(`Không thể lưu đơn hàng vào hệ thống (${failCount} lỗi khi lưu).`);
      }
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Đã xảy ra lỗi khi lưu danh sách đơn hàng."
      );
      showError(errMsg);
    } finally {
      dispatch(baseApi.util.invalidateTags([API_TAG_TYPES.ORDER]));
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setStep("UPLOAD");
    setSelectedFile(null);
    setImportRows([]);
    setIsParsing(false);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={() => {
        onClose();
        resetState();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] animate-auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Import Danh Sách Đơn Hàng Từ Tệp Excel
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Xem trước dữ liệu, tích xóa dòng, sửa lỗi trực tiếp trên ô bảng tính trước khi tải vào hệ thống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              resetState();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 text-xs bg-white min-h-0">
          {/* Step 1: Upload */}
          {isParsing && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-9 h-9 text-kv-blue-primary animate-spin" />
              <div className="font-bold text-slate-800 text-sm">
                Đang đọc và phân tích tệp "{selectedFile?.name}"...
              </div>
              <p className="text-slate-500 text-xs">
                Hệ thống đang đối chiếu mã SKU sản phẩm và tự động phát hiện lỗi theo dòng & cột.
              </p>
            </div>
          )}

          {!isParsing && step === "UPLOAD" && (
            <div className="flex flex-col gap-5 py-4">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-kv-blue-primary transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50/60 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="p-3 bg-blue-50 text-kv-blue-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Kéo thả tệp Excel vào đây hoặc{" "}
                  <span className="text-kv-blue-primary underline">
                    Chọn tệp từ máy tính
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Hỗ trợ định dạng bảng tính .xlsx, .xls, .csv (Tối đa 10MB)
                </p>
              </div>

              {/* Sample Template Box */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-kv-blue-primary shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      Chưa có tệp Excel mẫu đơn hàng?
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Tải về tệp mẫu chuẩn với đầy đủ các cột: Mã đơn, Khách hàng, Mã SKU, Tên SP, Số lượng, Giá bán, Chiết khấu, Thanh toán.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-50 text-kv-blue-primary font-bold px-4 h-9 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 text-xs shadow-sm"
                >
                  <Download className="w-4 h-4" /> Tải tệp mẫu
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Interactive Preview & Edit Table */}
          {!isParsing && step === "PREVIEW" && (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Summary Stats & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-800">
                    Tệp: <span className="font-mono text-kv-blue-primary">{selectedFile?.name}</span>
                  </span>
                  <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-md text-[11px]">
                    Tổng: {totalRows} dòng
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {validRowsCount} hợp lệ
                  </span>
                  {errorRowsCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {errorRowsCount} bị lỗi
                    </span>
                  )}
                  {selectedRowsCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-md text-[11px]">
                      Đã chọn: {selectedRowsCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRowsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa {selectedRowsCount} dòng đã chọn
                    </button>
                  )}
                  {errorRowsCount > 0 && (
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

              {/* Editable Data Table */}
              <div ref={tableContainerRef} className="flex-1 overflow-auto border border-slate-200 rounded-xl max-h-[45vh] min-h-[220px]">
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
                      <th className="p-2.5 w-32">Mã đơn</th>
                      <th className="p-2.5 w-36">Khách hàng</th>
                      <th className="p-2.5 w-32">Mã SKU *</th>
                      <th className="p-2.5 min-w-[160px]">Tên sản phẩm *</th>
                      <th className="p-2.5 w-24 text-right">Số lượng *</th>
                      <th className="p-2.5 w-28 text-right">Đơn giá *</th>
                      <th className="p-2.5 w-28 text-right">Chiết khấu</th>
                      <th className="p-2.5 w-32">Thanh toán</th>
                      <th className="p-2.5 w-12 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {totalRows === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                          Chưa có dòng dữ liệu nào. Vui lòng tải lên tệp Excel!
                        </td>
                      </tr>
                    ) : (
                      importRows.map((row) => {
                        const hasError = !row.isValid;
                        return (
                          <tr
                            key={row.id}
                            data-row-id={row.id}
                            className={`transition-colors ${
                              row.isSelected
                                ? "bg-blue-50/70"
                                : hasError
                                ? "bg-rose-50/40 hover:bg-rose-50/80"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {/* Select Checkbox */}
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.isSelected}
                                onChange={() => handleToggleSelectRow(row.id)}
                                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                              />
                            </td>

                            {/* Row Number */}
                            <td className="p-2 text-center font-mono font-bold text-slate-500">
                              Dòng {row.rowNumber}
                            </td>

                            {/* Status Badge */}
                            <td className="p-2 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" /> Hợp lệ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <AlertCircle className="w-3 h-3 text-rose-600" /> Bị lỗi
                                </span>
                              )}
                            </td>

                            {/* Order Number */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.orderNumber}
                                onChange={(e) =>
                                  handleCellChange(row.id, "orderNumber", e.target.value)
                                }
                                className={`w-full h-8 px-2 border rounded font-mono text-xs font-bold focus:outline-none ${
                                  row.errors.orderNumber
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                                title={row.errors.orderNumber || ""}
                              />
                            </td>

                            {/* Customer Name */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.customerName}
                                onChange={(e) =>
                                  handleCellChange(row.id, "customerName", e.target.value)
                                }
                                className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                              />
                            </td>

                            {/* Product SKU (Validated) */}
                            <td className="p-1.5">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={row.productSku}
                                  onChange={(e) =>
                                    handleCellChange(row.id, "productSku", e.target.value)
                                  }
                                  placeholder="Mã SKU"
                                  className={`w-full h-8 px-2 border rounded font-mono text-xs font-bold focus:outline-none ${
                                    row.errors.productSku
                                      ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                      : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                  }`}
                                  title={row.errors.productSku || ""}
                                />
                                {row.errors.productSku && (
                                  <span className="absolute right-2 top-2 text-rose-500" title={row.errors.productSku}>
                                    ⚠️
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Product Name */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.productName}
                                onChange={(e) =>
                                  handleCellChange(row.id, "productName", e.target.value)
                                }
                                placeholder="Tên sản phẩm"
                                className={`w-full h-8 px-2 border rounded text-xs font-semibold focus:outline-none ${
                                  row.errors.productName
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                                title={row.errors.productName || ""}
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={1}
                                value={row.quantity}
                                onChange={(e) =>
                                  handleCellChange(row.id, "quantity", e.target.value)
                                }
                                className={`w-full h-8 px-2 border rounded text-xs text-right font-bold focus:outline-none ${
                                  row.errors.quantity
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                                title={row.errors.quantity || ""}
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={0}
                                value={row.unitPrice}
                                onChange={(e) =>
                                  handleCellChange(row.id, "unitPrice", e.target.value)
                                }
                                className={`w-full h-8 px-2 border rounded text-xs text-right font-bold focus:outline-none ${
                                  row.errors.unitPrice
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                                title={row.errors.unitPrice || ""}
                              />
                            </td>

                            {/* Discount Amount */}
                            <td className="p-1.5">
                              <input
                                type="number"
                                min={0}
                                value={row.discountAmount}
                                onChange={(e) =>
                                  handleCellChange(row.id, "discountAmount", e.target.value)
                                }
                                className={`w-full h-8 px-2 border rounded text-xs text-right font-semibold focus:outline-none ${
                                  row.errors.discountAmount
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>

                            {/* Payment Method */}
                            <td className="p-1.5">
                              <select
                                value={row.paymentMethod}
                                onChange={(e) =>
                                  handleCellChange(row.id, "paymentMethod", e.target.value)
                                }
                                className={`w-full h-8 px-2 border rounded text-xs font-semibold bg-white focus:outline-none ${
                                  row.errors.paymentMethod
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500"
                                    : "border-slate-200 text-slate-800 focus:border-kv-blue-primary"
                                }`}
                                title={row.errors.paymentMethod || ""}
                              >
                                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Single Row Delete Action */}
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

              {/* Detailed Error Log Panel */}
              {allFieldErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col gap-2 shrink-0 max-h-36 overflow-y-auto">
                  <div className="font-extrabold text-rose-800 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    Danh sách lỗi chi tiết theo Dòng & Cột ({allFieldErrors.length} phát hiện):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {allFieldErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-rose-900 font-medium flex items-center gap-1.5 hover:bg-rose-100/60 p-1 rounded cursor-pointer"
                        onClick={() => {
                          const container = tableContainerRef.current;
                          if (container) {
                            const rowEl = container.querySelector(`[data-row-id="${err.rowId}"]`);
                            if (rowEl) rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                      >
                        <span className="font-bold font-mono text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded text-[10px]">
                          Dòng {err.rowNumber}
                        </span>
                        <span className="font-bold text-rose-800">Cột '{err.columnName}':</span>
                        <span className="text-rose-700">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetState();
            }}
            className="px-4 h-9 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs"
          >
            Hủy
          </button>

          {step === "PREVIEW" && (
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={isSubmitting || totalRows === 0}
              className={`px-5 h-9 rounded-lg font-bold text-white transition-colors flex items-center gap-1.5 text-xs shadow-sm ${
                errorRowsCount > 0
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-kv-blue-primary hover:bg-kv-blue-dark"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Tải vào hệ thống ({validRowsCount}/{totalRows} dòng)
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
