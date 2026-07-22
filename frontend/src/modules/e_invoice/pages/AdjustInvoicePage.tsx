import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetInvoiceQuery, useAdjustInvoiceMutation } from "../services/eInvoiceApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { generateTempId } from "../utils/eInvoiceHelpers";

const adjustItemSchema = z.object({
  tempId: z.string(),
  productId: z.string().optional(),
  productName: z.string().trim().min(1, "Tên sản phẩm không được để trống"),
  unit: z.string().trim().min(1, "Đơn vị tính không được để trống"),
  quantity: z.number({ invalid_type_error: "Số lượng không hợp lệ" }).gt(0, "Số lượng phải lớn hơn 0"),
  unitPrice: z.number({ invalid_type_error: "Đơn giá không hợp lệ" }).gte(0, "Đơn giá không được nhỏ hơn 0"),
  taxRatePercentage: z.number().gte(0, "Thuế suất không hợp lệ"),
  discountAmount: z.number({ invalid_type_error: "Chiết khấu không hợp lệ" }).gte(0, "Chiết khấu không được nhỏ hơn 0"),
});

const adjustInvoiceFormSchema = z.object({
  adjustmentReason: z
    .string()
    .trim()
    .min(10, "Lý do điều chỉnh phải chứa ít nhất 10 ký tự.")
    .max(500, "Lý do điều chỉnh không được vượt quá 500 ký tự."),
  buyerName: z.string().trim().optional(),
  buyerTaxCode: z.string().trim().optional(),
  buyerAddress: z.string().trim().optional(),
  buyerPhone: z.string().trim().optional(),
  buyerEmail: z.string().trim().email("Email không đúng định dạng").optional().or(z.literal("")),
  items: z.array(adjustItemSchema).min(1, "Hóa đơn phải chứa ít nhất một dòng mặt hàng"),
});

type TAdjustInvoiceFormData = z.infer<typeof adjustInvoiceFormSchema>;

const TAX_RATE_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 1, label: "1%" },
  { value: 3, label: "3%" },
  { value: 5, label: "5%" },
  { value: 8, label: "8%" },
  { value: 10, label: "10%" },
];

