import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, X, RefreshCw } from "lucide-react";
import { useGetSyncSessionDetailQuery } from "../services/syncApi";

interface SyncSessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const SyncSessionDetailModal = ({
  isOpen,
  onClose,
  sessionId,
}: SyncSessionDetailModalProps) => {
  const { data, isLoading, isError, refetch } = useGetSyncSessionDetailQuery(sessionId, {
    skip: !isOpen || !sessionId,
  });

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const session = data?.result;
  const isMatched = session?.status === "MATCHED";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                isMatched ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              }`}
            >
              {isMatched ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">
                  Báo cáo đối soát phiên {session?.sessionCode || "..."}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isMatched
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-rose-100 text-rose-700 border border-rose-300"
                  }`}
                >
                  {isMatched ? "KHỚP DỮ LIỆU" : "LỆCH DỮ LIỆU"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Thực hiện bởi:{" "}
                <span className="font-semibold text-slate-700">
                  {session?.userFullName || session?.username || "Hệ thống"}
                </span>{" "}
                • {session?.syncedAt ? new Date(session.syncedAt).toLocaleString("vi-VN") : "--"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-kv-blue-primary" />
              <span className="text-xs font-medium">Đang tải báo cáo đối soát chi tiết...</span>
            </div>
          ) : isError || !session ? (
            <div className="text-center py-12 text-rose-500 text-xs font-bold flex flex-col items-center gap-2">
              <span>Không thể tải thông tin chi tiết phiên đồng bộ.</span>
              <button
                onClick={() => void refetch()}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Đã gửi (Client)
                  </span>
                  <span className="text-lg font-extrabold text-slate-800">{session.totalSent}</span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 block tracking-wider">
                    Đã nhận (Server)
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {session.totalReceived}
                  </span>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-blue-600 block tracking-wider">
                    Trùng bị loại
                  </span>
                  <span className="text-lg font-extrabold text-blue-700">
                    {session.totalDuplicated}
                  </span>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 block tracking-wider">
                    Xung đột
                  </span>
                  <span className="text-lg font-extrabold text-amber-700">
                    {session.totalConflicted}
                  </span>
                </div>
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block tracking-wider">
                    Xử lý lỗi
                  </span>
                  <span className="text-lg font-extrabold text-rose-700 font-black">
                    {session.totalFailed}
                  </span>
                </div>
              </div>

              {/* Status Warning Banner */}
              {!isMatched && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-800">
                      Cảnh báo: Phát hiện chênh lệch đơn hàng trong phiên!
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      Số đơn thiết bị đẩy lên ({session.totalSent}) không trùng khớp hoàn toàn với số
                      đơn máy trị ghi nhận thành công ({session.totalReceived}) + trùng lặp bị loại (
                      {session.totalDuplicated}). Vui lòng đối soát các đơn lỗi bên dưới và chặn xóa dữ
                      liệu tạm trên máy.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Details Audit Table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  Danh sách đối soát chi tiết từng đơn hàng
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-64 shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Mã đơn hàng</th>
                        <th className="py-2.5 px-4 text-center">Trạng thái đối soát</th>
                        <th className="py-2.5 px-4">Ghi chú đối soát</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {session.details && session.details.length > 0 ? (
                        session.details.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-slate-700">
                              {item.orderNumber}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === "SUCCESS"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : item.status === "DUPLICATE"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : item.status === "CONFLICT"
                                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                                    : "bg-rose-50 text-rose-600 border border-rose-200"
                                }`}
                              >
                                {item.status === "SUCCESS"
                                  ? "Thành công"
                                  : item.status === "DUPLICATE"
                                  ? "Đã có sẵn (Trùng)"
                                  : item.status === "CONFLICT"
                                  ? "Xung đột"
                                  : "Gửi lỗi"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {item.note || "--"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-slate-400 italic">
                            Không có thông tin đơn chi tiết cho phiên đồng bộ này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
