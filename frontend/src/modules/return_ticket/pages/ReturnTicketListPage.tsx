import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  RETURN_TICKET_CONFIG,
  type TReturnTicketStatus,
} from "@/constants/returnTicket";
import {
  useGetReturnTicketsQuery,
  useApproveReturnTicketMutation,
} from "../services/returnTicketApi";
import { ReturnTicketSidebar } from "../components/ReturnTicketSidebar";
import { ReturnTicketTable } from "../components/ReturnTicketTable";
import { ReturnTicketDetailModal } from "../components/ReturnTicketDetailModal";
import { ReturnTicketRejectModal } from "../components/ReturnTicketRejectModal";
import { ReturnTicketPrintModal } from "../components/ReturnTicketPrintModal";
import { ReturnTicketStatistics } from "../components/ReturnTicketStatistics";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IReturnTicket } from "../types/IReturnTicket";

export const ReturnTicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  // Tabs: 'LIST' | 'STATISTICS'
  const [activeTab, setActiveTab] = useState<"LIST" | "STATISTICS">("LIST");

  // Filters
  const [statusFilter, setStatusFilter] = useState<TReturnTicketStatus | "ALL">("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = RETURN_TICKET_CONFIG.DEFAULT_PAGE_SIZE;

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<IReturnTicket | null>(null);
  const [rejectingTicket, setRejectingTicket] = useState<IReturnTicket | null>(null);
  const [printingTicket, setPrintingTicket] = useState<IReturnTicket | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, refetch } = useGetReturnTicketsQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: searchQuery.trim() || undefined,
    page: currentPage,
    size: pageSize,
  });

  const [approveTicket] = useApproveReturnTicketMutation();

  const isOwnerOrAccountant =
    currentRole === USER_ROLES.OWNER ||
    currentRole === USER_ROLES.ACCOUNTANT;

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setCurrentPage(0);
  };

  const handleApprove = async (ticketId: string) => {
    try {
      await approveTicket(ticketId).unwrap();
      showSuccess("Đã duyệt phiếu trả hàng và tự động cập nhật lại tồn kho!");
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể duyệt phiếu trả hàng"));
    }
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        activeTab === "LIST" ? (
          <ReturnTicketSidebar
            statusFilter={statusFilter}
            onStatusChange={(st) => {
              setStatusFilter(st);
              setCurrentPage(0);
            }}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={(fd) => {
              setFromDate(fd);
              setCurrentPage(0);
            }}
            onToDateChange={(td) => {
              setToDate(td);
              setCurrentPage(0);
            }}
            searchQuery={searchQuery}
            onSearchChange={(sq) => {
              setSearchQuery(sq);
              setCurrentPage(0);
            }}
            onResetFilters={handleResetFilters}
          />
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 w-full flex-1 animate-page-fade">
        {/* Top Actions & Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("LIST")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
                activeTab === "LIST"
                  ? "bg-white text-kv-blue-primary border border-slate-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
              }`}
            >
              Danh sách phiếu trả hàng
            </button>
            {isOwnerOrAccountant && (
              <button
                type="button"
                onClick={() => setActiveTab("STATISTICS")}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
                  activeTab === "STATISTICS"
                    ? "bg-white text-kv-blue-primary border border-slate-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
                }`}
              >
                Báo cáo thống kê hàng trả lại
              </button>
            )}
          </div>

          {/* Create Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.RETURN_TICKET_CREATE)}
              className="flex h-11 lg:h-9 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark active:scale-95"
            >
              <Plus size={15} />
              LẬP PHIẾU TRẢ HÀNG
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "LIST" ? (
          <ReturnTicketTable
            tickets={data?.result?.content || []}
            isLoading={isLoading}
            isError={isError}
            currentRole={currentRole}
            currentPage={currentPage}
            totalPages={data?.result?.totalPages || 0}
            totalElements={data?.result?.totalElements || 0}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            onApproveTicket={handleApprove}
            onRejectTicket={(ticket) => setRejectingTicket(ticket)}
            onPrintTicket={(ticket) => setPrintingTicket(ticket)}
            onOpenCreate={() => navigate(APP_ROUTES.RETURN_TICKET_CREATE)}
          />
        ) : (
          <ReturnTicketStatistics />
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <ReturnTicketDetailModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          currentRole={currentRole}
          onRefresh={refetch}
        />
      )}

      {/* Reject Modal */}
      {rejectingTicket && (
        <ReturnTicketRejectModal
          isOpen={Boolean(rejectingTicket)}
          onClose={() => setRejectingTicket(null)}
          ticketId={rejectingTicket.id}
          ticketNumber={rejectingTicket.ticketNumber}
          onSuccess={refetch}
        />
      )}

      {/* Print Modal */}
      {printingTicket && (
        <ReturnTicketPrintModal
          isOpen={Boolean(printingTicket)}
          onClose={() => setPrintingTicket(null)}
          ticket={printingTicket}
        />
      )}
    </DashboardWorkspaceLayout>
  );
};

export default ReturnTicketListPage;
