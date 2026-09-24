import React from "react";
import { CustomerList } from "./CustomerList";
import type { DebtPaymentData } from "./DebtPaymentModal";
import type { ICustomer } from "../types/ICustomer";

interface CustomerManagementProps {
  customers: ICustomer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (customer: ICustomer) => void;
  onDeleteCustomer: (id: string) => void;
  onConfirmReminder: (customer: ICustomer, message?: string) => void;
  onConfirmPayDebt: (data: DebtPaymentData) => void | Promise<void>;
  onOpenReconcileModal?: (customer: ICustomer) => void;
  onOpenImportModal?: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCustomer,
  onConfirmReminder,
  onConfirmPayDebt,
  onOpenReconcileModal,
  onOpenImportModal,
}) => {
  return (
    <div className="w-full">
      <CustomerList
        customers={customers}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenCreateModal={onOpenCreateModal}
        onOpenEditModal={onOpenEditModal}
        onDeleteCustomer={onDeleteCustomer}
        onConfirmReminder={onConfirmReminder}
        onConfirmPayDebt={onConfirmPayDebt}
        onOpenReconcileModal={onOpenReconcileModal}
        onOpenImportModal={onOpenImportModal}
      />
    </div>
  );
};
