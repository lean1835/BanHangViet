import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Printer,
  Ban,
  FileEdit,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { useAppSelector } from "@/hooks/useRedux";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { E_INVOICE_STATUS, E_INVOICE_DEFAULTS, type TEInvoiceStatus } from "@/constants/eInvoice";
import {
  recordInvoiceCancellation,
  resolveActorInfo,
} from "@/modules/anomaly_alert/utils/anomalyStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IInvoice, IInvoiceStatusLog } from "../types/IInvoice";
import type { IDeliveryLog } from "../types/IInvoiceDelivery";
import {
  useGetInvoiceQuery,
  useSubmitToTaxMutation,
  useResendInvoiceMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetInvoiceLogsQuery,
} from "../services/eInvoiceApi";
import { CancelInvoiceModal } from "../components/CancelInvoiceModal";
import { SendInvoiceModal } from "../components/SendInvoiceModal";
import { PrintInvoiceModal } from "../components/PrintInvoiceModal";
import {
  getStatusClassName,
  getStatusLabel,
  convertNumberToWords,
} from "../utils/eInvoiceHelpers";

const formatInvoiceDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString || "";
  }
};

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const {
    isOnline,
    invoices: mockInvoices,
    addLogEntry,
    currentRole,
  } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const isOwnerOrAccountant =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;
  const isTaxAuthority = currentRole === USER_ROLES.TAX_AUTHORITY;

  // Sub-modals state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<IDeliveryLog[]>([]);
  const [isActionPending, setIsActionPending] = useState(false);

  // Queries & Mutations
  const {
    data: apiInvoiceResponse,
    isLoading: isApiLoading,
    refetch,
  } = useGetInvoiceQuery(id || "", {
    skip: !id || !isOnline,
  });

  const [submitToTaxApi] = useSubmitToTaxMutation();
  const [resendInvoiceApi] = useResendInvoiceMutation();
  const [cancelInvoiceApi] = useCancelInvoiceMutation();
  const [updateInvoiceApi] = useUpdateInvoiceMutation();

  // Invoice resolution (API response or Local fallback)
  const invoice: IInvoice | null = useMemo(() => {
    if (apiInvoiceResponse?.result) {
      return apiInvoiceResponse.result;
    }
    if (id) {
      return mockInvoices.find((inv) => inv.id === id || inv.lookupCode === id) || null;
    }
    return null;
  }, [apiInvoiceResponse, id, mockInvoices]);

  // Buyer Info edit states
  const [buyerName, setBuyerName] = useState("");
  const [buyerTaxCode, setBuyerTaxCode] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  useEffect(() => {
    if (invoice) {
      setBuyerName(invoice.buyerName || invoice.customer || "");
      setBuyerTaxCode(invoice.buyerTaxCode || "");
      setBuyerAddress(invoice.buyerAddress || "");
      setBuyerPhone(invoice.buyerPhone || "");
      setBuyerEmail(invoice.buyerEmail || "");
      if (invoice.deliveryLogs) {
        setDeliveryLogs(invoice.deliveryLogs);
      }
    }
  }, [invoice]);

  // Status Logs Query from Backend API
  const { data: logsResponse } = useGetInvoiceLogsQuery(invoice?.id || "", {
    skip: !invoice?.id || !isOnline,
  });
  const backendLogs = logsResponse?.result;

  if (isApiLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Đang tải chi tiết hóa đơn điện tử...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-4 text-center max-w-lg mx-auto mt-12">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Không tìm thấy hóa đơn điện tử
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Hóa đơn không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.E_INVOICES)}
          className="flex items-center gap-1.5 px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-lg hover:bg-kv-blue-dark transition-all"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách hóa đơn
        </button>
      </div>
    );
  }

  const canCancel = invoice.status === E_INVOICE_STATUS.ISSUED && isOwnerOrAccountant;

  const handleSendToTaxClick = async () => {
    setIsActionPending(true);
    try {
      // 1. Save inputs
      if (isOnline) {
        await updateInvoiceApi({
          invoiceId: invoice.id,
          buyerName: buyerName.trim(),
          buyerTaxCode: buyerTaxCode.trim(),
          buyerAddress: buyerAddress.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim(),
        }).unwrap();
      }

      // 2. Resend/Send to tax
      if (invoice.status === E_INVOICE_STATUS.SEND_ERROR) {
        if (isOnline) {
          await resendInvoiceApi(invoice.id).unwrap();
        }
        addLogEntry("Gửi lại CQT", `Gửi lại hóa đơn ${invoice.lookupCode} sang Cơ quan Thuế.`);
        showSuccess("Đã gửi lại hóa đơn sang Cơ quan Thuế thành công!");
      } else {
        if (isOnline) {
          await submitToTaxApi(invoice.id).unwrap();
        }
        addLogEntry("Gửi hóa đơn CQT", `Đã gửi hóa đơn ${invoice.lookupCode} sang Cơ quan Thuế.`);
        showSuccess("Đã gửi hóa đơn điện tử sang Cơ quan Thuế thành công!");
      }
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Gửi CQT thất bại"));
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    const { username: actorUsername, fullName: actorFullName } = resolveActorInfo(
      authUser?.username || currentRole,
      authUser?.fullName
    );

    try {
      if (isOnline) {
        const res = await cancelInvoiceApi({
          invoiceId: invoice.id,
          cancelReason: reason,
        }).unwrap();
        const updatedInvoice = res?.result;
        recordInvoiceCancellation({
          invoiceNumber: updatedInvoice?.invoiceNumber || invoice.invoiceNumber || invoice.lookupCode,
          lookupCode: updatedInvoice?.lookupCode || invoice.lookupCode,
          actorUsername,
          actorFullName,
          reason,
          amount: updatedInvoice?.finalAmount ?? updatedInvoice?.amount ?? invoice.finalAmount ?? invoice.amount,
        });
      } else {
        recordInvoiceCancellation({
          invoiceNumber: invoice.invoiceNumber || invoice.lookupCode,
          lookupCode: invoice.lookupCode,
          actorUsername,
          actorFullName,
          reason,
          amount: invoice.finalAmount ?? invoice.amount,
        });
      }
      addLogEntry("HỦY_HÓA_ĐƠN", `Hủy hóa đơn ${invoice.lookupCode}. Lý do: ${reason}`);
      showSuccess("Hủy hóa đơn điện tử thành công.");
      setShowCancelModal(false);
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể hủy hóa đơn."));
    }
  };

  // Build timeline events
  const timelineEvents =
    backendLogs && backendLogs.length > 0
      ? backendLogs.map((log: IInvoiceStatusLog) => {
          const isTaxResponse =
            log.toStatus === E_INVOICE_STATUS.ISSUED ||
            log.toStatus === E_INVOICE_STATUS.SEND_ERROR;
          const performer = isTaxResponse
            ? "Cơ quan Thuế"
            : log.changedByFullName
            ? `Thực hiện: ${log.changedByFullName}`
            : "Hệ thống";

          return {
            title: getStatusLabel(log.toStatus as TEInvoiceStatus) || "Chuyển trạng thái",
            time: log.createdAt,
            description: `${log.notes || "Thao tác hệ thống"} (${performer})`,
            active: true,
            error: log.toStatus === E_INVOICE_STATUS.SEND_ERROR,
            warning: log.toStatus === E_INVOICE_STATUS.CANCELED,
          };
        })
      : [
          {
            title: "Khởi tạo hóa đơn",
            time: invoice.createdAt || invoice.time,
            description: `Khởi tạo hóa đơn nháp từ đơn hàng ${invoice.orderNumber || ""}.`,
            active: true,
            error: false,
            warning: false,
          },
          {
            title: "Gửi cơ quan thuế",
            time: invoice.sentToTaxAt || invoice.createdAt || invoice.time,
            description: "Hệ thống đã gửi dữ liệu lên Cơ quan Thuế.",
            active:
              invoice.status === E_INVOICE_STATUS.WAITING_TAX_CODE ||
              invoice.status === E_INVOICE_STATUS.ISSUED ||
              invoice.status === E_INVOICE_STATUS.SEND_ERROR ||
              invoice.status === E_INVOICE_STATUS.ADJUSTED ||
              !!invoice.sentToTaxAt,
            error: false,
            warning: false,
          },
          {
            title:
              invoice.status === E_INVOICE_STATUS.SEND_ERROR
                ? "Cơ quan thuế từ chối"
                : "Cơ quan thuế cấp mã",
            time: invoice.taxResponseAt,
            description:
              invoice.status === E_INVOICE_STATUS.SEND_ERROR
                ? `Lỗi: ${invoice.taxAuthorityResponse || "Dữ liệu hóa đơn không hợp lệ."}`
                : `Cấp mã thành công: ${invoice.taxAuthorityCode || ""}`,
            active:
              invoice.status === E_INVOICE_STATUS.ISSUED ||
              invoice.status === E_INVOICE_STATUS.SEND_ERROR ||
              invoice.status === E_INVOICE_STATUS.ADJUSTED ||
              !!invoice.taxResponseAt,
            error: invoice.status === E_INVOICE_STATUS.SEND_ERROR,
            warning: false,
          },
          {
            title: "Hủy hóa đơn",
            time: invoice.canceledAt,
            description: `Hóa đơn đã bị hủy bởi ${invoice.canceledByUsername || "Chủ hộ/Kế toán"}. Lý do: ${
              invoice.cancelReason || "Không có"
            }`,
            active: invoice.status === E_INVOICE_STATUS.CANCELED,
            error: false,
            warning: true,
          },
        ].filter((e) => e.active);

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 sm:p-6 pb-24 animate-page-enter">
        {/* Top Header Navigation */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.E_INVOICES)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Quay lại danh sách</span>
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  Chi tiết hóa đơn điện tử: {invoice.lookupCode}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusClassName(
                    invoice.status
                  )}`}
                >
                  {getStatusLabel(invoice.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Số HĐ: <span className="font-mono text-kv-blue-primary font-bold">{invoice.invoiceNumber || "Chưa cấp số"}</span>
                {invoice.invoiceSymbol && (
                  <> • Ký hiệu: <span className="font-mono text-slate-700">{invoice.invoiceSymbol || invoice.symbol}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <Printer size={14} />
              <span>In hóa đơn</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Left (Invoice Document Paper) + Right (Timeline & Actions) */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Column: Standard Electronic Invoice Document Paper */}
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-[10px] text-slate-800 font-medium relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] text-slate-800 text-[3.5rem] font-extrabold rotate-[30deg] uppercase whitespace-nowrap">
              Hóa đơn điện tử
            </div>

            {/* Invoice Header */}
            <div className="flex justify-between border-b pb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-kv-blue-primary tracking-wide uppercase">
                  {invoice.title || "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"}
                </h2>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                  (Bản mô phỏng hóa đơn điện tử)
                </p>
                <div className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-2">
                  <span>Ngày lập: {formatInvoiceDateTime(invoice.createdAt || invoice.time)}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${getStatusClassName(
                      invoice.status
                    )}`}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col gap-0.5 font-bold text-slate-600 text-[10px]">
                <p>
                  Mẫu số: <span className="text-slate-800 font-extrabold">{invoice.invoicePattern || "1"}</span>
                </p>
                <p>
                  Ký hiệu: <span className="text-slate-800 font-extrabold">{invoice.invoiceSymbol || invoice.symbol}</span>
                </p>
                <p>
                  Số HĐ:{" "}
                  <span className="text-kv-blue-primary font-mono font-extrabold">
                    {invoice.invoiceNumber || "Chưa cấp số"}
                  </span>
                </p>
                <p>
                  Mã tra cứu: <span className="text-slate-800 font-mono font-extrabold">{invoice.lookupCode}</span>
                </p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
              <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">
                Đơn vị bán hàng: {invoice.householdName || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
              </p>
              <p>
                Mã số thuế: <span className="font-bold text-slate-800">{invoice.householdTaxCode || "-"}</span>
              </p>
              <p>Địa chỉ: {invoice.householdAddress || "-"}</p>
              <p>Điện thoại: {invoice.householdPhone || "-"}</p>
            </div>

            {/* Buyer Info */}
            <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
              <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">
                Thông tin người mua hàng
              </p>
              {!isTaxAuthority &&
              (invoice.status === E_INVOICE_STATUS.DRAFT || invoice.status === E_INVOICE_STATUS.SEND_ERROR) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Họ tên người mua
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Khách vãng lai"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Mã số thuế
                    </label>
                    <input
                      type="text"
                      value={buyerTaxCode}
                      onChange={(e) => setBuyerTaxCode(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Mã số thuế..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Địa chỉ..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Điện thoại
                    </label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Số điện thoại..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Email..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <p>
                    Họ tên người mua:{" "}
                    <span className="font-bold text-slate-800">
                      {invoice.buyerName || invoice.customer || "Khách vãng lai"}
                    </span>
                  </p>
                  <p>
                    Mã số thuế: <span className="font-bold text-slate-800">{invoice.buyerTaxCode || "-"}</span>
                  </p>
                  <p className="sm:col-span-2">Địa chỉ: {invoice.buyerAddress || "-"}</p>
                  <p>Điện thoại: {invoice.buyerPhone || "-"}</p>
                  <p>Email: {invoice.buyerEmail || "-"}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[9px] uppercase">
                    <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                    <th className="p-2 border-r border-slate-200">Tên hàng hóa, dịch vụ</th>
                    <th className="p-2 border-r border-slate-200 text-center w-12">ĐVT</th>
                    <th className="p-2 border-r border-slate-200 text-center w-12">SL</th>
                    <th className="p-2 border-r border-slate-200 text-right w-20">Đơn giá</th>
                    <th className="p-2 border-r border-slate-200 text-center w-14">Thuế (%)</th>
                    <th className="p-2 text-right w-24">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                          {item.productName}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">
                          {item.unit || "Lon"}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">
                          {item.taxRatePercentage}%
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {formatCurrency(item.subtotal || item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2 border-r border-slate-200 text-center">1</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                        Hàng hóa tổng hợp (Lĩnh vực bán lẻ)
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">Lần</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">1</td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">8%</td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {formatCurrency(invoice.amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Area */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 font-bold text-slate-700 text-xs">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-slate-500">Cộng tiền hàng (Chưa thuế):</span>
                <span>{formatCurrency(invoice.totalAmountBeforeTax || invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-slate-500">Tổng tiền thuế GTGT:</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-[10px] text-rose-500">
                  <span className="font-semibold">Chiết khấu thương mại:</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-950">
                <span>Tổng tiền thanh toán:</span>
                <span className="font-extrabold text-kv-blue-primary">
                  {formatCurrency(invoice.finalAmount)}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-2 text-[9px] font-semibold text-slate-500 italic leading-relaxed">
                Số tiền viết bằng chữ:{" "}
                <span className="text-slate-800 font-bold not-italic">
                  {convertNumberToWords(invoice.finalAmount)}
                </span>
              </div>
              {invoice.footerNote && (
                <div className="border-t border-dashed border-slate-200 pt-2 text-[9px] font-semibold text-slate-500 italic text-center">
                  {invoice.footerNote}
                </div>
              )}
            </div>

            {/* Digital Signatures Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-100">
              {/* Buyer column */}
              <div className="flex flex-col items-center text-center">
                <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">
                  Người mua hàng
                </span>
                <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-center justify-center text-slate-300 font-semibold text-[9px] italic">
                  (Ký số điện tử)
                </div>
              </div>

              {/* Seller column */}
              <div className="flex flex-col items-center text-center relative">
                <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">
                  Người bán hàng
                </span>
                <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, đóng dấu điện tử)</span>

                {invoice.status !== E_INVOICE_STATUS.DRAFT ? (
                  <div className="mt-2.5 px-3 py-2 border-2 border-rose-500 rounded bg-rose-50/40 text-[8px] text-rose-700 font-bold flex flex-col items-center gap-0.5 rotate-[-2deg] shadow-sm max-w-[180px] leading-normal select-none">
                    <span className="text-[9px] text-rose-600 flex items-center gap-1 font-black uppercase">
                      ĐÃ KÝ SỐ ĐIỆN TỬ
                    </span>
                    <span className="uppercase tracking-wide text-[7px] text-rose-600">
                      {invoice.householdName || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                    </span>
                    <span>MST: {invoice.householdTaxCode || "-"}</span>
                    <span>Ngày ký: {formatInvoiceDateTime(invoice.createdAt || invoice.time)}</span>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-300 font-semibold text-[9px] italic">
                    (Chưa ký số)
                  </div>
                )}
              </div>

              {/* Tax Authority Stamp for ISSUED invoices */}
              {invoice.status === E_INVOICE_STATUS.ISSUED &&
                invoice.taxAuthorityCode &&
                invoice.taxAuthorityCode !== E_INVOICE_DEFAULTS.EMPTY_TAX_AUTHORITY_CODE && (
                  <div className="col-span-1 sm:col-span-2 flex justify-center mt-2">
                    <div className="px-4 py-2 border-2 border-emerald-500 rounded bg-emerald-50/40 text-[8px] text-emerald-800 font-bold flex items-center gap-3 rotate-[1deg] shadow-sm max-w-[320px] leading-normal select-none">
                      <div className="flex flex-col text-left">
                        <span className="font-black uppercase tracking-wider text-[9px]">
                          MÃ CƠ QUAN THUẾ CẤP
                        </span>
                        <span className="font-mono text-[9px] tracking-wider text-slate-800 font-extrabold">
                          {invoice.taxAuthorityCode}
                        </span>
                        <span>Ngày cấp: {formatInvoiceDateTime(invoice.taxResponseAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Right Column: Status Timeline & Action Toolbar Panel */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
            {/* Status Timeline Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-slate-800 text-xs border-b pb-2.5 uppercase tracking-wide">
                Lịch sử trạng thái
              </h3>
              <div className="relative border-l border-slate-200 pl-4 ml-2 flex flex-col gap-5 text-[10px] py-1">
                {timelineEvents.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Node */}
                    <span
                      className={`absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white ${
                        event.error
                          ? "border-rose-500 text-rose-500"
                          : event.warning
                          ? "border-amber-500 text-amber-500"
                          : "border-kv-blue-primary text-kv-blue-primary"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          event.error
                            ? "bg-rose-500"
                            : event.warning
                            ? "bg-amber-500"
                            : "bg-kv-blue-primary"
                        }`}
                      />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-slate-800 text-xs">{event.title}</span>
                      <span className="font-bold text-slate-400 font-mono text-[9px]">
                        {event.time ? formatDate(event.time) : "Đang chờ..."}
                      </span>
                      <p className="text-slate-500 leading-normal font-medium mt-1 pr-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Tools Card */}
            {!isTaxAuthority && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-xs border-b pb-2.5 uppercase tracking-wide">
                  Thao tác nghiệp vụ
                </h3>

                <div className="flex flex-col gap-2.5 font-bold">
                  {/* Send invoice to customer */}
                  {invoice.status === E_INVOICE_STATUS.ISSUED && (
                    <button
                      type="button"
                      onClick={() => setShowSendModal(true)}
                      className="w-full flex min-h-9 py-2 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      GỬI HÓA ĐƠN CHO KHÁCH
                    </button>
                  )}

                  {/* Submit / Resend to tax authority */}
                  {(invoice.status === E_INVOICE_STATUS.DRAFT ||
                    invoice.status === E_INVOICE_STATUS.SEND_ERROR) && (
                    <button
                      type="button"
                      onClick={handleSendToTaxClick}
                      disabled={isActionPending}
                      className="w-full flex min-h-9 py-2 items-center justify-center rounded-lg bg-kv-blue-primary text-white text-xs font-bold hover:bg-kv-blue-dark transition-colors shadow-sm disabled:cursor-wait disabled:opacity-60"
                    >
                      {isActionPending ? (
                        <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      )}
                      {invoice.status === E_INVOICE_STATUS.SEND_ERROR
                        ? "SỬA LỖI & GỬI LẠI THUẾ"
                        : "GỬI CƠ QUAN THUẾ"}
                    </button>
                  )}

                  {/* Cancel invoice */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      disabled={isActionPending}
                      className="w-full flex min-h-9 py-2 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm disabled:opacity-60"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      YÊU CẦU HỦY HÓA ĐƠN
                    </button>
                  )}

                  {/* Adjust invoice */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => navigate(APP_ROUTES.E_INVOICES_ADJUST(invoice.id))}
                      className="w-full flex min-h-9 py-2 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 hover:text-amber-800 transition-colors shadow-sm"
                    >
                      <FileEdit className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      LẬP HÓA ĐƠN ĐIỀU CHỈNH
                    </button>
                  )}

                  {/* Return ticket creation */}
                  {invoice.status === E_INVOICE_STATUS.ISSUED &&
                    (currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.CASHIER) && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`${APP_ROUTES.RETURN_TICKET_CREATE}?invoiceId=${invoice.id}`)
                        }
                        className="w-full flex min-h-9 py-2 items-center justify-center rounded-lg border border-kv-blue-primary/40 bg-kv-blue-primary/10 text-kv-blue-primary text-xs font-bold hover:bg-kv-blue-primary hover:text-white transition-all shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        LẬP PHIẾU TRẢ HÀNG
                      </button>
                    )}

                  {currentRole === USER_ROLES.CASHIER && invoice.status === E_INVOICE_STATUS.ISSUED && (
                    <span className="text-[10px] text-slate-400 font-semibold italic text-center p-2 border border-dashed rounded-lg">
                      Tài khoản thu ngân không được quyền thực hiện điều chỉnh hoặc hủy hóa đơn.
                    </span>
                  )}

                  {invoice.status === E_INVOICE_STATUS.CANCELED && (
                    <div className="text-[10px] text-rose-700 font-semibold p-3 border border-rose-200 bg-rose-50 rounded-lg text-center leading-relaxed">
                      Hóa đơn này đã được hủy vào ngày{" "}
                      {invoice.canceledAt ? formatDate(invoice.canceledAt) : ""}. Không thể thực hiện
                      thêm thao tác.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog Modal */}
      {showCancelModal && (
        <CancelInvoiceModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          invoiceLookupCode={invoice.lookupCode}
        />
      )}

      {/* Send Invoice Modal */}
      {showSendModal && (
        <SendInvoiceModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          invoice={invoice}
          onDeliverySuccess={(log) => setDeliveryLogs([log, ...deliveryLogs])}
        />
      )}

      {/* Print Invoice Modal */}
      {showPrintModal && (
        <PrintInvoiceModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          invoice={invoice}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
