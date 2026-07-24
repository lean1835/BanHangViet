import React, { useState, useMemo, useEffect } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import {
  CUSTOMER_DEBT_STATUS_FILTER,
  CUSTOMER_FILTER_OPTIONS,
  CUSTOMER_LOG,
  CUSTOMER_IDENTIFIERS,
} from "@/constants/customer";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { CustomerManagement } from "../components/CustomerManagement";
import { CustomerSidebar } from "../components/CustomerSidebar";
import { CustomerFormModal } from "../components/CustomerFormModal";
import type { DebtPaymentData } from "../components/DebtPaymentModal";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  usePayCustomerDebtMutation,
} from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

/**
 * Helper to identify real HTTP error responses from Backend server (status codes 4xx, 5xx)
 * vs client-side offline / FETCH_ERROR.
 */
const isHttpErrorResponse = (err: unknown): boolean => {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  );
};

export const CustomerPage: React.FC = () => {
  const { customers, setCustomers, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [payCustomerDebt] = usePayCustomerDebtMutation();

  const { data: apiCustomers } = useGetCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Sync API customer data into local demo state when fetched
  useEffect(() => {
    if (Array.isArray(apiCustomers)) {
      setCustomers(apiCustomers);
    }
  }, [apiCustomers, setCustomers]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [selectedDebtStatus, setSelectedDebtStatus] = useState<string>(
    CUSTOMER_FILTER_OPTIONS.DEFAULT_DEBT_STATUS,
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);

  // Effective customer list (use API data if available, fallback to demo state)
  const effectiveCustomers = useMemo(() => {
    return Array.isArray(apiCustomers) ? apiCustomers : customers;
  }, [apiCustomers, customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return effectiveCustomers.filter((customer) => {
      // 1. Search Query Filter (Name, Phone, Email, Address)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesName = customer.name?.toLowerCase().includes(query);
        const matchesPhone = customer.phone?.toLowerCase().includes(query);
        const matchesEmail = customer.email?.toLowerCase().includes(query);
        const matchesAddress = customer.address?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) {
          return false;
        }
      }

      // 2. Debt Status Filter
      if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.HAS_DEBT) {
        if (customer.debt <= 0) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.NO_DEBT) {
        if (customer.debt > 0) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.EXCEEDED) {
        if (customer.debt <= customer.creditLimit) return false;
      } else if (selectedDebtStatus === CUSTOMER_DEBT_STATUS_FILTER.OVERDUE) {
        const todayStr = new Date().toISOString().split("T")[0];
        const isOverdue = Boolean(
          customer.debt > 0 && customer.dueDate && customer.dueDate < todayStr
        );
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [effectiveCustomers, debouncedSearch, selectedDebtStatus]);

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
    const isDuplicate = effectiveCustomers.some(
      (c) => c.phone?.trim().replace(/\s+/g, "") === cleanPhone && c.id !== data.id,
    );
    if (isDuplicate) {
      const errMsg = `Số điện thoại "${cleanPhone}" đã tồn tại trong hệ thống.`;
      showError(errMsg);
      throw new Error(errMsg);
    }

    if (data.id) {
      // Execute RTK Query update mutation
      try {
        await updateCustomer({
          id: data.id,
          name: data.name,
          phone: cleanPhone,
          email: data.email,
          address: data.address,
          creditLimit: data.creditLimit,
        }).unwrap();
      } catch (err: unknown) {
        if (isHttpErrorResponse(err)) {
          const apiErr = getApiErrorMessage(
            err,
            `Không thể cập nhật thông tin khách hàng "${data.name}" trên hệ thống.`,
          );
          showError(apiErr);
          throw new Error(apiErr);
        }
        // Fallback for offline / demo mode
      }

      // Update existing customer state
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? {
                ...c,
                ...data,
                phone: cleanPhone,
                id: data.id,
                debt: data.debt ?? c.debt,
              }
            : c,
        ),
      );
      addLogEntry(
        CUSTOMER_LOG.UPDATE_ACTION,
        CUSTOMER_LOG.updated(data.name),
      );
      showSuccess(`Cập nhật thông tin khách hàng "${data.name}" thành công!`);
    } else {
      // Robust ID generation to prevent collisions after deletion
      const existingNumIds = effectiveCustomers
        .map((c) => parseInt(c.id.replace(/\D/g, ""), 10))
        .filter((n) => !isNaN(n));
      const maxId = existingNumIds.length > 0 ? Math.max(...existingNumIds) : effectiveCustomers.length;
      const nextId = `${CUSTOMER_IDENTIFIERS.PREFIX}${maxId + 1}`;

      // Create new customer
      const newCustomer: ICustomer = {
        id: nextId,
        name: data.name,
        phone: cleanPhone,
        email: data.email || "",
        address: data.address || "",
        creditLimit: data.creditLimit,
        debt: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        await createCustomer({
          name: data.name,
          phone: cleanPhone,
          email: data.email,
          address: data.address,
          creditLimit: data.creditLimit,
        }).unwrap();
      } catch (err: unknown) {
        if (isHttpErrorResponse(err)) {
          const apiErr = getApiErrorMessage(
            err,
            `Không thể tạo mới khách hàng "${data.name}" trên hệ thống.`,
          );
          showError(apiErr);
          throw new Error(apiErr);
        }
        // Fallback for offline / demo mode
      }

      setCustomers((prev) => [newCustomer, ...prev]);
      addLogEntry(
        CUSTOMER_LOG.ACTION,
        CUSTOMER_LOG.added(newCustomer.name, newCustomer.phone),
      );
      showSuccess(`Thêm mới khách hàng "${newCustomer.name}" thành công!`);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const target = effectiveCustomers.find((c) => c.id === id);
    if (!target) return;

    try {
      await deleteCustomer(id).unwrap();
    } catch (err: unknown) {
      if (isHttpErrorResponse(err)) {
        const apiErr = getApiErrorMessage(
          err,
          `Không thể xóa khách hàng "${target.name}" trên hệ thống.`,
        );
        showError(apiErr);
        return;
      }
      // Fallback for offline / demo mode
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addLogEntry(
      CUSTOMER_LOG.DELETE_ACTION,
      CUSTOMER_LOG.deleted(target.name),
    );
    showSuccess(`Đã xóa khách hàng "${target.name}".`);
  };

  const handleConfirmReminder = (customer: ICustomer) => {
    addLogEntry(
      CUSTOMER_LOG.REMINDER_ACTION,
      CUSTOMER_LOG.reminded(customer.name, formatCurrency(customer.debt)),
    );
    showSuccess(`Đã ghi nhận gửi nhắc công nợ cho khách hàng "${customer.name}".`);
  };

  const handleConfirmPayDebt = async ({
    customerId,
    amount,
    paymentMethod,
    notes,
  }: DebtPaymentData) => {
    const target = effectiveCustomers.find((c) => c.id === customerId);
    if (!target) return;

    try {
      await payCustomerDebt({
        customerId,
        amount,
        paymentMethod,
        notes,
      }).unwrap();
    } catch (err: unknown) {
      if (isHttpErrorResponse(err)) {
        const apiErr = getApiErrorMessage(
          err,
          `Không thể ghi nhận thu nợ cho khách hàng "${target.name}" trên hệ thống.`,
        );
        showError(apiErr);
        throw new Error(apiErr);
      }
      // Fallback for offline / demo mode
    }

    const remainingDebt = Math.max(0, target.debt - amount);

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              debt: remainingDebt,
            }
          : c,
      ),
    );

    addLogEntry(
      CUSTOMER_LOG.PAY_DEBT_ACTION,
      CUSTOMER_LOG.debtPaid(
        target.name,
        formatCurrency(amount),
        formatCurrency(remainingDebt),
      ),
    );

    showSuccess(
      `Đã ghi nhận thu ${formatCurrency(amount)} đ từ khách hàng "${target.name}". Dư nợ còn lại: ${formatCurrency(remainingDebt)} đ.`,
    );
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <CustomerSidebar
          selectedDebtStatus={selectedDebtStatus}
          onSelectDebtStatus={setSelectedDebtStatus}
        />
      }
    >
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

      {/* Create / Edit Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        existingCustomers={effectiveCustomers}
        onOpenEditModal={handleOpenEditModal}
      />
    </DashboardWorkspaceLayout>
  );
};

export default CustomerPage;
