import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IInvoice, TInvoiceStatus } from "../types/IInvoice";
import {
  useGetInvoicesQuery,
  useSubmitToTaxMutation,
  useResendInvoiceMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
} from "../services/eInvoiceApi";
import { InvoiceSidebar } from "../components/InvoiceSidebar";
import { InvoiceList } from "../components/InvoiceList";
import { InvoiceDetailModal } from "../components/InvoiceDetailModal";

export const InvoiceManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");
  const { showSuccess, showError, showInfo } = useNotification();

  const {
    isOnline,
    invoices: mockInvoices,
    setInvoices: setMockInvoices,
    addLogEntry,
    currentRole,
  } = useDashboardDemo();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<TInvoiceStatus[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Online RTK Query & Mutations
  const {
    data: apiInvoicesData,
    isLoading: isApiLoading,
    error: apiError,
  } = useGetInvoicesQuery(
    {
      status: statusFilter.join(","),
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: 0,
      size: 100,
    },
    { skip: !isOnline }
  );

  const [submitToTaxApi] = useSubmitToTaxMutation();
  const [resendInvoiceApi] = useResendInvoiceMutation();
  const [cancelInvoiceApi] = useCancelInvoiceMutation();
  const [updateInvoiceApi] = useUpdateInvoiceMutation();

  // Combine online/offline data
  const displayedInvoices = useMemo(() => {
    if (isOnline) {
      const apiList = apiInvoicesData?.result?.content || [];
      // Filter the API list locally for search query as well (just in case)
      if (!searchQuery.trim()) return apiList;
      const query = searchQuery.toLowerCase();
      return apiList.filter(
        (inv) =>
          (inv.lookupCode || "").toLowerCase().includes(query) ||
          (inv.buyerName || inv.customer || "").toLowerCase().includes(query) ||
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(query))
      );
    } else {
      // Offline/Demo local filtering
      return mockInvoices.filter((inv) => {
        // Status filter
        if (statusFilter.length > 0 && !statusFilter.includes(inv.status)) {
          return false;
        }
        // Date range filter
        if (fromDate) {
          const invDate = inv.time.split(" ")[0];
          if (invDate < fromDate) return false;
        }
        if (toDate) {
          const invDate = inv.time.split(" ")[0];
          if (invDate > toDate) return false;
        }
        // Search text
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchLookup = inv.lookupCode.toLowerCase().includes(query);
          const matchCustomer = inv.customer.toLowerCase().includes(query);
          const matchNumber = inv.invoiceNumber
            ? inv.invoiceNumber.toLowerCase().includes(query)
            : false;
          if (!matchLookup && !matchCustomer && !matchNumber) return false;
        }
        return true;
      });
    }
  }, [isOnline, apiInvoicesData, mockInvoices, statusFilter, fromDate, toDate, searchQuery]);

  // Handle URL ID query param for highlighted invoice
  useEffect(() => {
    if (highlightedId) {
      const found = displayedInvoices.find((inv) => inv.id === highlightedId);
      if (found) {
        setSelectedInvoice(found);
        setIsDetailOpen(true);
      }
    }
  }, [highlightedId, displayedInvoices]);

  const handleSelectInvoice = (invoice: IInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
    // Sync highlighted ID to URL
    setSearchParams({ id: invoice.id });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedInvoice(null);
    // Remove query param from URL
    const params = new URLSearchParams(searchParams);
    params.delete("id");
    setSearchParams(params);
  };

  // Submit Invoice to Tax Authority
  const handleSendToTax = async (invoiceId: string) => {
    if (isOnline) {
      try {
        const response = await submitToTaxApi(invoiceId).unwrap();
        showSuccess("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã.");
        if (response?.result) {
          setSelectedInvoice(response.result);
        }
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Không thể gửi hóa đơn điện tử lên Cơ quan Thuế."));
      }
    } else {
      // Offline Simulation
      const targetInvoice = mockInvoices.find((x) => x.id === invoiceId);
      if (!targetInvoice) return;

      const updatedInvoice: IInvoice = {
        ...targetInvoice,
        status: E_INVOICE_STATUS.WAITING_TAX_CODE,
        sentToTaxAt: new Date().toISOString(),
      };

      setMockInvoices((prev) => prev.map((x) => (x.id === invoiceId ? updatedInvoice : x)));
      setSelectedInvoice(updatedInvoice);
      addLogEntry("GỬI_THUẾ", `Nhân viên gửi hóa đơn ${targetInvoice.lookupCode} chờ cấp mã`);
      showSuccess("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã.");

      // Simulate automatic tax approval after 2.5 seconds (representing asynchronous tax system webhook)
      setTimeout(() => {
        setMockInvoices((prev) =>
          prev.map((item) => {
            if (item.id === invoiceId && item.status === E_INVOICE_STATUS.WAITING_TAX_CODE) {
              const approvedInvoice: IInvoice = {
                ...item,
                status: E_INVOICE_STATUS.ISSUED,
                invoiceNumber: String(prev.filter((x) => x.status === E_INVOICE_STATUS.ISSUED).length + 1).padStart(7, "0"),
                invoicePattern: "1",
                invoiceSymbol: "C26TAA",
                taxAuthorityCode: "CQT-20260715-" + Math.floor(100000 + Math.random() * 900000),
                taxResponseAt: new Date().toISOString(),
              };
              // Update selected invoice details in real-time if it's currently open
              if (selectedInvoice && selectedInvoice.id === invoiceId) {
                setSelectedInvoice(approvedInvoice);
              }
              showInfo(`Hóa đơn ${item.lookupCode} đã được cơ quan thuế cấp mã thành công!`);
              return approvedInvoice;
            }
            return item;
          })
        );
        addLogEntry("THUẾ_CẤP_MÃ", `Cơ quan thuế cấp mã thành công cho hóa đơn ${targetInvoice.lookupCode}`);
      }, 2500);
    }
  };

  // Resend Invoice after rejection / errors
  const handleResendToTax = async (invoiceId: string) => {
    if (isOnline) {
      try {
        const response = await resendInvoiceApi(invoiceId).unwrap();
        showSuccess("Đã gửi lại hóa đơn điện tử lên cơ quan thuế.");
        if (response?.result) {
          setSelectedInvoice(response.result);
        }
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Không thể gửi lại hóa đơn điện tử."));
      }
    } else {
      // Offline Simulation
      handleSendToTax(invoiceId);
    }
  };

  // Cancel Invoice (NCL-05)
  const handleCancelInvoice = async (invoiceId: string, reason: string) => {
    if (isOnline) {
      try {
        const response = await cancelInvoiceApi({ invoiceId, cancelReason: reason }).unwrap();
        showSuccess("Hủy hóa đơn điện tử thành công.");
        if (response?.result) {
          setSelectedInvoice(response.result);
        }
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Không thể thực hiện hủy hóa đơn điện tử."));
      }
    } else {
      // Offline Simulation
      const targetInvoice = mockInvoices.find((x) => x.id === invoiceId);
      if (!targetInvoice) return;

      const updatedInvoice: IInvoice = {
        ...targetInvoice,
        status: E_INVOICE_STATUS.CANCELED,
        cancelReason: reason,
        canceledAt: new Date().toISOString(),
        canceledByUsername: "chuho_viet", // Simulated logged in user
      };

      setMockInvoices((prev) => prev.map((x) => (x.id === invoiceId ? updatedInvoice : x)));
      setSelectedInvoice(updatedInvoice);
      addLogEntry("HỦY_HÓA_ĐƠN", `Hủy hóa đơn ${targetInvoice.lookupCode}. Lý do: ${reason}`);
      showSuccess("Hủy hóa đơn điện tử thành công.");
    }
  };

  // Update Invoice Buyer Info
  const handleUpdateInvoice = async (
    invoiceId: string,
    buyerInfo: {
      buyerName: string;
      buyerTaxCode: string;
      buyerAddress: string;
      buyerPhone: string;
      buyerEmail: string;
    }
  ) => {
    if (isOnline) {
      try {
        const response = await updateInvoiceApi({ invoiceId, ...buyerInfo }).unwrap();
        if (response?.result) {
          setSelectedInvoice(response.result);
        }
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Không thể cập nhật thông tin hóa đơn."));
        throw err;
      }
    } else {
      // Offline Simulation
      setMockInvoices((prev) =>
        prev.map((x) =>
          x.id === invoiceId
            ? {
                ...x,
                buyerName: buyerInfo.buyerName,
                buyerTaxCode: buyerInfo.buyerTaxCode,
                buyerAddress: buyerInfo.buyerAddress,
                buyerPhone: buyerInfo.buyerPhone,
                buyerEmail: buyerInfo.buyerEmail,
                customer: buyerInfo.buyerName || x.customer,
              }
            : x
        )
      );
      const current = mockInvoices.find((x) => x.id === invoiceId);
      if (current) {
        setSelectedInvoice({
          ...current,
          buyerName: buyerInfo.buyerName,
          buyerTaxCode: buyerInfo.buyerTaxCode,
          buyerAddress: buyerInfo.buyerAddress,
          buyerPhone: buyerInfo.buyerPhone,
          buyerEmail: buyerInfo.buyerEmail,
          customer: buyerInfo.buyerName || current.customer,
        });
      }
    }
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <InvoiceSidebar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      }
    >
      <div className="grid grid-cols-1 gap-6">
        {isOnline && apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg text-xs font-bold">
            ⚠️ {getApiErrorMessage(apiError, "Không thể đồng bộ danh sách hóa đơn từ máy chủ.")}
          </div>
        )}

        {isOnline && isApiLoading ? (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-lg text-center font-bold text-xs animate-pulse">
            Đang tải dữ liệu hóa đơn điện tử từ máy chủ...
          </div>
        ) : (
          <InvoiceList invoices={displayedInvoices} onSelectInvoice={handleSelectInvoice} />
        )}
      </div>

      {isDetailOpen && selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          invoice={selectedInvoice}
          currentRole={currentRole}
          onSendToTax={handleSendToTax}
          onResendToTax={handleResendToTax}
          onCancelInvoice={handleCancelInvoice}
          onUpdateInvoice={handleUpdateInvoice}
        />
      )}
    </DashboardWorkspaceLayout>
  );
};

export default InvoiceManagementPage;
