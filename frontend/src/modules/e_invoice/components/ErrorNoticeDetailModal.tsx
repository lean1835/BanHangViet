import React from "react";
import { X, Printer, Send, AlertCircle, CheckCircle2, FileText, Clock } from "lucide-react";
import { formatDate } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  useGetErrorNoticeQuery,
  useSendErrorNoticeToTaxMutation,
} from "../services/invoiceErrorNoticeApi";

interface ErrorNoticeDetailModalProps {
  noticeId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getHandlingTypeLabel = (type: string): string => {
  switch (type) {
    case "CANCEL":
      return "Hủy";
    case "ADJUST":
      return "Điều chỉnh";
    case "REPLACE":
      return "Thay thế";
    case "EXPLAIN":
      return "Giải trình";
    default:
      return type || "-";
  }
};

export const ErrorNoticeDetailModal: React.FC<ErrorNoticeDetailModalProps> = ({
  noticeId,
  isOpen,
  onClose,
}) => {
  const { showError, showSuccess } = useNotification();

  const {
    data: noticeResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetErrorNoticeQuery(noticeId, {
    skip: !isOpen || !noticeId,
  });

  const [sendNoticeApi, { isLoading: isSending }] = useSendErrorNoticeToTaxMutation();

  const notice = noticeResponse?.result;

  if (!isOpen) return null;

  const handleSendToTax = async () => {
    if (!notice) return;
    try {
      await sendNoticeApi(notice.id).unwrap();
      showSuccess("Đã gửi thông báo sai sót tới Cơ quan Thuế thành công!");
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể gửi thông báo sai sót tới Cơ quan Thuế."));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-kv-orange-accent flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Chi tiết Thông báo hóa đơn có sai sót
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Mã thông báo: <strong className="font-mono text-slate-700">{notice?.noticeCode || noticeId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !notice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In</span>
            </button>

            {notice?.status === "DRAFT" && (
              <button
                type="button"
                onClick={handleSendToTax}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-kv-blue-primary hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "Đang gửi..." : "Gửi Cơ quan Thuế"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-2"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
              <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">Đang tải chi tiết thông báo sai sót...</p>
            </div>
          )}

          {isError && (
            <div className="bg-white p-8 rounded-xl border border-red-200 text-center max-w-md my-auto shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                Không thể tải thông báo sai sót
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {error && "data" in error
                  ? String((error as { data: { message?: string } }).data?.message)
                  : "Vui lòng thử lại sau."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Thử lại
              </button>
            </div>
          )}

          {notice && (
            <div className="relative w-full max-w-[800px] bg-white border border-slate-300 rounded-xl p-8 sm:p-10 shadow-lg text-slate-800 text-[11px] leading-relaxed print:border-none print:shadow-none print:p-0">
              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center mb-6">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-semibold text-[11px] underline underline-offset-4 text-slate-700">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <p className="text-[10px] text-slate-500 mt-2 italic">
                  {notice.noticePlace || "TP. Hồ Chí Minh"}, ngày {formatDate(notice.createdAt)}
                </p>
              </div>

              {/* Title */}
              <div className="text-center mb-6 border-b border-slate-200 pb-4">
                <h2 className="text-base font-black text-slate-900 uppercase">
                  THÔNG BÁO HÓA ĐƠN ĐIỆN TỬ CÓ SAI SÓT
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  (Ban hành kèm theo Nghị định số 123/2020/NĐ-CP)
                </p>
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Mã thông báo:</span>
                  <span className="font-mono font-bold text-slate-800">{notice.noticeCode}</span>
                  <span className="text-slate-300">|</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      notice.status === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : notice.status === "DRAFT"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-red-50 text-red-700 border-red-300"
                    }`}
                  >
                    {notice.status === "ACCEPTED"
                      ? "Đã tiếp nhận"
                      : notice.status === "DRAFT"
                      ? "Bản nháp"
                      : "Bị từ chối"}
                  </span>
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <p className="font-medium text-slate-700">
                  Kính gửi:{" "}
                  <strong className="text-slate-900">
                    {notice.taxAuthorityName || "Cơ quan Thuế quản lý trực tiếp"}
                  </strong>
                </p>
                <p className="text-slate-600 mt-1">
                  Người lập thông báo:{" "}
                  <strong className="text-slate-900">{notice.createdByUserName || "-"}</strong>
                </p>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px]">
                      <th className="p-2 border-r border-slate-300 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-300">Mẫu số</th>
                      <th className="p-2 border-r border-slate-300">Ký hiệu</th>
                      <th className="p-2 border-r border-slate-300">Số hóa đơn</th>
                      <th className="p-2 border-r border-slate-300">Mã CQT cấp</th>
                      <th className="p-2 border-r border-slate-300 text-center">Tính chất sai sót</th>
                      <th className="p-2">Lý do sai sót</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {notice.items && notice.items.length > 0 ? (
                      notice.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-bold">
                            {item.invoicePattern || "1"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">
                            {item.invoiceSymbol || "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-extrabold text-slate-900">
                            {item.invoiceNumber || "(Chưa cấp)"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono text-slate-600">
                            {item.taxAuthorityCode || "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center">
                            <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                              {getHandlingTypeLabel(item.handlingType)}
                            </span>
                          </td>
                          <td className="p-2 font-medium text-slate-800">{item.reason}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          Không có dòng hóa đơn nào trong thông báo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tax Response Block */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
                <div className="flex items-center gap-2 mb-2">
                  {notice.status === "ACCEPTED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    Kết quả tiếp nhận của Cơ quan Thuế
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500">Mã số tiếp nhận CQT: </span>
                    <strong className="font-mono text-emerald-700">
                      {notice.taxAuthorityCode || "(Chưa tiếp nhận)"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Thời điểm phản hồi: </span>
                    <strong className="text-slate-800">
                      {notice.taxResponseAt ? formatDate(notice.taxResponseAt) : "-"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
