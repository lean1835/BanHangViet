import React from "react";
import { TAX_AUTHORITY_UI } from "@/constants/taxAuthority";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import type { IInvoiceErrorNotice } from "@/modules/e_invoice/types/IInvoiceErrorNotice";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { InvoiceDetailModal } from "@/modules/e_invoice/components/InvoiceDetailModal";
import { ErrorNoticeDetailModal } from "@/modules/e_invoice/components/ErrorNoticeDetailModal";
import {
  getStatusClassName,
  getStatusLabel,
} from "@/modules/e_invoice/utils/eInvoiceHelpers";
import { formatDate } from "@/utils/dateFormatter";
import { Eye, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export type TaxApprovalTab = "waiting" | "history" | "error_notices";

export interface TaxInvoiceApprovalPageProps {
  waitingInvoices: IInvoice[];
  historyInvoices: IInvoice[];
  errorNotices?: IInvoiceErrorNotice[];
  activeTab: TaxApprovalTab;
  onTabChange: (tab: TaxApprovalTab) => void;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRejectNotice?: (id: string, reason?: string) => Promise<void>;
}

const getHandlingTypeBadge = (type: string) => {
  switch (type) {
    case "CANCEL":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Hủy</span>;
    case "ADJUST":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Điều chỉnh</span>;
    case "REPLACE":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Thay thế</span>;
    case "EXPLAIN":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Giải trình</span>;
    default:
      return <span className="text-xs text-slate-500">{type || "-"}</span>;
  }
};

const getNoticeStatusBadge = (status: string) => {
  switch (status) {
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <Clock className="w-3 h-3" /> Bản nháp
        </span>
      );
    case "WAITING_TAX_RESPONSE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 animate-spin" /> Chờ CQT phản hồi
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Đã tiếp nhận
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> CQT từ chối
        </span>
      );
    default:
      return <span className="text-xs text-slate-500">{status}</span>;
  }
};

