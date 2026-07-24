import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invoiceTemplateSchema,
  type TInvoiceTemplateFormData,
} from "../schemas/settingsSchemas";
import {
  useGetInvoiceTemplateQuery,
  useUpdateInvoiceTemplateMutation,
} from "../services/settingsApi";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { Save, FileText, Eye, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const InvoiceTemplatePanel: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  // API Queries & Mutations
  const { data: response, isLoading: isFetching, isError: isFetchError } = useGetInvoiceTemplateQuery();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateInvoiceTemplateMutation();

  const template = response?.result;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TInvoiceTemplateFormData>({
    resolver: zodResolver(invoiceTemplateSchema),
    defaultValues: {
      invoicePattern: "1",
      invoiceSymbol: "1C26TAA",
      title: "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
      footerNote: "Cảm ơn quý khách đã mua hàng! Hóa đơn điện tử khởi tạo từ máy tính tiền có mã của CQT.",
    },
  });

  // Watch form fields to drive real-time live preview
  const watchedValues = watch();

  useEffect(() => {
    if (template) {
      reset({
        invoicePattern: template.invoicePattern || "1",
        invoiceSymbol: template.invoiceSymbol || "1C26TAA",
        title: template.title || "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
        footerNote: template.footerNote || "",
      });
    }
  }, [template, reset]);

  const onSubmit = async (data: TInvoiceTemplateFormData) => {
    try {
      await updateTemplate({
        invoicePattern: data.invoicePattern,
        invoiceSymbol: data.invoiceSymbol,
        title: data.title,
        footerNote: data.footerNote || undefined,
      }).unwrap();

      showSuccess("Lưu thiết lập mẫu hóa đơn thành công và đã áp dụng cho tất cả hóa đơn mới!");
      addLogEntry("CẬP_NHẬT_MẪU_HÓA_ĐƠN", `Mẫu ${data.invoiceSymbol}`);
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Lưu thiết lập mẫu hóa đơn thất bại. Vui lòng kiểm tra lại các trường!"
      );
      showError(errMsg);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
        <span className="text-xs font-bold">Đang tải cấu hình mẫu hóa đơn từ máy chủ...</span>
      </div>
    );
  }

  if (isFetchError) {
    return (
      <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-rose-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="text-xs font-bold">
          Không thể kết nối máy chủ để lấy mẫu hóa đơn. Vui lòng thử lại sau.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Settings (Left 6 Cols) */}
      <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight">
              Thiết lập mẫu hóa đơn điện tử
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Cấu hình ký hiệu, mẫu số và thông tin mẫu hiển thị
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ký hiệu hóa đơn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("invoiceSymbol")}
                className={`border ${
                  errors.invoiceSymbol ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 uppercase font-mono`}
                placeholder="VD: 1C26TAA"
              />
              {errors.invoiceSymbol && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.invoiceSymbol.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Mẫu số hóa đơn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("invoicePattern")}
                className={`border ${
                  errors.invoicePattern ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800`}
                placeholder="VD: 1"
              />
              {errors.invoicePattern && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.invoicePattern.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Tiêu đề chính của hóa đơn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              className={`border ${
                errors.title ? "border-rose-500" : "border-slate-300"
              } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 uppercase`}
              placeholder="VD: HÓA ĐƠN GIÁ TRỊ GIA TĂNG"
            />
            {errors.title && (
              <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.title.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Ghi chú / Lời cảm ơn chân trang (Footer):
            </label>
            <textarea
              rows={3}
              {...register("footerNote")}
              className="border border-slate-300 p-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-medium text-slate-800"
              placeholder="Nhập lời cảm ơn hoặc ghi chú chân trang..."
            />
            {errors.footerNote && (
              <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.footerNote.message}
              </span>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex gap-2.5 text-emerald-800 text-xs mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              Mẫu số và Ký hiệu tuân thủ đúng định dạng Thông tư 78/2021/TT-BTC của Tổng cục Thuế.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-6 h-10 rounded-lg transition-colors flex items-center gap-2 text-xs shadow-sm disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu thiết lập mẫu hóa đơn
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview (Right 6 Cols) */}
      <div className="lg:col-span-6 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Eye className="w-4 h-4 text-slate-500" />
          <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
            Bản xem trước trực tiếp (Live VAT Preview)
          </h4>
        </div>

        {/* VAT Invoice Mock Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md font-sans flex flex-col gap-4 text-[11px] text-slate-700">
          <div className="text-center border-b border-slate-200 pb-3">
            <h2 className="text-base font-black text-blue-900 uppercase tracking-tight">
              {watchedValues.title || "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              (Khởi tạo từ máy tính tiền)
            </p>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-500 font-semibold">
              <span>Ký hiệu: <strong className="text-slate-800 font-mono">{watchedValues.invoiceSymbol || "1C26TAA"}</strong></span>
              <span>Mẫu số: <strong className="text-slate-800 font-mono">{watchedValues.invoicePattern || "1"}</strong></span>
            </div>
          </div>

          {/* Business details preview */}
          <div className="flex flex-col gap-1 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-100">
            <div><span className="font-bold">Đơn vị bán hàng:</span> HỘ KINH DOANH BÁN HÀNG VIỆT</div>
            <div><span className="font-bold">Mã số thuế:</span> 8934567890</div>
            <div><span className="font-bold">Địa chỉ:</span> Số 123 Đường Bán Hàng, Hà Nội</div>
          </div>

          {/* Sample items table preview */}
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold">
                <th className="p-1.5">Tên hàng hóa</th>
                <th className="p-1.5 text-center">SL</th>
                <th className="p-1.5 text-right">Đơn giá</th>
                <th className="p-1.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-1.5 font-semibold">Sữa tươi tiệt trùng 1L</td>
                <td className="p-1.5 text-center">2</td>
                <td className="p-1.5 text-right">35,000</td>
                <td className="p-1.5 text-right font-bold">70,000 đ</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold">Bánh quy bơ Pháp</td>
                <td className="p-1.5 text-center">1</td>
                <td className="p-1.5 text-right">45,000</td>
                <td className="p-1.5 text-right font-bold">45,000 đ</td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-slate-200 pt-2 flex flex-col gap-1 text-[10px] font-bold text-right">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Tổng tiền hàng:</span>
              <span>115,000 đ</span>
            </div>
            <div className="flex justify-between text-kv-blue-primary">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-xs">115,000 đ</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-500 italic">
            {watchedValues.footerNote || "Cảm ơn quý khách!"}
          </div>
        </div>
      </div>
    </div>
  );
};