export const AdjustInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();

  const { data: invoiceData, isLoading: isInvoiceLoading, isError: isInvoiceError } = useGetInvoiceQuery(id || "");
  const [adjustInvoice, { isLoading: isSubmitting }] = useAdjustInvoiceMutation();

  const invoice = invoiceData?.result;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TAdjustInvoiceFormData>({
    resolver: zodResolver(adjustInvoiceFormSchema),
    defaultValues: {
      adjustmentReason: "",
      buyerName: "",
      buyerTaxCode: "",
      buyerAddress: "",
      buyerPhone: "",
      buyerEmail: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
    keyName: "fieldArrayId",
  });

  // Business Guard: Only ISSUED invoices can be adjusted!
  useEffect(() => {
    if (invoice) {
      if (invoice.status !== E_INVOICE_STATUS.ISSUED) {
        showError("Chỉ có thể lập hóa đơn điều chỉnh cho hóa đơn đang ở trạng thái ĐÃ CẤP MÃ!");
        navigate("/e-invoices");
        return;
      }

      const mappedItems =
        invoice.items && invoice.items.length > 0
          ? invoice.items.map((item) => ({
              tempId: generateTempId(),
              productId: item.productId,
              productName: item.productName,
              unit: item.unit || "Lon",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRatePercentage: item.taxRatePercentage || 8,
              discountAmount: item.discountAmount || 0,
            }))
          : [
              {
                tempId: generateTempId(),
                productName: "Hàng hóa dịch vụ điều chỉnh",
                unit: "Lần",
                quantity: 1,
                unitPrice: invoice.amount || 0,
                taxRatePercentage: 8,
                discountAmount: 0,
              },
            ];

      reset({
        adjustmentReason: "",
        buyerName: invoice.buyerName || invoice.customer || "",
        buyerTaxCode: invoice.buyerTaxCode || "",
        buyerAddress: invoice.buyerAddress || "",
        buyerPhone: invoice.buyerPhone || "",
        buyerEmail: invoice.buyerEmail || "",
        items: mappedItems,
      });
    }
  }, [invoice, reset, navigate, showError]);

  const watchedItems = watch("items") || [];
  const watchedReason = watch("adjustmentReason") || "";

  // Real-time Sum Calculations
  const totalAmountBeforeTax = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const taxAmount = watchedItems.reduce(
    (sum, item) =>
      sum +
      ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * (Number(item.taxRatePercentage) || 0)) / 100,
    0
  );
  const discountAmount = watchedItems.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0);
  const finalAmount = totalAmountBeforeTax + taxAmount - discountAmount;

  if (isInvoiceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-kv-blue-primary" />
        <span className="text-slate-500 font-bold text-xs">Đang tải thông tin hóa đơn gốc...</span>
      </div>
    );
  }

  if (isInvoiceError || !invoice) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-rose-700 text-center max-w-xl mx-auto shadow-sm">
          <h3 className="font-extrabold text-sm mb-2">Không tìm thấy hóa đơn cần điều chỉnh</h3>
          <p className="text-xs font-semibold mb-4">Hóa đơn không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          <button
            onClick={() => navigate("/e-invoices")}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const handleAddItem = () => {
    append({
      tempId: generateTempId(),
      productName: "",
      unit: "Lon",
      quantity: 1,
      unitPrice: 0,
      taxRatePercentage: 8,
      discountAmount: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length <= 1) {
      showWarning("Hóa đơn phải chứa ít nhất một dòng mặt hàng!");
      return;
    }
    remove(index);
  };

  const onFormSubmit = async (formData: TAdjustInvoiceFormData) => {
    try {
      const requestPayload = {
        adjustmentReason: formData.adjustmentReason.trim(),
        buyerName: formData.buyerName?.trim() || undefined,
        buyerTaxCode: formData.buyerTaxCode?.trim() || undefined,
        buyerAddress: formData.buyerAddress?.trim() || undefined,
        buyerPhone: formData.buyerPhone?.trim() || undefined,
        buyerEmail: formData.buyerEmail?.trim() || undefined,
        items: formData.items.map((item) => ({
          productId: item.productId,
          productName: item.productName.trim(),
          unit: item.unit.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRatePercentage: Number(item.taxRatePercentage),
          discountAmount: Number(item.discountAmount),
        })),
      };

      await adjustInvoice({
        invoiceId: invoice.id,
        body: requestPayload,
      }).unwrap();

      showSuccess("Đã lập hóa đơn điều chỉnh và gửi lên hàng đợi cấp mã thuế thành công!");
      navigate("/e-invoices");
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập hóa đơn điều chỉnh."));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">
            Lập hóa đơn điều chỉnh
          </h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1">
            Điều chỉnh cho hóa đơn gốc số:{" "}
            <span className="text-kv-blue-primary font-mono">{invoice.invoiceNumber || "Chưa cấp số"}</span> | Ký hiệu:{" "}
            <span className="text-slate-700">{invoice.invoiceSymbol || invoice.symbol}</span> | Mã tra cứu:{" "}
            <span className="text-slate-700 font-mono">{invoice.lookupCode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/e-invoices")}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shrink-0"
        >
          QUAY LẠI
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6">
        {/* Section 1: Adjustment Reason */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
            Lý do điều chỉnh hóa đơn <span className="text-rose-500">*</span>
          </label>
          <textarea
            {...register("adjustmentReason")}
            rows={3}
            className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary placeholder:text-slate-400 placeholder:font-medium"
            placeholder="Nhập lý do chi tiết điều chỉnh hóa đơn (Ví dụ: Điều chỉnh giảm đơn giá do hàng lỗi kỹ thuật, sửa đổi lại mã số thuế người mua bị gõ sai...)"
          />
          {errors.adjustmentReason && (
            <span className="text-rose-600 text-[10px] font-bold">⚠️ {errors.adjustmentReason.message}</span>
          )}
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mt-0.5">
            <span>Yêu cầu tối thiểu 10 ký tự</span>
            <span>{watchedReason.length}/500 ký tự</span>
          </div>
        </div>

        {/* Section 2: Buyer details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-[11px] font-extrabold text-slate-700 border-b pb-2 uppercase tracking-wider">
            Thông tin người mua hàng (Điều chỉnh)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Họ tên người mua / Đơn vị</label>
              <input
                type="text"
                {...register("buyerName")}
                className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
                placeholder="Tên khách hàng hoặc tên công ty..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Mã số thuế người mua</label>
              <input
                type="text"
                {...register("buyerTaxCode")}
                className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
                placeholder="Ví dụ: 0102030405"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Địa chỉ người mua</label>
              <input
                type="text"
                {...register("buyerAddress")}
                className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
                placeholder="Địa chỉ giao dịch hóa đơn..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Số điện thoại</label>
              <input
                type="text"
                {...register("buyerPhone")}
                className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
                placeholder="Số điện thoại di động..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Email nhận hóa đơn</label>
              <input
                type="email"
                {...register("buyerEmail")}
                className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
                placeholder="Email để gửi hóa đơn điện tử..."
              />
              {errors.buyerEmail && (
                <span className="text-rose-600 text-[10px] font-bold">⚠️ {errors.buyerEmail.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Line Items Spreadsheet */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              Chi tiết mặt hàng hóa đơn
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shadow-sm"
            >
              + THÊM DÒNG MẶT HÀNG
            </button>
          </div>

          {errors.items?.message && (
            <span className="text-rose-600 text-[10px] font-bold">⚠️ {errors.items.message}</span>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[9px] uppercase">
                  <th className="p-3 text-center w-10">STT</th>
                  <th className="p-3 min-w-[200px]">Tên hàng hóa, dịch vụ *</th>
                  <th className="p-3 w-20 text-center">ĐVT *</th>
                  <th className="p-3 w-24 text-center">Số lượng *</th>
                  <th className="p-3 w-32 text-right">Đơn giá (đ) *</th>
                  <th className="p-3 w-24 text-center">Thuế suất</th>
                  <th className="p-3 w-28 text-right">Chiết khấu (đ)</th>
                  <th className="p-3 w-32 text-right">Thành tiền</th>
                  <th className="p-3 text-center w-12">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {fields.map((field, idx) => {
                  const qty = Number(watchedItems[idx]?.quantity) || 0;
                  const price = Number(watchedItems[idx]?.unitPrice) || 0;
                  const disc = Number(watchedItems[idx]?.discountAmount) || 0;
                  const itemSubtotal = qty * price - disc;

                  return (
                    <tr key={field.fieldArrayId} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${idx}.productName`)}
                          className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                          placeholder="Nhập tên mặt hàng..."
                        />
                        {errors.items?.[idx]?.productName && (
                          <span className="text-rose-600 text-[9px] font-bold block mt-0.5">
                            {errors.items[idx]?.productName?.message}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${idx}.unit`)}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold text-center text-slate-700 focus:outline-none focus:border-kv-blue-primary"
                          placeholder="Lon..."
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-right text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          {...register(`items.${idx}.taxRatePercentage`, { valueAsNumber: true })}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold text-center text-slate-700 focus:outline-none focus:border-kv-blue-primary bg-white"
                        >
                          {TAX_RATE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          {...register(`items.${idx}.discountAmount`, { valueAsNumber: true })}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-right text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {formatCurrency(itemSubtotal)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold transition-colors text-sm px-1.5 py-1"
                          title="Xóa dòng này"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 font-bold text-slate-700 text-xs max-w-md ml-auto w-full mt-2">
            <div className="flex justify-between text-[10px]">
              <span className="font-semibold text-slate-500">Cộng tiền hàng (Chưa thuế):</span>
              <span>{formatCurrency(totalAmountBeforeTax)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="font-semibold text-slate-500">Tổng tiền thuế GTGT:</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[10px] text-rose-500">
                <span className="font-semibold">Tổng chiết khấu:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-950">
              <span>Tổng tiền thanh toán mới:</span>
              <span className="font-extrabold text-kv-blue-primary">{formatCurrency(finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Form actions */}
        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate("/e-invoices")}
            className="px-5 py-3 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            HỦY BỎ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-3 bg-kv-blue-primary hover:bg-kv-blue-dark text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 min-w-[220px] disabled:opacity-60 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ĐANG GỬI THUẾ...
              </>
            ) : (
              "PHÁT HÀNH HÓA ĐƠN ĐIỀU CHỈNH"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdjustInvoicePage;