export const TaxInvoiceApprovalPage: React.FC<TaxInvoiceApprovalPageProps> = ({
  waitingInvoices,
  historyInvoices,
  errorNotices = [],
  activeTab,
  onTabChange,
  isLoading,
  isError,
  error,
  onApprove,
  onReject,
  onRejectNotice,
}) => {
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<IInvoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = React.useState<string | null>(null);
  const [isNoticeDetailOpen, setIsNoticeDetailOpen] = React.useState(false);

  const handleAction = async (id: string, actionFn: (id: string) => Promise<void>) => {
    setProcessingId(id);
    try {
      await actionFn(id);
    } finally {
      setProcessingId(null);
    }
  };

  const displayedInvoices = activeTab === "waiting" ? waitingInvoices : historyInvoices;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Tổng hóa đơn tiếp nhận
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {waitingInvoices.length + historyInvoices.length} {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            Tổng số hóa đơn truyền sang CQT
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {TAX_AUTHORITY_UI.SUMMARY.WAITING_TITLE}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {waitingInvoices.length} {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            {TAX_AUTHORITY_UI.SUMMARY.WAITING_DETAIL}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Hóa đơn đã xử lý
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {historyInvoices.length} {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            Đã duyệt cấp mã hoặc từ chối
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Thông báo sai sót
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {errorNotices.length} thông báo
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            Tiếp nhận từ các hộ kinh doanh
          </div>
        </div>
      </div>

      {/* Main Panel with Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => onTabChange("waiting")}
            className={`px-5 py-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "waiting"
                ? "border-kv-blue-primary text-kv-blue-primary bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/20"
            }`}
          >
            Hóa đơn chờ duyệt
            {waitingInvoices.length > 0 && (
              <span className="bg-amber-500 text-white rounded-full text-[9px] px-1.5 py-0.5 font-extrabold">
                {waitingInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange("history")}
            className={`px-5 py-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "border-kv-blue-primary text-kv-blue-primary bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/20"
            }`}
          >
            Lịch sử xử lý hóa đơn
          </button>
          <button
            onClick={() => onTabChange("error_notices")}
            className={`px-5 py-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "error_notices"
                ? "border-kv-blue-primary text-kv-blue-primary bg-slate-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/20"
            }`}
          >
            Thông báo sai sót
            {errorNotices.length > 0 && (
              <span className="bg-indigo-500 text-white rounded-full text-[9px] px-1.5 py-0.5 font-extrabold">
                {errorNotices.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-kv-blue-primary" />
              <span className="text-slate-500 font-bold text-xs">Đang tải danh sách từ Cơ quan Thuế...</span>
            </div>
          ) : isError ? (
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 text-rose-700 text-xs font-bold text-center">
              Có lỗi xảy ra khi đồng bộ dữ liệu: {getApiErrorMessage(error, "Lỗi kết nối API.")}
            </div>
          ) : activeTab === "error_notices" ? (
            // Tab 3: Error Notices
            errorNotices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <span>Chưa có thông báo sai sót Mẫu 04/SS-HĐĐT nào được gửi tới Cơ quan Thuế.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Mã thông báo</th>
                      <th className="p-3">Hóa đơn sai sót</th>
                      <th className="p-3 text-center">Hình thức xử lý</th>
                      <th className="p-3">Lý do sai sót</th>
                      <th className="p-3 text-center">Trạng thái CQT</th>
                      <th className="p-3">Mã tiếp nhận CQT</th>
                      <th className="p-3">Ngày gửi</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {errorNotices.map((notice) => (
                      <tr
                        key={notice.id}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedNoticeId(notice.id);
                          setIsNoticeDetailOpen(true);
                        }}
                      >
                        <td className="p-3 font-mono font-bold text-indigo-700">
                          {notice.noticeCode}
                        </td>
                        <td className="p-3">
                          {notice.items && notice.items.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {notice.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                                  <span className="font-bold">#{item.invoiceNumber || item.invoiceLookupCode || "HĐ"}</span>
                                  {item.invoiceSeries && (
                                    <span className="text-slate-400">({item.invoiceSeries})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Không có</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {notice.items && notice.items.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              {notice.items.map((item, idx) => (
                                <span key={idx}>{getHandlingTypeBadge(item.handlingType)}</span>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 max-w-[220px] truncate text-slate-600">
                          {notice.items && notice.items[0]?.reason ? (
                            <span>{notice.items[0].reason}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {getNoticeStatusBadge(notice.status)}
                        </td>
                        <td className="p-3 font-mono text-xs font-bold text-slate-600">
                          {notice.taxAuthorityCode || (
                            <span className="text-slate-400 font-normal italic">Chưa cấp</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-slate-500 font-mono">
                          {notice.sentToTaxAt
                            ? formatDate(notice.sentToTaxAt, "dd/MM/yyyy HH:mm")
                            : formatDate(notice.createdAt, "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNoticeId(notice.id);
                                setIsNoticeDetailOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold transition-colors"
                              title="Xem tờ khai Mẫu 04/SS-HĐĐT"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem tờ khai
                            </button>
                            {notice.status === "WAITING_TAX_RESPONSE" && onRejectNotice && (
                              <button
                                type="button"
                                disabled={processingId === notice.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(notice.id, (id) =>
                                    onRejectNotice(id, "Dữ liệu thông báo sai sót không hợp lệ.")
                                  );
                                }}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] disabled:opacity-50"
                              >
                                {processingId === notice.id ? "..." : "Từ chối"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : displayedInvoices.length === 0 ? (
            // Tab 1 & 2 empty
            <div className="text-center py-12 text-slate-400 font-bold text-xs">
              {activeTab === "waiting"
                ? "Không tìm thấy hóa đơn nào trong hàng đợi cần duyệt."
                : "Lịch sử xử lý hóa đơn rỗng."}
            </div>
          ) : (
            // Tab 1 & 2 table
            <div className="overflow-x-auto">
              <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">{TAX_AUTHORITY_UI.APPROVAL.COLUMNS.INVOICE_CODE}</th>
                    <th className="p-3">Khách hàng / Người mua</th>
                    <th className="p-3 text-right">Tổng tiền</th>
                    <th className="p-3 text-center">Trạng thái thuế</th>
                    {activeTab === "waiting" ? (
                      <>
                        <th className="p-3">Mã CQT cấp</th>
                        <th className="p-3 text-center">Hành động CQT</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3">Mã CQT cấp / Phản hồi lỗi</th>
                        <th className="p-3">Ngày xử lý</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {displayedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {invoice.lookupCode}
                      </td>
                      <td className="p-3 text-slate-700 font-bold">{invoice.customer || invoice.buyerName}</td>
                      <td className="p-3 text-right font-bold text-kv-blue-primary">
                        {formatCurrency(invoice.finalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusClassName(invoice.status)}`}
                        >
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      {activeTab === "waiting" ? (
                        <>
                          <td className="p-3 font-mono font-bold text-xs text-slate-500">
                            {invoice.taxAuthorityCode || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                disabled={processingId === invoice.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(invoice.id, onApprove);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px] disabled:opacity-50"
                              >
                                {processingId === invoice.id ? "..." : TAX_AUTHORITY_UI.APPROVAL.APPROVE_ACTION}
                              </button>
                              <button
                                disabled={processingId === invoice.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(invoice.id, onReject);
                                }}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] disabled:opacity-50"
                              >
                                {processingId === invoice.id ? "..." : TAX_AUTHORITY_UI.APPROVAL.REJECT_ACTION}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-xs font-semibold text-slate-600 max-w-[250px] truncate">
                            {invoice.status === "ISSUED" ? (
                              <span className="font-mono font-bold text-slate-500">{invoice.taxAuthorityCode}</span>
                            ) : invoice.status === "SEND_ERROR" ? (
                              <span className="text-rose-600 text-xs italic">{invoice.taxAuthorityResponse || "Dữ liệu hóa đơn không hợp lệ."}</span>
                            ) : invoice.status === "CANCELED" ? (
                              <span className="text-slate-500 italic">Đã hủy (Lý do: {invoice.cancelReason || "Không có"})</span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-xs text-slate-500 font-mono">
                            {invoice.taxResponseAt ? invoice.taxResponseAt.replace("T", " ").substring(0, 19) : (invoice.createdAt || invoice.time || "-")}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isDetailOpen && selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          currentRole="VT-05" // Tax Authority
          onSendToTax={async () => {}}
          onResendToTax={async () => {}}
          onCancelInvoice={async () => {}}
          onUpdateInvoice={async () => {}}
        />
      )}

      {isNoticeDetailOpen && selectedNoticeId && (
        <ErrorNoticeDetailModal
          isOpen={isNoticeDetailOpen}
          onClose={() => {
            setIsNoticeDetailOpen(false);
            setSelectedNoticeId(null);
          }}
          noticeId={selectedNoticeId}
        />
      )}
    </div>
  );
};

export default TaxInvoiceApprovalPage;

