import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { CreateReturnTicketModal } from "../components/CreateReturnTicketModal";
import { APP_ROUTES } from "@/constants/routes";

export const CreateReturnTicketPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialInvoiceId = searchParams.get("invoiceId") || undefined;
  const { currentRole } = useDashboardDemo();

  return (
    <CreateReturnTicketModal
      isOpen={true}
      onClose={() => navigate(APP_ROUTES.RETURN_TICKETS || "/return-tickets")}
      initialInvoiceId={initialInvoiceId}
      currentRole={currentRole}
      onSuccess={() => navigate(APP_ROUTES.RETURN_TICKETS || "/return-tickets")}
    />
  );
};

export default CreateReturnTicketPage;
