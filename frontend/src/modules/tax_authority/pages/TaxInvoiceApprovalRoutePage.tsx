import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { TaxInvoiceApprovalPage } from "./TaxInvoiceApprovalPage";

export const TaxInvoiceApprovalRoutePage = () => {
  const { invoices, setInvoices, addLogEntry } = useDashboardDemo();

  return (
    <TaxInvoiceApprovalPage
      invoices={invoices}
      setInvoices={setInvoices}
      addLogEntry={addLogEntry}
    />
  );
};

export default TaxInvoiceApprovalRoutePage;
