import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Building2,
  Calendar,
} from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  SUPPLIER_MESSAGES,
  SUPPLIER_LOG_ACTIONS,
} from "@/constants/supplier";
import {
  SUPPLIER_DEBT_MESSAGES,
  SUPPLIER_DEBT_LOG_ACTIONS,
} from "@/constants/supplierDebt";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IPaySupplierDebtRequest } from "../types/ISupplierDebt";
import {
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
  useUpdateSupplierStatusMutation,
} from "../services/supplierApi";
import { usePaySupplierDebtMutation } from "../services/supplierDebtApi";
import { SupplierDebtHistoryTab } from "../components/SupplierDebtHistoryTab";
import {
  SupplierFormModal,
  type SupplierFormValues,
} from "../components/SupplierFormModal";
import { SupplierStatusModal } from "../components/SupplierStatusModal";
import { PaySupplierDebtModal } from "../components/PaySupplierDebtModal";

export const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const canManage = currentRole === USER_ROLES.OWNER;
  const canManageDebt =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

  // Active tab state
  const [activeTab, setActiveTab] = useState<"INFO" | "DEBT_HISTORY">("INFO");

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [serverError, setServerError] = useState<{
    code?: number;
    message?: string;
  } | null>(null);

  // Queries & Mutations
  const {
    data: supplier,
    isLoading: isLoadingById,
    isError: isErrorById,
    refetch: refetchById,
  } = useGetSupplierByIdQuery(id || "", {
    skip: !id,
  });

  const [updateSupplier] = useUpdateSupplierMutation();
  const [updateSupplierStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSupplierStatusMutation();
  const [paySupplierDebt] = usePaySupplierDebtMutation();

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

  const handleStatusConfirm = async () => {
    if (!supplier) return;
    const nextStatus = supplier.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    const statusText =
      nextStatus === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động";
    try {
      await updateSupplierStatus({
        id: supplier.id,
        status: nextStatus,
      }).unwrap();
      addLogEntry(
        "Cập nhật trạng thái NCC",
        `Chuyển nhà cung cấp "${supplier.name}" sang "${statusText}"`
      );
      showSuccess(`Đã chuyển trạng thái nhà cung cấp sang "${statusText}"`);
      setIsStatusModalOpen(false);
      refetchById();
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(err, "Không thể cập nhật trạng thái nhà cung cấp")
      );
    }
  };

  const handleFormSubmit = async (values: SupplierFormValues) => {
    if (!supplier) return;
    setServerError(null);
    const sanitizedEmail = values.email?.trim() ? values.email.trim() : null;
    const sanitizedTaxCode = values.taxCode?.trim()
      ? values.taxCode.trim()
      : null;
    const sanitizedAddress = values.address?.trim()
      ? values.address.trim()
      : null;
    const sanitizedNote = values.note?.trim() ? values.note.trim() : null;
    const debtAmount =
      typeof values.initialDebt === "number" && !isNaN(values.initialDebt)
        ? values.initialDebt
        : 0;
    const statusVal = values.status || "ACTIVE";

    try {
      await updateSupplier({
        id: supplier.id,
        data: {
          name: values.name.trim(),
          phoneNumber: values.phoneNumber.trim(),
          email: sanitizedEmail,
          taxCode: sanitizedTaxCode,
          address: sanitizedAddress,
          note: sanitizedNote,
          status: statusVal,
          currentDebt: debtAmount,
          initialDebt: debtAmount,
        },
      }).unwrap();

      addLogEntry(
        SUPPLIER_LOG_ACTIONS.UPDATE,
        `Cập nhật thông tin nhà cung cấp "${values.name}" (${values.phoneNumber})`
      );
      showSuccess(SUPPLIER_MESSAGES.UPDATE_SUCCESS);
      setIsEditModalOpen(false);
      refetchById();
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(
        err,
        SUPPLIER_MESSAGES.UPDATE_FAILED
      );
      setServerError({ message: errorMsg });
      showError(errorMsg);
    }
  };

  const handleConfirmPayDebt = async (request: IPaySupplierDebtRequest) => {
    if (!supplier) return;
    try {
      await paySupplierDebt(request).unwrap();
      const amountFormatted = formatCurrency(request.amount);
      const remainingDebt = Math.max(0, (supplier.currentDebt || 0) - request.amount);

      addLogEntry(
        SUPPLIER_DEBT_LOG_ACTIONS.PAY,
        `Thanh toán ${amountFormatted} cho nhà cung cấp "${supplier.name}". Dư nợ còn lại: ${formatCurrency(remainingDebt)}`
      );
      showSuccess(
        `Thanh toán ${amountFormatted} cho nhà cung cấp "${supplier.name}" thành công!`
      );
      setIsPayModalOpen(false);
      refetchById();
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(err, SUPPLIER_DEBT_MESSAGES.PAY_FAILED)
      );
    }
  };

  if (isLoadingById) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Đang tải thông tin nhà cung cấp...</p>
      </div>
    );
  }

  if (isErrorById || (!isLoadingById && !supplier) || !supplier) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Không tìm thấy thông tin nhà cung cấp
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Nhà cung cấp không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.PRODUCT_SUPPLIERS)}
          className="flex items-center gap-1.5 px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-lg hover:bg-kv-blue-dark transition-all"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách nhà cung cấp
        </button>
      </div>
    );
  }

  const currentSupplier = supplier;
  const isActive = currentSupplier.status !== "INACTIVE";
  const hasDebt = (currentSupplier.currentDebt || 0) > 0;
  const displayCode = `NCC-${(currentSupplier.id || "").slice(0, 6).toUpperCase()}`;

  return (
    <div className="flex flex-col gap-5 w-full flex-1 animate-page-enter pb-12">
      {/* Top Header & Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.PRODUCT_SUPPLIERS)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                {currentSupplier.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-200/80 text-slate-600 border border-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Mã: <span className="font-mono text-kv-blue-primary">{displayCode}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                isActive
                  ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                  : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <Power size={14} />
              <span>{isActive ? "Ngừng hoạt động" : "Kích hoạt lại"}</span>
            </button>
          )}

          {canManage && (
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

      {/* Debt Card Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
          hasDebt
            ? "bg-rose-50/80 border-rose-200"
            : "bg-emerald-50/70 border-emerald-200"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl ${
              hasDebt
                ? "bg-rose-500/10 text-rose-600"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-600 font-bold block">
              Dư nợ phải trả hiện tại
            </span>
            <span
              className={`text-xl font-black tracking-tight ${
                hasDebt ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {formatCurrency(currentSupplier.currentDebt || 0)}
            </span>
          </div>
        </div>

        {canManageDebt && hasDebt && (
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <CreditCard size={15} />
            Thanh toán nợ ngay
          </button>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tab Navigation Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("INFO")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "INFO"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <Info size={15} />
            Thông tin chung
          </button>

          {canManageDebt && (
            <button
              type="button"
              onClick={() => setActiveTab("DEBT_HISTORY")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "DEBT_HISTORY"
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <CreditCard size={15} />
              Lịch sử công nợ
              {hasDebt && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  Còn nợ
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "INFO" ? (
            <div className="space-y-6">
              {/* Detailed Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block mb-0.5">
                      Số điện thoại
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {currentSupplier.phoneNumber || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block mb-0.5">
                      Email
                    </span>
                    <span className="font-semibold text-slate-800 text-sm break-all">
                      {currentSupplier.email || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block mb-0.5">
                      Mã số thuế
                    </span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {currentSupplier.taxCode || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block mb-0.5">
                      Địa chỉ
                    </span>
                    <span className="font-medium text-slate-800 text-sm">
                      {currentSupplier.address || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs mb-2">
                  <FileText size={15} className="text-slate-500" />
                  <span>Ghi chú / Mặt hàng thường nhập:</span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {currentSupplier.note ? (
                    currentSupplier.note
                  ) : (
                    <span className="text-slate-400 italic">
                      Chưa có ghi chú về mặt hàng của nhà cung cấp này
                    </span>
                  )}
                </p>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Ngày tạo: {formatDateTime(currentSupplier.createdAt)}
                </span>
                <span>Cập nhật: {formatDateTime(currentSupplier.updatedAt)}</span>
              </div>
            </div>
          ) : (
            <SupplierDebtHistoryTab
              supplierId={currentSupplier.id}
              currentDebt={currentSupplier.currentDebt || 0}
              canPay={canManageDebt}
              onOpenPayModal={() => setIsPayModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Edit Supplier Modal */}
      <SupplierFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={currentSupplier}
        serverError={serverError}
      />

      {/* Status Confirmation Modal */}
      <SupplierStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusConfirm}
        supplier={currentSupplier}
        isUpdating={isUpdatingStatus}
      />

      {/* Pay Debt Modal */}
      <PaySupplierDebtModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        supplier={currentSupplier}
        onConfirmPayment={handleConfirmPayDebt}
      />
    </div>
  );
};

export default SupplierDetailPage;
