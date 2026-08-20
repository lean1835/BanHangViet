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
import { useAppSelector } from "@/hooks/useRedux";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { Save, FileText, Eye, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const InvoiceTemplatePanel: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();
  const currentUser = useAppSelector((state) => state.auth.user);

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
            Bản xem trước trực tiếp hóa đơn điện tử (Official E-Invoice Preview)
          </h4>
        </div>

        {/* Official VAT E-Invoice Document Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md font-sans relative flex flex-col gap-5 text-[10px] text-slate-800 font-medium overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] text-slate-800 text-[2.8rem] font-extrabold rotate-[30deg] uppercase whitespace-nowrap overflow-hidden">
            Hóa đơn điện tử
          </div>

          {/* Invoice Header */}
          <div className="flex justify-between border-b pb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-xs font-black text-kv-blue-primary tracking-wide uppercase">
                {watchedValues.title || "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                (Bản thể hiện hóa đơn điện tử)
              </p>
              <p className="text-[9px] font-bold text-slate-600 mt-1.5 flex items-center gap-2">
                <span>Ngày lập: {new Date().toLocaleDateString("vi-VN")}</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold border bg-emerald-100 text-emerald-800 border-emerald-300">
                  Đã phát hành
                </span>
              </p>
            </div>
            <div className="text-right flex flex-col gap-0.5 font-bold text-slate-600 text-[9px]">
              <p>Mẫu số: <span className="text-slate-800 font-extrabold">{watchedValues.invoicePattern || "1"}</span></p>
              <p>Ký hiệu: <span className="text-slate-800 font-extrabold">{watchedValues.invoiceSymbol || "1C26TAA"}</span></p>
              <p>Số HĐ: <span className="text-kv-blue-primary font-mono font-extrabold">00000001</span></p>
              <p>Mã tra cứu: <span className="text-slate-800 font-mono font-extrabold">EB8BBD6893</span></p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="border-b pb-3 text-[9px] leading-relaxed text-slate-600">
            <p className="font-extrabold text-slate-800 text-[10px] uppercase mb-0.5">
              Đơn vị bán hàng: {currentUser?.household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
            </p>
            <p>Mã số thuế: <span className="font-bold text-slate-800">{currentUser?.household?.taxCode || "0101234567"}</span></p>
            <p>Địa chỉ: {currentUser?.household?.address || "123 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội"}</p>
            {currentUser?.household?.phoneNumber && (
              <p>Điện thoại: {currentUser.household.phoneNumber}</p>
            )}
          </div>

          {/* Buyer Info */}
          <div className="border-b pb-3 text-[9px] leading-relaxed text-slate-600">
            <p className="font-extrabold text-slate-800 text-[10px] uppercase mb-0.5">Thông tin người mua hàng</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
              <p>Họ tên người mua: <span className="font-bold text-slate-800">Nguyễn Văn A (Khách hàng mẫu)</span></p>
              <p>Mã số thuế: <span className="font-bold text-slate-800">0312345678</span></p>
              <p className="sm:col-span-2">Địa chỉ: 456 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh</p>
              <p>Điện thoại: 0912345678</p>
              <p>Email: khachhang@example.com</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 text-[9px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[8px] uppercase">
                  <th className="p-1.5 border-r border-slate-200 text-center w-6">STT</th>
                  <th className="p-1.5 border-r border-slate-200">Tên hàng hóa, dịch vụ</th>
                  <th className="p-1.5 border-r border-slate-200 text-center w-10">ĐVT</th>
                  <th className="p-1.5 border-r border-slate-200 text-center w-8">SL</th>
                  <th className="p-1.5 border-r border-slate-200 text-right w-16">Đơn giá</th>
                  <th className="p-1.5 border-r border-slate-200 text-center w-12">Thuế (%)</th>
                  <th className="p-1.5 text-right w-20">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                <tr>
                  <td className="p-1.5 border-r border-slate-200 text-center">1</td>
                  <td className="p-1.5 border-r border-slate-200 font-bold text-slate-800">Sữa tươi tiệt trùng Vinamilk 1L</td>
                  <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">Hộp</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">2</td>
                  <td className="p-1.5 border-r border-slate-200 text-right">35.000 đ</td>
                  <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">8%</td>
                  <td className="p-1.5 text-right font-bold text-slate-800">70.000 đ</td>
                </tr>
                <tr>
                  <td className="p-1.5 border-r border-slate-200 text-center">2</td>
                  <td className="p-1.5 border-r border-slate-200 font-bold text-slate-800">Bánh quy bơ Danisa 454g</td>
                  <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">Hộp</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">1</td>
                  <td className="p-1.5 border-r border-slate-200 text-right">145.000 đ</td>
                  <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">8%</td>
                  <td className="p-1.5 text-right font-bold text-slate-800">145.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Area */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-1.5 font-bold text-slate-700 text-[10px]">
            <div className="flex justify-between text-[9px]">
              <span className="font-semibold text-slate-500">Cộng tiền hàng (Chưa thuế):</span>
              <span>215.000 đ</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="font-semibold text-slate-500">Tổng tiền thuế GTGT (8%):</span>
              <span>17.200 đ</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-[10px] text-slate-950">
              <span>Tổng tiền thanh toán:</span>
              <span className="font-extrabold text-kv-blue-primary">232.200 đ</span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-1.5 text-[8px] font-semibold text-slate-500 italic leading-relaxed">
              Số tiền viết bằng chữ: <span className="text-slate-800 font-bold not-italic">Hai trăm ba mươi hai nghìn hai trăm đồng.</span>
            </div>
            {watchedValues.footerNote && (
              <div className="border-t border-dashed border-slate-200 pt-1.5 text-[8px] font-semibold text-slate-500 italic text-center">
                {watchedValues.footerNote}
              </div>
            )}
          </div>

          {/* Digital Signatures Area */}
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
            {/* Buyer column */}
            <div className="flex flex-col items-center text-center">
              <span className="font-extrabold text-[9px] text-slate-700 uppercase tracking-wide">Người mua hàng</span>
              <span className="text-[7px] text-slate-400 mt-0.5 italic">(Ký, ghi rõ họ tên)</span>
              <div className="h-12 flex items-center justify-center text-slate-300 font-semibold text-[8px] italic">
                (Ký số điện tử)
              </div>
            </div>

            {/* Seller column */}
            <div className="flex flex-col items-center text-center relative">
              <span className="font-extrabold text-[9px] text-slate-700 uppercase tracking-wide">Người bán hàng</span>
              <span className="text-[7px] text-slate-400 mt-0.5 italic">(Ký, đóng dấu điện tử)</span>
              
              <div className="mt-1.5 px-2 py-1.5 border-2 border-rose-500 rounded bg-rose-50/40 text-[7px] text-rose-700 font-bold flex flex-col items-center gap-0.5 rotate-[-2deg] shadow-sm max-w-[160px] leading-normal select-none">
                <span className="text-[8px] text-rose-600 flex items-center gap-1 font-black uppercase">
                  ĐÃ KÝ SỐ ĐIỆN TỬ
                </span>
                <span className="uppercase tracking-wide text-[6px] text-rose-600">{currentUser?.household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}</span>
                <span>MST: {currentUser?.household?.taxCode || "0101234567"}</span>
                <span>Ngày ký: {new Date().toLocaleDateString("vi-VN")}</span>
              </div>
            </div>

            {/* Tax Authority Stamp */}
            <div className="col-span-2 flex justify-center mt-1">
              <div className="px-3 py-1.5 border-2 border-emerald-500 rounded bg-emerald-50/40 text-[7px] text-emerald-800 font-bold flex items-center gap-2 rotate-[1deg] shadow-sm max-w-[280px] leading-normal select-none">
                <div className="flex flex-col text-left">
                  <span className="font-black uppercase tracking-wider text-[8px]">MÃ CƠ QUAN THUẾ CẤP</span>
                  <span className="font-mono text-[8px] tracking-wider text-slate-800 font-extrabold">00E123456789ABCDEF</span>
                  <span>Ngày cấp: {new Date().toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
