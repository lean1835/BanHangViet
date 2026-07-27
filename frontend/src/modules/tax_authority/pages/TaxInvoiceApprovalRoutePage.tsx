import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  useGetWaitingInvoicesQuery,
  useGetProcessedInvoicesQuery,
  useApproveInvoiceByTaxMutation,
  useRejectInvoiceByTaxMutation,
} from "../services/taxAuthorityApi";
import { TaxInvoiceApprovalPage } from "./TaxInvoiceApprovalPage";
import { createTaxAuthorityCode } from "@/constants/taxAuthority";
import { useMemo, useState } from "react";

export const TaxInvoiceApprovalRoutePage = () => {
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<"waiting" | "history">("waiting");

  // Fetch waiting invoices directly from backend API
  const {
    data: apiWaitingData,
    isLoading: isWaitingLoading,
    isError: isWaitingError,
    error: waitingError,
  } = useGetWaitingInvoicesQuery({ page: 0, size: 100 });

  // Fetch processed history directly from backend API
  const {
    data: apiHistoryData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
  } = useGetProcessedInvoicesQuery({ page: 0, size: 100 });

  const [approveInvoiceApi] = useApproveInvoiceByTaxMutation();
  const [rejectInvoiceApi] = useRejectInvoiceByTaxMutation();

  const waitingInvoices = useMemo(() => {
    return apiWaitingData?.result?.content || [];
  }, [apiWaitingData]);

  const historyInvoices = useMemo(() => {
    return apiHistoryData?.result?.content || [];
  }, [apiHistoryData]);

  const handleApprove = async (invoiceId: string) => {
    const generatedCode = createTaxAuthorityCode();
    try {
      await approveInvoiceApi({ invoiceId, taxAuthorityCode: generatedCode }).unwrap();
      showSuccess("Đã duyệt cấp mã hóa đơn thành công!");
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể duyệt cấp mã hóa đơn."));
    }
  };

  const handleReject = async (invoiceId: string) => {
    const reason = "Dữ liệu hóa đơn không hợp lệ theo quy định.";
    try {
      await rejectInvoiceApi({ invoiceId, errorMessage: reason }).unwrap();
      showSuccess("Đã từ chối cấp mã hóa đơn!");
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể từ chối cấp mã hóa đơn."));
    }
  };

  return (
    <TaxInvoiceApprovalPage
      waitingInvoices={waitingInvoices}
      historyInvoices={historyInvoices}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={activeTab === "waiting" ? isWaitingLoading : isHistoryLoading}
      isError={activeTab === "waiting" ? isWaitingError : isHistoryError}
      error={activeTab === "waiting" ? waitingError : historyError}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
};

export default TaxInvoiceApprovalRoutePage;
