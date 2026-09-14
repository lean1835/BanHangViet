import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Info,
  CreditCard,
  Wallet,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Power,
  Calendar,
  Building2,
  FileCheck,
  Sliders,
  Printer,
  CheckCircle2,
  XCircle,
  Lock,
  AlertTriangle,
  Crown,
  Bell,
  ArrowRight,
  Award,
} from "lucide-react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  CUSTOMER_UI,
  CUSTOMER_LOG,
  CUSTOMER_FILTER_OPTIONS,
  CUSTOMER_DETAIL_TABS,
  type TCustomerDetailTab,
  CUSTOMER_TAB_QUERY_PARAMS,
} from "@/constants/customer";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { RootState } from "@/stores";
import type { ICustomer } from "../types/ICustomer";
import type {
  IDebtReconciliationResponse,
} from "../types/ICustomerDebtReconciliation";
import {
  useGetCustomerByIdQuery,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
  useGetDebtHistoryQuery,
  useGetDebtReconciliationsQuery,
  useGetLatestDebtReconciliationQuery,
  usePreviewDebtReconciliationMutation,
  useCreateDebtReconciliationMutation,
  useConfirmDebtReconciliationMutation,
  useCancelDebtReconciliationMutation,
  useCollectDebtMutation,
  useRemindCustomerDebtMutation,
} from "../services/customerApi";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { DebtPaymentModal, type DebtPaymentData } from "../components/DebtPaymentModal";
import { DebtReminderModal } from "../components/DebtReminderModal";
import { DebtStatementPrintModal } from "../components/DebtStatementPrintModal";
import { DebtAdjustmentModal } from "../components/DebtAdjustmentModal";
import { CustomerSidebar } from "../components/CustomerSidebar";
import { CustomerLoyaltyTab } from "../components/CustomerLoyaltyTab";

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.roleId || currentUser?.role?.code || currentUser?.role?.name || USER_ROLES.OWNER;
  const isOwner = userRole === USER_ROLES.OWNER;

  // Active tab state: INFO | DEBT_ORDERS | RECONCILIATION | LOYALTY
  const initialTab: TCustomerDetailTab =
    searchParams.get("tab") === CUSTOMER_TAB_QUERY_PARAMS.LOYALTY
      ? CUSTOMER_DETAIL_TABS.LOYALTY
      : searchParams.get("tab") === CUSTOMER_TAB_QUERY_PARAMS.RECONCILIATION
        ? CUSTOMER_DETAIL_TABS.RECONCILIATION
        : searchParams.get("tab") === CUSTOMER_TAB_QUERY_PARAMS.DEBT
          ? CUSTOMER_DETAIL_TABS.DEBT_ORDERS
          : CUSTOMER_DETAIL_TABS.INFO;
  const [activeTab, setActiveTab] = useState<TCustomerDetailTab>(initialTab);
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  // Sidebar filter state
  const [sidebarDebtStatus, setSidebarDebtStatus] = useState<string>(
    CUSTOMER_FILTER_OPTIONS.DEFAULT_DEBT_STATUS,
  );
  const [sidebarDebtFrom, setSidebarDebtFrom] = useState("");
  const [sidebarDebtTo, setSidebarDebtTo] = useState("");

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Sync tab with URL search params
  const handleTabChange = (tab: TCustomerDetailTab) => {
    setActiveTab(tab);
    if (tab === CUSTOMER_DETAIL_TABS.LOYALTY) {
      setSearchParams({ tab: CUSTOMER_TAB_QUERY_PARAMS.LOYALTY });
    } else if (tab === CUSTOMER_DETAIL_TABS.RECONCILIATION) {
      setSearchParams({ tab: CUSTOMER_TAB_QUERY_PARAMS.RECONCILIATION });
    } else if (tab === CUSTOMER_DETAIL_TABS.DEBT_ORDERS) {
      setSearchParams({ tab: CUSTOMER_TAB_QUERY_PARAMS.DEBT });
    } else {
      setSearchParams({});
    }
  };

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [printReconciliationId, setPrintReconciliationId] = useState<string | null>(null);

  // Reconciliation workspace state
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDayThisMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [confirmNow, setConfirmNow] = useState(false);
  const [previewData, setPreviewData] = useState<IDebtReconciliationResponse | null>(null);
  const [recErrorMsg, setRecErrorMsg] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");

  // Query Customer by ID
  const {
    data: customer,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery(id || "", { skip: !id });

  // Query all customers for duplicate check in edit modal
  const { data: allCustomers = [] } = useGetCustomersQuery(undefined, { skip: !isEditModalOpen });

  // Query Debt History
  const { data: debtHistory = [], refetch: refetchDebtHistory } =
    useGetDebtHistoryQuery(id || "", { skip: !id });

  // Query past reconciliations
  const {
    data: recPageData,
    refetch: refetchRecList,
  } = useGetDebtReconciliationsQuery({ customerId: id, size: 50 }, { skip: !id });

  // Query latest reconciliation
  const { data: latestRecData } = useGetLatestDebtReconciliationQuery(id || "", { skip: !id });
  const latestRec = latestRecData && latestRecData.customerId === id ? latestRecData : null;

  // Mutations
  const [updateCustomer] = useUpdateCustomerMutation();
  const [collectDebt] = useCollectDebtMutation();
  const [remindDebt] = useRemindCustomerDebtMutation();
  const [previewMutation, { isLoading: isPreviewing }] = usePreviewDebtReconciliationMutation();
  const [createRecMutation, { isLoading: isCreatingRec }] = useCreateDebtReconciliationMutation();
  const [confirmRecMutation, { isLoading: isConfirmingRec }] = useConfirmDebtReconciliationMutation();
  const [cancelRecMutation] = useCancelDebtReconciliationMutation();

  // Reset/Initialize start date according to latest reconciliation lock
  useEffect(() => {
    if (latestRec && latestRec.customerId === id && latestRec.reconciledToDate) {
      const nextDay = new Date(latestRec.reconciledToDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split("T")[0];
      if (nextDayStr <= todayStr) {
        setStartDate(nextDayStr);
      } else {
        setStartDate(firstDayThisMonth);
      }
    } else {
      setStartDate(firstDayThisMonth);
    }
  }, [id, latestRec, firstDayThisMonth, todayStr]);

  if (isCustomerLoading) {
    return (
      <DashboardWorkspaceLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Đang tải thông tin khách hàng...</p>
        </div>
      </DashboardWorkspaceLayout>
    );
  }

  if (isCustomerError || (!isCustomerLoading && !customer) || !customer) {
    return (
      <DashboardWorkspaceLayout>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-4 text-center mt-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy thông tin khách hàng</h3>
            <p className="text-xs text-slate-500 mt-1">Khách hàng không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.CUSTOMERS)}
            className="flex items-center gap-1.5 px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-lg hover:bg-kv-blue-dark transition-all"
          >
            <ArrowLeft size={14} />
            Quay lại danh sách khách hàng
          </button>
        </div>
      </DashboardWorkspaceLayout>
    );
  }

  const currentDebt = customer.debt ?? customer.currentDebt ?? 0;
  const creditLimit = customer.creditLimit ?? 0;
  const availableCredit = creditLimit - currentDebt;
  const hasDebt = currentDebt > 0;
  const isExceeded = currentDebt > creditLimit;
  const isOverdue = Boolean(hasDebt && customer.dueDate && customer.dueDate < todayStr);
  const displayCode = `KH-${(customer.id || "").slice(0, 6).toUpperCase()}`;

  const pastReconciliations: IDebtReconciliationResponse[] = recPageData?.content || [];

  const isPeriodBeforeLock =
    Boolean(latestRec && latestRec.customerId === id && latestRec.reconciledToDate) &&
    Boolean(startDate) &&
    Boolean(latestRec?.reconciledToDate && startDate <= latestRec.reconciledToDate);

  // Preset click handler
  const handleSelectPreset = (preset: "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "FROM_LAST_LOCK") => {
    const now = new Date();
    if (preset === "THIS_MONTH") {
      setStartDate(firstDayThisMonth);
      setEndDate(todayStr);
    } else if (preset === "LAST_MONTH") {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      setStartDate(firstDayPrevMonth);
      setEndDate(lastDayPrevMonth);
    } else if (preset === "THIS_QUARTER") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDayQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split("T")[0];
      setStartDate(firstDayQuarter);
      setEndDate(todayStr);
    } else if (preset === "FROM_LAST_LOCK" && latestRec?.reconciledToDate) {
      const nextDay = new Date(latestRec.reconciledToDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setStartDate(nextDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
    setPreviewData(null);
    setRecErrorMsg(null);
  };

  // Handle Preview Calculation
  const handlePreview = async () => {
    setRecErrorMsg(null);
    if (!startDate || !endDate) {
      setRecErrorMsg("Vui lòng chọn đầy đủ từ ngày đến ngày");
      return;
    }
    if (startDate > endDate) {
      setRecErrorMsg("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    if (endDate > todayStr) {
      setRecErrorMsg("Ngày kết thúc không được vượt quá hôm nay");
      return;
    }

    try {
      const result = await previewMutation({
        customerId: customer.id,
        startDate,
        endDate,
      }).unwrap();
      setPreviewData(result);
    } catch (err: unknown) {
      setRecErrorMsg(getApiErrorMessage(err, "Không thể xem trước số liệu đối chiếu"));
    }
  };

  // Handle Save / Confirm Reconciliation
  const handleSaveReconciliation = async () => {
    setRecErrorMsg(null);
    if (!startDate || !endDate) {
      setRecErrorMsg("Vui lòng chọn khoảng thời gian đối chiếu.");
      return;
    }

    if (isPeriodBeforeLock) {
      setRecErrorMsg(
        `Không thể đối chiếu lùi về trước mốc đã khóa sổ (${formatDateOnly(
          latestRec!.reconciledToDate!,
        )}). Vui lòng chọn ngày bắt đầu sau mốc này.`,
      );
      return;
    }

    try {
      const created = await createRecMutation({
        customerId: customer.id,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
        confirmNow,
      }).unwrap();

      if (confirmNow) {
        addLogEntry(
          CUSTOMER_LOG.RECONCILE_CONFIRM_ACTION,
          CUSTOMER_LOG.reconcileConfirmed(created.code, formatDateOnly(endDate)),
        );
        showSuccess(`Đã chốt và khóa sổ biên bản đối chiếu ${created.code} đến ngày ${formatDateOnly(endDate)}.`);
      } else {
        addLogEntry(CUSTOMER_LOG.RECONCILE_CREATE_ACTION, CUSTOMER_LOG.reconcileCreated(created.code, customer.name));
        showSuccess(`Đã lập bản nháp biên bản đối chiếu ${created.code} cho khách hàng "${customer.name}".`);
      }

      setPreviewData(null);
      setNotes("");
      setConfirmNow(false);
      refetchRecList();
      refetchCustomer();

      if (created.id) {
        setPrintReconciliationId(created.id);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể lưu biên bản đối chiếu công nợ.");
      setRecErrorMsg(msg);
      showError(msg);
    }
  };

  // Handle Confirm Draft
  const handleConfirmDraft = async (rec: IDebtReconciliationResponse) => {
    try {
      await confirmRecMutation({
        id: rec.id,
        notes: confirmNotes.trim() || undefined,
      }).unwrap();

      addLogEntry(CUSTOMER_LOG.RECONCILE_CONFIRM_ACTION, CUSTOMER_LOG.reconcileConfirmed(rec.code, formatDateOnly(rec.endDate)));
      showSuccess(`Đã xác nhận và khóa sổ biên bản đối chiếu ${rec.code}.`);
      setConfirmingId(null);
      setConfirmNotes("");
      refetchRecList();
      refetchCustomer();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể xác nhận biên bản đối chiếu."));
    }
  };

  // Handle Cancel Draft
  const handleCancelDraft = async (rec: IDebtReconciliationResponse) => {
    try {
      await cancelRecMutation(rec.id).unwrap();
      addLogEntry(CUSTOMER_LOG.RECONCILE_CANCEL_ACTION, `Đã hủy biên bản đối chiếu ${rec.code} của khách hàng ${customer.name}`);
      showSuccess(`Đã hủy biên bản đối chiếu ${rec.code}.`);
      refetchRecList();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể hủy biên bản đối chiếu."));
    }
  };

  // Handle Debt Payment
  const handleConfirmPayDebt = async (data: DebtPaymentData) => {
    try {
      await collectDebt({
        customerId: data.customerId,
        amount: data.amount,
        notes: data.notes,
      }).unwrap();

      const customerName = customer?.name || "Khách hàng";
      addLogEntry(
        CUSTOMER_LOG.PAY_ACTION,
        CUSTOMER_LOG.paid(customerName, formatCurrency(data.amount)),
      );
      showSuccess(`Đã thu ${formatCurrency(data.amount)} từ khách hàng "${customerName}"!`);
      setIsPayModalOpen(false);
      refetchCustomer();
      refetchDebtHistory();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể ghi nhận thu nợ."));
    }
  };

  // Handle Send Reminder
  const handleConfirmReminder = async (c: ICustomer, reminderNotes?: string) => {
    try {
      await remindDebt({
        customerId: c.id,
        messageContent: reminderNotes || `Nhắc nợ khách hàng ${c.name}, số nợ: ${formatCurrency(c.debt)}`,
      }).unwrap();

      addLogEntry(CUSTOMER_LOG.REMIND_ACTION, CUSTOMER_LOG.reminded(c.name, formatCurrency(c.debt)));
      showSuccess(`Đã gửi nhắc nợ đến khách hàng "${c.name}" qua ${c.defaultDeliveryChannel || "Zalo"}!`);
      setIsRemindModalOpen(false);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể gửi nhắc nợ."));
    }
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <CustomerSidebar
          selectedDebtStatus={sidebarDebtStatus}
          onSelectDebtStatus={(status) => {
            setSidebarDebtStatus(status);
            navigate({
              pathname: APP_ROUTES.CUSTOMERS,
              search: `?debtStatus=${encodeURIComponent(status)}`,
            });
          }}
          debtFrom={sidebarDebtFrom}
          debtTo={sidebarDebtTo}
          onDebtFromChange={(val) => {
            setSidebarDebtFrom(val);
            navigate({
              pathname: APP_ROUTES.CUSTOMERS,
              search: `?debtFrom=${encodeURIComponent(val)}`,
            });
          }}
          onDebtToChange={(val) => {
            setSidebarDebtTo(val);
            navigate({
              pathname: APP_ROUTES.CUSTOMERS,
              search: `?debtTo=${encodeURIComponent(val)}`,
            });
          }}
        />
      }
    >
      <div className="flex flex-col gap-5 w-full flex-1 animate-page-enter pb-12">
        {/* Top Header & Navigation Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.CUSTOMERS)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base font-extrabold text-slate-900 leading-tight uppercase flex items-center gap-2">
                  {customer.name}
                  {customer.isVip && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown size={12} className="text-amber-600" />
                      VIP
                    </span>
                  )}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    !isActiveStatus
                      ? "bg-slate-200/80 text-slate-600 border border-slate-300"
                      : isOverdue
                        ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                        : isExceeded
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : hasDebt
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !isActiveStatus
                        ? "bg-slate-400"
                        : isOverdue
                          ? "bg-rose-600"
                          : isExceeded
                            ? "bg-rose-500"
                            : hasDebt
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                    }`}
                  />
                  {!isActiveStatus
                    ? "Ngừng hoạt động"
                    : isOverdue
                      ? "QUÁ HẠN NỢ"
                      : isExceeded
                        ? "Vượt hạn mức"
                        : hasDebt
                          ? "Đang ghi nợ"
                          : "Đang hoạt động"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Mã: <span className="font-mono text-kv-blue-primary">{displayCode}</span>
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  const nextStatus = !isActiveStatus;
                  setIsActiveStatus(nextStatus);
                  showSuccess(
                    nextStatus
                      ? `Đã kích hoạt lại khách hàng "${customer.name}".`
                      : `Đã chuyển khách hàng "${customer.name}" sang trạng thái ngừng hoạt động.`,
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                  isActiveStatus
                    ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                    : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                <Power size={14} />
                <span>{isActiveStatus ? "Ngừng hoạt động" : "Kích hoạt lại"}</span>
              </button>
            )}

            {hasDebt && (
              <button
                type="button"
                onClick={() => setIsRemindModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-all shadow-sm"
              >
                <Bell size={14} />
                <span>Nhắc nợ</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
              >
                <Edit size={14} />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>

        {/* Debt Card Banner - Styled identical to Supplier Detail vibe */}
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            hasDebt ? "bg-rose-50/80 border-rose-200" : "bg-emerald-50/70 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl ${
                hasDebt ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-slate-600 font-bold block">Dư nợ khách hàng hiện tại</span>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className={`text-xl font-black tracking-tight ${hasDebt ? "text-rose-600" : "text-emerald-700"}`}>
                  {formatCurrency(currentDebt)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  (Hạn mức: <strong className="font-mono text-slate-700">{formatCurrency(creditLimit)}</strong> • Còn
                  được nợ:{" "}
                  <strong className="font-mono text-slate-700">
                    {formatCurrency(Math.max(0, availableCredit))}
                  </strong>
                  )
                </span>
              </div>
            </div>
          </div>

          {hasDebt && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all"
              >
                <Wallet size={15} />
                Thu nợ ngay
              </button>
            </div>
          )}
        </div>

        {/* Tabs Layout */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Tab Navigation Header */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-2 gap-2 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => handleTabChange(CUSTOMER_DETAIL_TABS.INFO)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === CUSTOMER_DETAIL_TABS.INFO
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <Info size={15} />
              Thông tin chung
            </button>

            <button
              type="button"
              onClick={() => handleTabChange(CUSTOMER_DETAIL_TABS.DEBT_ORDERS)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === CUSTOMER_DETAIL_TABS.DEBT_ORDERS
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <CreditCard size={15} />
              Đơn hàng nợ & Thanh toán
              {hasDebt && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  Còn nợ
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange(CUSTOMER_DETAIL_TABS.RECONCILIATION)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === CUSTOMER_DETAIL_TABS.RECONCILIATION
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <FileCheck size={15} />
              Đối chiếu công nợ
              {latestRec && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Đã khóa {formatDateOnly(latestRec.reconciledToDate)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange(CUSTOMER_DETAIL_TABS.LOYALTY)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === CUSTOMER_DETAIL_TABS.LOYALTY
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <Award size={15} />
              Điểm thưởng & Khách thân thiết
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="p-6">
            {activeTab === CUSTOMER_DETAIL_TABS.INFO && (
              <div className="space-y-6">
                {/* Details Field Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-medium block mb-0.5">Số điện thoại</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">
                        {customer.phone || customer.phoneNumber || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-medium block mb-0.5">Email</span>
                      <span className="font-semibold text-slate-800 text-sm break-all">
                        {customer.email || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-medium block mb-0.5">Mã số thuế</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">
                        {customer.taxCode || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-medium block mb-0.5">Địa chỉ</span>
                      <span className="font-medium text-slate-800 text-sm">{customer.address || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Ghi chú / Mặt hàng thường mua (Thông tin bổ sung) */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-500 text-xs font-bold block mb-1">
                      Ghi chú / Thông tin bổ sung:
                    </span>
                    <p className="text-xs text-slate-600">
                      {(customer as any).notes || (customer as any).note || "Chưa có ghi chú về khách hàng này"}
                    </p>
                  </div>
                </div>

                {/* Additional Settings & Policies */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-bold block mb-1">Chính sách chiết khấu</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {customer.discountRate && customer.discountRate > 0
                        ? customer.discountType === "CASH"
                          ? `Giảm ${formatCurrency(customer.discountRate)}`
                          : `Giảm ${customer.discountRate}%`
                        : "Không áp dụng"}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-bold block mb-1">Kênh nhận hóa đơn mặc định</span>
                    <span className="text-sm font-extrabold text-slate-800 uppercase">
                      {customer.defaultDeliveryChannel || "ZALO"}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-bold block mb-1">Nhắc nợ trước / sau hạn</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      Trước {customer.reminderDaysBefore ?? 3} ngày • Sau {customer.reminderDaysAfter ?? 3} ngày
                    </span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Ngày tạo: {formatDateTime(customer.createdAt)}
                  </span>
                  <span>Cập nhật: {formatDateTime(customer.updatedAt)}</span>
                </div>
              </div>
            )}

            {activeTab === CUSTOMER_DETAIL_TABS.DEBT_ORDERS && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    Lịch sử phát sinh nợ & thanh toán ({debtHistory.length} giao dịch)
                  </h4>
                </div>

                {debtHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Khách hàng chưa phát sinh khoản nợ nào.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Thời gian</th>
                          <th className="p-3">Loại giao dịch</th>
                          <th className="p-3">Đơn hàng / Chứng từ</th>
                          <th className="p-3 text-right">Số tiền</th>
                          <th className="p-3 text-right">Còn nợ</th>
                          <th className="p-3 text-center">Hạn trả</th>
                          <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {debtHistory.map((d) => {
                          const isIncrease = d.type === "DEBT_CREATED";
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/70">
                              <td className="p-3 font-mono text-[11px]">{formatDateOnly(d.createdAt)}</td>
                              <td className="p-3 font-semibold">
                                {isIncrease ? "Mua hàng ghi nợ" : "Thanh toán nợ"}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-800">
                                {d.orderNumber || d.orderId || "---"}
                              </td>
                              <td
                                className={`p-3 text-right font-mono font-bold ${
                                  isIncrease ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                {isIncrease ? `+${formatCurrency(d.amount)}` : `-${formatCurrency(d.amount)}`}
                              </td>
                              <td className="p-3 text-right font-mono font-extrabold text-slate-800">
                                {formatCurrency(d.remainingAmount ?? 0)}
                              </td>
                              <td className="p-3 text-center font-mono text-[11px]">
                                {d.dueDate ? formatDateOnly(d.dueDate) : "---"}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    d.status === "PAID"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : d.status === "OVERDUE"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {d.status === "PAID"
                                    ? "Đã trả xong"
                                    : d.status === "OVERDUE"
                                      ? "Quá hạn"
                                      : "Còn nợ"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === CUSTOMER_DETAIL_TABS.RECONCILIATION && (
              <div className="space-y-6">
                {/* Section Header & Subtitle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <FileCheck size={18} className="text-kv-blue-primary" />
                      Lập & Quản lý Đối chiếu Công nợ
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đối chiếu biến động nợ theo kỳ, chốt khóa sổ nợ chống sửa lùi và in giấy xác nhận khổ A4.
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsAdjustmentModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-all shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Sliders size={14} />
                      Bút toán điều chỉnh
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {recErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5 text-xs">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                    <span className="font-semibold">{recErrorMsg}</span>
                  </div>
                )}

                {/* Lock Status Notice Banner */}
                {latestRec && latestRec.customerId === id && latestRec.reconciledToDate && (
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Lock size={15} className="text-blue-600 shrink-0" />
                      <span>
                        Kỳ đối chiếu gần nhất đã chốt: <strong>{latestRec.code}</strong> (đến ngày{" "}
                        <strong>{formatDateOnly(latestRec.reconciledToDate)}</strong>). Các khoản nợ trước mốc này đã
                        khóa cứng chống sửa lùi.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("FROM_LAST_LOCK")}
                      className="text-xs font-extrabold text-kv-blue-primary hover:underline cursor-pointer"
                    >
                      Chọn tiếp từ mốc này &rarr;
                    </button>
                  </div>
                )}

                {/* Period Selector Panel */}
                <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex flex-col gap-3.5 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wide text-xs flex items-center gap-1.5">
                      <Calendar size={14} />
                      1. Chọn khoảng thời gian đối chiếu
                    </span>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("THIS_MONTH")}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        Tháng này
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("LAST_MONTH")}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        Tháng trước
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("THIS_QUARTER")}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        Quý này
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4 flex flex-col gap-1">
                      <label htmlFor="inline-start-date" className="font-bold text-slate-600 text-xs">
                        {CUSTOMER_UI.RECONCILIATION_MODAL.START_DATE_LABEL}
                      </label>
                      <input
                        id="inline-start-date"
                        type="date"
                        max={todayStr}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setPreviewData(null);
                        }}
                        className={`h-10 rounded-lg border px-3 font-mono text-xs font-bold text-slate-700 focus:outline-none transition-all ${
                          isPeriodBeforeLock
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-slate-300 bg-white focus:border-kv-blue-primary"
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center text-slate-400 pt-5 hidden sm:flex">
                      <ArrowRight size={18} />
                    </div>

                    <div className="sm:col-span-4 flex flex-col gap-1">
                      <label htmlFor="inline-end-date" className="font-bold text-slate-600 text-xs">
                        {CUSTOMER_UI.RECONCILIATION_MODAL.END_DATE_LABEL}
                      </label>
                      <input
                        id="inline-end-date"
                        type="date"
                        max={todayStr}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setPreviewData(null);
                        }}
                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs font-bold text-slate-700 focus:border-kv-blue-primary focus:outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-3 pt-1 sm:pt-5">
                      <button
                        type="button"
                        onClick={handlePreview}
                        disabled={isPreviewing}
                        className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-98 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <FileText size={15} />
                        {isPreviewing ? "Đang tính..." : CUSTOMER_UI.RECONCILIATION_MODAL.PREVIEW_BUTTON}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Calculated Statement */}
                {previewData && (
                  <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/20 flex flex-col gap-4 animate-modal-smooth-in">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide">
                        Bảng đối chiếu công nợ phát sinh trong kỳ
                      </h4>
                      <span className="text-xs text-slate-500 font-mono font-semibold">
                        {formatDateOnly(previewData.startDate)} &rarr; {formatDateOnly(previewData.endDate)}
                      </span>
                    </div>

                    {/* 4 Balances KPI Cards - Large, clear for elderly users */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">1. Dư nợ đầu kỳ</span>
                        <span className="text-base font-black text-slate-800 mt-1">
                          {formatCurrency(previewData.openingDebtBalance)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 shadow-2xs flex flex-col">
                        <span className="text-[11px] font-bold text-rose-500 uppercase">2. Phát sinh tăng (Nợ)</span>
                        <span className="text-base font-black text-rose-600 mt-1">
                          +{formatCurrency(previewData.totalDebtIncurred)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs flex flex-col">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">3. Phát sinh giảm (Trả)</span>
                        <span className="text-base font-black text-emerald-600 mt-1">
                          -{formatCurrency(previewData.totalDebtPaid)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-300 shadow-2xs flex flex-col">
                        <span className="text-[11px] font-bold text-amber-700 uppercase">4. Dư nợ cuối kỳ</span>
                        <span className="text-base font-black text-amber-800 mt-1 font-mono">
                          {formatCurrency(previewData.closingDebtBalance)}
                        </span>
                      </div>
                    </div>

                    {/* In Words Callout */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                      <Info size={16} className="text-kv-blue-primary shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-600">Số dư nợ cuối kỳ bằng chữ: </span>
                        <strong className="text-slate-900 underline font-extrabold">
                          {previewData.closingDebtInWords || "Không đồng"}
                        </strong>
                      </div>
                    </div>

                    {/* Empty transactions case */}
                    {!previewData.hasTransactions && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-xs font-semibold">
                        <Info size={16} className="text-amber-600 shrink-0" />
                        <span>{CUSTOMER_UI.RECONCILIATION_MODAL.NO_TRANSACTIONS_BANNER}</span>
                      </div>
                    )}

                    {/* Transactions Breakdown Table */}
                    {previewData.items && previewData.items.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0">
                              <tr>
                                <th className="p-2.5 text-center w-12">STT</th>
                                <th className="p-2.5">Ngày phát sinh</th>
                                <th className="p-2.5">Nội dung</th>
                                <th className="p-2.5">Mã tham chiếu</th>
                                <th className="p-2.5 text-right">Phát sinh Tăng</th>
                                <th className="p-2.5 text-right">Phát sinh Giảm</th>
                                <th className="p-2.5 text-right">Dư nợ lũy kế</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              {previewData.items.map((item, idx) => {
                                const isIncrease = item.type === "DEBT_CREATED";
                                return (
                                  <tr key={item.id || idx} className="hover:bg-slate-50/70">
                                    <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                                    <td className="p-2.5 font-mono text-[11px]">
                                      {formatDateOnly(item.transactionDate)}
                                    </td>
                                    <td className="p-2.5">
                                      <span className="font-semibold">{item.typeDescription}</span>
                                      {item.notes && (
                                        <span className="text-slate-400 block text-[11px]">{item.notes}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-slate-800">
                                      {item.referenceCode || "---"}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                                      {isIncrease ? `+${formatCurrency(item.amount)}` : "-"}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                      {!isIncrease ? `-${formatCurrency(item.amount)}` : "-"}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-black text-slate-800">
                                      {formatCurrency(item.runningBalance)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Notes input */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="inline-notes-input" className="font-bold text-slate-600 text-xs">
                        {CUSTOMER_UI.RECONCILIATION_MODAL.NOTES_LABEL}
                      </label>
                      <textarea
                        id="inline-notes-input"
                        rows={2}
                        maxLength={1000}
                        placeholder={CUSTOMER_UI.RECONCILIATION_MODAL.NOTES_PLACEHOLDER}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                      />
                    </div>

                    {/* Lock Option (VT-01 Owner only) */}
                    {isOwner && (
                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all shadow-2xs">
                        <input
                          type="checkbox"
                          checked={confirmNow}
                          onChange={(e) => setConfirmNow(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded text-kv-blue-primary focus:ring-kv-blue-primary"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Lock size={13} className="text-blue-600" />
                            {CUSTOMER_UI.RECONCILIATION_MODAL.CONFIRM_NOW_LABEL}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {CUSTOMER_UI.RECONCILIATION_MODAL.CONFIRM_NOW_HELP}
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPreviewData(null)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                      >
                        Đóng xem trước
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={handleSaveReconciliation}
                          disabled={isCreatingRec}
                          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold text-xs text-white shadow-md transition-all active:scale-98 cursor-pointer ${
                            confirmNow
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                              : "bg-kv-blue-primary hover:bg-kv-blue-dark shadow-blue-200"
                          } disabled:opacity-50`}
                        >
                          {confirmNow ? (
                            <>
                              <Lock size={14} />
                              {CUSTOMER_UI.RECONCILIATION_MODAL.CONFIRM_SUBMIT_BUTTON}
                            </>
                          ) : (
                            <>
                              <FileCheck size={14} />
                              {CUSTOMER_UI.RECONCILIATION_MODAL.DRAFT_SUBMIT_BUTTON}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 2: Past Reconciliations History Table */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                      2. Danh sách các biên bản đối chiếu trước đó ({pastReconciliations.length})
                    </h4>
                  </div>

                  {/* Inline confirm box if confirming a draft */}
                  {confirmingId && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col gap-3 animate-auth-fade-in">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Xác nhận chốt & khóa sổ nợ cho biên bản đối chiếu này?</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        Hành động này sẽ khóa toàn bộ các khoản nợ của khách hàng đến ngày kết thúc của kỳ. Mọi sai sót
                        sau này bắt buộc phải xử lý bằng Bút toán điều chỉnh.
                      </p>
                      <input
                        type="text"
                        placeholder="Ghi chú xác nhận (tùy chọn)..."
                        value={confirmNotes}
                        onChange={(e) => setConfirmNotes(e.target.value)}
                        className="h-8 rounded-lg border border-emerald-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isConfirmingRec}
                          onClick={() => {
                            const target = pastReconciliations.find((r) => r.id === confirmingId);
                            if (target) handleConfirmDraft(target);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isConfirmingRec ? "Đang khóa sổ..." : "Chốt khóa sổ ngay"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Table of Reconciliations */}
                  {pastReconciliations.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Khách hàng chưa có biên bản đối chiếu nào. Hãy chọn khoảng ngày ở trên và bấm "Xem trước số liệu".
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="p-3">Mã biên bản</th>
                            <th className="p-3">Kỳ đối chiếu</th>
                            <th className="p-3 text-right">Dư đầu kỳ</th>
                            <th className="p-3 text-right">Tăng (Nợ)</th>
                            <th className="p-3 text-right">Giảm (Trả)</th>
                            <th className="p-3 text-right">Dư cuối kỳ</th>
                            <th className="p-3 text-center">Trạng thái</th>
                            <th className="p-3 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {pastReconciliations.map((rec) => {
                            const isConfirmed = rec.status === "CONFIRMED";
                            const isDraft = rec.status === "DRAFT";

                            return (
                              <tr key={rec.id} className="hover:bg-slate-50/70">
                                <td className="p-3 font-mono font-bold text-slate-800">{rec.code}</td>
                                <td className="p-3 font-mono text-[11px]">
                                  {formatDateOnly(rec.startDate)} &rarr; {formatDateOnly(rec.endDate)}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-600">
                                  {formatCurrency(rec.openingDebtBalance)}
                                </td>
                                <td className="p-3 text-right font-mono text-rose-600 font-bold">
                                  +{formatCurrency(rec.totalDebtIncurred)}
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                                  -{formatCurrency(rec.totalDebtPaid)}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900">
                                  {formatCurrency(rec.closingDebtBalance)}
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isConfirmed
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : isDraft
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-slate-100 text-slate-400 border border-slate-200"
                                    }`}
                                  >
                                    {isConfirmed
                                      ? "ĐÃ KHÓA SỔ"
                                      : isDraft
                                        ? "BẢN NHÁP"
                                        : "ĐÃ HỦY"}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPrintReconciliationId(rec.id)}
                                      title="In giấy xác nhận nợ A4"
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-all shadow-2xs cursor-pointer"
                                    >
                                      <Printer size={13} />
                                    </button>

                                    {isOwner && isDraft && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingId(rec.id)}
                                          title="Chốt và khóa sổ nợ"
                                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all shadow-2xs cursor-pointer"
                                        >
                                          <Lock size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleCancelDraft(rec)}
                                          title="Hủy bản nháp"
                                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all shadow-2xs cursor-pointer"
                                        >
                                          <XCircle size={13} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === CUSTOMER_DETAIL_TABS.LOYALTY && (
              <CustomerLoyaltyTab
                customerId={customer.id}
                customerName={customer.name}
                isOwner={isOwner}
              />
            )}
          </div>
        </div>

        {/* Focused Action Modals */}
        {/* Print Statement Modal A4 */}
        <DebtStatementPrintModal
          isOpen={Boolean(printReconciliationId)}
          onClose={() => setPrintReconciliationId(null)}
          reconciliationId={printReconciliationId}
        />

        {/* Pay Debt Modal */}
        <DebtPaymentModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          customer={customer}
          onConfirmPayment={handleConfirmPayDebt}
        />

        {/* Remind Debt Modal */}
        <DebtReminderModal
          isOpen={isRemindModalOpen}
          onClose={() => setIsRemindModalOpen(false)}
          customer={customer}
          onConfirmReminder={handleConfirmReminder}
        />

        {/* Debt Adjustment Modal */}
        <DebtAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          customer={customer}
        />

        {/* Edit Customer Form Modal */}
        <CustomerFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (data) => {
            if (data.id) {
              await updateCustomer({
                id: data.id,
                name: data.name,
                phone: data.phone,
                phoneNumber: data.phone,
                taxCode: data.taxCode,
                email: data.email,
                address: data.address,
                creditLimit: data.creditLimit,
                discountRate: data.discountRate,
                discountType: data.discountType,
                isVip: data.isVip,
                reminderDaysBefore: data.reminderDaysBefore,
                reminderDaysAfter: data.reminderDaysAfter,
              }).unwrap();
              showSuccess(`Cập nhật thông tin khách hàng "${data.name}" thành công!`);
              setIsEditModalOpen(false);
              refetchCustomer();
            }
          }}
          customer={customer}
          existingCustomers={allCustomers}
        />
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default CustomerDetailPage;
