import React from "react";
import type { FormEventHandler } from "react";
import { CustomerForm } from "./CustomerForm";
import { CustomerList } from "./CustomerList";
import type { ICustomer } from "../types/ICustomer";

interface CustomerManagementProps {
  customers: ICustomer[];
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onSubmit,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <CustomerList customers={customers} />
      <CustomerForm onSubmit={onSubmit} />
    </div>
  );
};
