import type { FormEvent } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import {
  CUSTOMER_FORM_DEFAULTS,
  CUSTOMER_FORM_FIELDS,
  CUSTOMER_LOG,
  getNextCustomerId,
} from "@/constants/customer";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { CustomerManagement } from "../components/CustomerManagement";
import { CustomerSidebar } from "../components/CustomerSidebar";
import type { ICustomer } from "../types/ICustomer";

export const CustomerPage = () => {
  const { customers, setCustomers, addLogEntry } = useDashboardDemo();

  const handleAddCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newCustomer: ICustomer = {
      id: getNextCustomerId(customers.length),
      name: data.get(CUSTOMER_FORM_FIELDS.NAME) as string,
      phone: data.get(CUSTOMER_FORM_FIELDS.PHONE) as string,
      email: data.get(CUSTOMER_FORM_FIELDS.EMAIL) as string,
      creditLimit: Number(data.get(CUSTOMER_FORM_FIELDS.CREDIT_LIMIT)),
      debt: CUSTOMER_FORM_DEFAULTS.INITIAL_DEBT,
    };

    setCustomers((currentCustomers) => [...currentCustomers, newCustomer]);
    addLogEntry(
      CUSTOMER_LOG.ACTION,
      CUSTOMER_LOG.added(newCustomer.name, newCustomer.phone),
    );
    form.reset();
  };

  return (
    <DashboardWorkspaceLayout sidebar={<CustomerSidebar />}>
      <CustomerManagement customers={customers} onSubmit={handleAddCustomer} />
    </DashboardWorkspaceLayout>
  );
};

export default CustomerPage;
