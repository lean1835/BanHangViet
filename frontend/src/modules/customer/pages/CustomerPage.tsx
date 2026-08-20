import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import {
  CUSTOMER_DEBT_STATUS_FILTER,
  CUSTOMER_FILTER_OPTIONS,
  CUSTOMER_LOG,
} from "@/constants/customer";
import { APP_ROUTES } from "@/constants/routes";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { CustomerManagement } from "../components/CustomerManagement";
import { CustomerSidebar } from "../components/CustomerSidebar";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { CustomerDetailModal } from "../components/CustomerDetailModal";
import { DebtPaymentModal, type DebtPaymentData } from "../components/DebtPaymentModal";
import { DebtReminderModal } from "../components/DebtReminderModal";
import {
  useGetCustomersQuery,
  useGetDebtRemindersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useCollectDebtMutation,
  useRemindCustomerDebtMutation,
} from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

export const CustomerPage: React.FC = () => {
  const { addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  // RTK Query Mutations & Queries
  const {
    data: apiCustomers = [],
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useGetCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: debtReminders = [] } = useGetDebtRemindersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [collectDebt] = useCollectDebtMutation();
  const [remindDebt] = useRemindCustomerDebtMutation();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [selectedDebtStatus, setSelectedDebtStatus] = useState<string>(
    CUSTOMER_FILTER_OPTIONS.DEFAULT_DEBT_STATUS,
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);

  // Merge debt reminders data (dueDate, debtCreatedAt) into customer objects
  const customersWithDebtInfo = useMemo(() => {
    const debtMap = new Map<string, { dueDate?: string; debtCreatedAt?: string }>();

    debtReminders.forEach((reminder) => {
      if (!reminder.customerId) return;
      const existing = debtMap.get(reminder.customerId);
      const reminderDueDate = reminder.dueDate;
      const reminderCreatedAt = reminder.createdAt;

      if (!existing) {
        debtMap.set(reminder.customerId, {
          dueDate: reminderDueDate,
          debtCreatedAt: reminderCreatedAt,
        });
      } else {
        const minDueDate =
          reminderDueDate && existing.dueDate
            ? reminderDueDate < existing.dueDate
              ? reminderDueDate
              : existing.dueDate
            : reminderDueDate || existing.dueDate;

        const minCreatedAt =
          reminderCreatedAt && existing.debtCreatedAt
            ? reminderCreatedAt < existing.debtCreatedAt
              ? reminderCreatedAt
              : existing.debtCreatedAt
            : reminderCreatedAt || existing.debtCreatedAt;

        debtMap.set(reminder.customerId, {
          dueDate: minDueDate,
          debtCreatedAt: minCreatedAt,
        });
      }
    });

    return apiCustomers.map((customer) => {
      const debtInfo = debtMap.get(customer.id);
      return {
        ...customer,
        dueDate: customer.dueDate || debtInfo?.dueDate,
        debtCreatedAt: debtInfo?.debtCreatedAt,
      };
    });
  }, [apiCustomers, debtReminders]);

  // Filtered customer list derived from merged customer data
  const filteredCustomers = useMemo(() => {
    return customersWithDebtInfo.filter((customer) => {
      // 1. Search Query Filter (Name, Phone, Email, Address)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesName = customer.name?.toLowerCase().includes(query);
        const matchesPhone = (customer.phone || customer.phoneNumber)
          ?.toLowerCase()
          .includes(query);
        const matchesEmail = customer.email?.toLowerCase().includes(query);
        const matchesAddress = customer.address?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) {
          return false;
        }
      }

      // 2. Debt Status Filter
      const currentDebt = customer.debt ?? customer.currentDebt ?? 0;
      if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.HAS_DEBT) {
        if (currentDebt <= 0) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.NO_DEBT) {
        if (currentDebt > 0) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.EXCEEDED) {
        if (currentDebt <= customer.creditLimit) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.OVERDUE) {
        const todayStr = new Date().toISOString().split("T")[0];
        const isOverdue = Boolean(
          currentDebt > 0 && customer.dueDate && customer.dueDate < todayStr,
        );
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [customersWithDebtInfo, debouncedSearch, selectedDebtStatus]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: ICustomer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (
    data: Omit<ICustomer, "id" | "debt"> & { id?: string; debt?: number },
  ) => {
    const cleanPhone = data.phone?.trim().replace(/\s+/g, "") || "";

    if (data.id) {
      // Execute RTK Query update mutation
      try {
        await updateCustomer({
          id: data.id,
          name: data.name,
          phone: cleanPhone,
          phoneNumber: cleanPhone,
          email: data.email,
          address: data.address,
          creditLimit: data.creditLimit,
        }).unwrap();

        addLogEntry(
          CUSTOMER_LOG.UPDATE_ACTION,
          CUSTOMER_LOG.updated(data.name),
        );
        showSuccess(`Cập nhật thông tin khách hàng "${data.name}" thành công!`);
      } catch (err: unknown) {
        const apiErr = getApiErrorMessage(
          err,
          `Không thể cập nhật thông tin khách hàng "${data.name}" trên hệ thống.`,
        );
        showError(apiErr);
        throw new Error(apiErr);
      }
    } else {
      // Create new customer via API
      try {
        await createCustomer({
          name: data.name,
          phone: cleanPhone,
          phoneNumber: cleanPhone,
          email: data.email,
          address: data.address,
          creditLimit: data.creditLimit,
        }).unwrap();

        addLogEntry(
          CUSTOMER_LOG.ACTION,
          CUSTOMER_LOG.added(data.name, cleanPhone),
        );
        showSuccess(`Thêm mới khách hàng "${data.name}" thành công!`);
      } catch (err: unknown) {
        const apiErr = getApiErrorMessage(
          err,
          `Không thể tạo mới khách hàng "${data.name}" trên hệ thống.`,
        );
        showError(apiErr);
        throw new Error(apiErr);
      }
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const target = apiCustomers.find((c) => c.id === id);
    const targetName = target?.name || id;

    try {
      await deleteCustomer(id).unwrap();

      addLogEntry(
        CUSTOMER_LOG.DELETE_ACTION,
        CUSTOMER_LOG.deleted(targetName),
      );
      showSuccess(`Đã xóa khách hàng "${targetName}".`);
    } catch (err: unknown) {
      const apiErr = getApiErrorMessage(
        err,
        `Không thể xóa khách hàng "${targetName}" trên hệ thống.`,
      );
      showError(apiErr);
    }
  };

  const handleConfirmReminder = (
    customer: ICustomer,
    messageContent?: string,
  ) => {
    remindDebt({
      customerId: customer.id,
      messageContent: messageContent || `Nhắc công nợ cho khách hàng ${customer.name}`,
    })
      .unwrap()
      .then(() => {
        const debtAmount = customer.debt ?? customer.currentDebt ?? 0;
        addLogEntry(
          CUSTOMER_LOG.REMINDER_ACTION,
          CUSTOMER_LOG.reminded(customer.name, formatCurrency(debtAmount)),
        );
      })
      .catch((err: unknown) => {
        console.error("Lỗi gửi email nhắc nợ ngầm:", err);
      });
  };

  const handleConfirmPayDebt = async ({
    customerId,
    amount,
    notes,
  }: DebtPaymentData) => {
    const target = apiCustomers.find((c) => c.id === customerId);
    const targetName = target?.name || customerId;

    try {
      await collectDebt({
        customerId,
        amount,
        notes,
      }).unwrap();

      const currentDebt = target?.debt ?? target?.currentDebt ?? 0;
      const remainingDebt = Math.max(0, currentDebt - amount);

      addLogEntry(
        CUSTOMER_LOG.PAY_DEBT_ACTION,
        CUSTOMER_LOG.debtPaid(
          targetName,
          formatCurrency(amount),
          formatCurrency(remainingDebt),
        ),
      );

      showSuccess(
        `Đã ghi nhận thu ${formatCurrency(amount)} từ khách hàng "${targetName}". Dư nợ còn lại: ${formatCurrency(remainingDebt)}.`,
      );
    } catch (err: unknown) {
      const apiErr = getApiErrorMessage(
        err,
        `Không thể ghi nhận thu nợ cho khách hàng "${targetName}" trên hệ thống.`,
      );
      showError(apiErr);
      throw new Error(apiErr);
    }
  };

  const { id: routeCustomerId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [drawerPayDebtCustomer, setDrawerPayDebtCustomer] = useState<ICustomer | null>(null);
  const [drawerRemindCustomer, setDrawerRemindCustomer] = useState<ICustomer | null>(null);

  const selectedCustomerDetail = useMemo(() => {
    if (!routeCustomerId) return null;
    return customersWithDebtInfo.find((c) => c.id === routeCustomerId) || null;
  }, [customersWithDebtInfo, routeCustomerId]);

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <CustomerSidebar
          selectedDebtStatus={selectedDebtStatus}
          onSelectDebtStatus={setSelectedDebtStatus}
        />
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Đang tải danh sách khách hàng từ máy chủ...</p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex flex-col gap-3">
          <p>Không thể kết nối với dữ liệu khách hàng từ máy chủ API.</p>
          <p className="text-[11px] text-rose-500">
            {getApiErrorMessage(fetchError, "Không thể lấy danh sách khách hàng từ máy chủ.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-max px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <CustomerManagement
          customers={filteredCustomers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenEditModal={handleOpenEditModal}
          onDeleteCustomer={handleDeleteCustomer}
          onConfirmReminder={handleConfirmReminder}
          onConfirmPayDebt={handleConfirmPayDebt}
        />
      )}

      {/* Customer Detail Slide-Over Drawer (/customers/:id) */}
      <CustomerDetailModal
        isOpen={Boolean(routeCustomerId)}
        onClose={() => navigate(APP_ROUTES.CUSTOMERS)}
        customer={selectedCustomerDetail}
        onOpenEditModal={handleOpenEditModal}
        onOpenPayDebtModal={(c) => setDrawerPayDebtCustomer(c)}
        onOpenRemindModal={(c) => setDrawerRemindCustomer(c)}
      />

      {/* Modals triggered from Detail Drawer */}
      <DebtPaymentModal
        isOpen={Boolean(drawerPayDebtCustomer)}
        onClose={() => setDrawerPayDebtCustomer(null)}
        customer={drawerPayDebtCustomer}
        onConfirmPayment={handleConfirmPayDebt}
      />

      <DebtReminderModal
        isOpen={Boolean(drawerRemindCustomer)}
        onClose={() => setDrawerRemindCustomer(null)}
        customer={drawerRemindCustomer}
        onConfirmReminder={handleConfirmReminder}
      />

      {/* Create / Edit Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        existingCustomers={apiCustomers}
        onOpenEditModal={handleOpenEditModal}
      />
    </DashboardWorkspaceLayout>
  );
};

export default CustomerPage;
