import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  useGetWaitingInvoicesQuery,
  useGetProcessedInvoicesQuery,
  useApproveInvoiceByTaxMutation,
  useRejectInvoiceByTaxMutation,
} from "../services/taxAuthorityApi";
import {
  useGetErrorNoticesQuery,
  useRejectNoticeByTaxMutation,
} from "@/modules/e_invoice/services/invoiceErrorNoticeApi";
import { TaxInvoiceApprovalPage, TaxApprovalTab } from "./TaxInvoiceApprovalPage";
import { createTaxAuthorityCode } from "@/constants/taxAuthority";
import { useMemo, useState } from "react";

export const TaxInvoiceApprovalRoutePage = () => {
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<TaxApprovalTab>("waiting");

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

  // Fetch error notices sent to tax authority
  const {
    data: apiErrorNoticesData,
    isLoading: isErrorNoticesLoading,
    isError: isErrorNoticesError,
    error: errorNoticesError,
  } = useGetErrorNoticesQuery({ page: 0, size: 100 });

  const [approveInvoiceApi] = useApproveInvoiceByTaxMutation();
  const [rejectInvoiceApi] = useRejectInvoiceByTaxMutation();
  const [rejectNoticeApi] = useRejectNoticeByTaxMutation();

  const waitingInvoices = useMemo(() => {
    return apiWaitingData?.result?.content || [];
  }, [apiWaitingData]);

  const historyInvoices = useMemo(() => {
    return apiHistoryData?.result?.content || [];
  }, [apiHistoryData]);

  const errorNotices = useMemo(() => {
    return apiErrorNoticesData?.result?.content || [];
  }, [apiErrorNoticesData]);

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

  const handleRejectNotice = async (noticeId: string, reason?: string) => {
    try {
      await rejectNoticeApi({ id: noticeId, errorMessage: reason }).unwrap();
      showSuccess("CQT đã từ chối tiếp nhận thông báo sai sót!");
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể từ chối thông báo sai sót."));
    }
  };

  const isLoading =
    activeTab === "waiting"
      ? isWaitingLoading
      : activeTab === "history"
      ? isHistoryLoading
      : isErrorNoticesLoading;

  const isError =
    activeTab === "waiting"
      ? isWaitingError
      : activeTab === "history"
      ? isHistoryError
      : isErrorNoticesError;

  const currentError =
    activeTab === "waiting"
      ? waitingError
      : activeTab === "history"
      ? historyError
      : errorNoticesError;

  return (
    <TaxInvoiceApprovalPage
      waitingInvoices={waitingInvoices}
      historyInvoices={historyInvoices}
      errorNotices={errorNotices}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={isLoading}
      isError={isError}
      error={currentError}
      onApprove={handleApprove}
      onReject={handleReject}
      onRejectNotice={handleRejectNotice}
    />
  );
};

export default TaxInvoiceApprovalRoutePage;

