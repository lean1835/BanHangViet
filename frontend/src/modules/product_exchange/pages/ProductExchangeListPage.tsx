import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, ArrowRightLeft } from "lucide-react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { APP_ROUTES } from "@/constants/routes";
import { PRODUCT_EXCHANGE_CONFIG } from "@/constants/productExchange";
import { ProductExchangeTable } from "../components/ProductExchangeTable";
import { ProductExchangeSidebar } from "../components/ProductExchangeSidebar";
import { ProductExchangeDetailModal } from "../components/ProductExchangeDetailModal";
import { ProductExchangePrintModal } from "../components/ProductExchangePrintModal";
import {
  useGetExchangeTicketsQuery,
  useGetExchangeTicketByIdQuery,
} from "../services/productExchangeApi";
import type { IProductExchangeTicket } from "../types/IProductExchange";

export const ProductExchangeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketIdParam = searchParams.get("id");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeTypeFilter, setExchangeTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = PRODUCT_EXCHANGE_CONFIG.DEFAULT_PAGE_SIZE;

  // Modals State
  const [selectedTicket, setSelectedTicket] = useState<IProductExchangeTicket | null>(null);
  const [printingTicket, setPrintingTicket] = useState<IProductExchangeTicket | null>(null);

  // Queries
  const { data: ticketsData, isLoading } = useGetExchangeTicketsQuery({
    invoiceId: searchQuery.trim() || undefined,
    exchangeType: exchangeTypeFilter === "ALL" ? undefined : exchangeTypeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page: currentPage,
    size: pageSize,
    sort: "createdAt,desc",
  });

  const { data: singleTicketData } = useGetExchangeTicketByIdQuery(ticketIdParam || "", {
    skip: !ticketIdParam,
  });

  // Open detail if id param exists
  useEffect(() => {
    if (singleTicketData?.result) {
      setSelectedTicket(singleTicketData.result);
    }
  }, [singleTicketData]);

  const rawTickets = ticketsData?.result?.content || [];
  const totalPages = ticketsData?.result?.totalPages || 0;
  const totalElements = ticketsData?.result?.totalElements || 0;

  // Client-side date filter when user picks a date range
  const displayTickets = useMemo(() => {
    let list = rawTickets;
    if (fromDate) {
      const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() >= fromTime);
    }
    if (toDate) {
      const toTime = new Date(`${toDate}T23:59:59.999`).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() <= toTime);
    }
    return list;
  }, [rawTickets, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setExchangeTypeFilter("ALL");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(0);
  };

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <ProductExchangeSidebar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(0);
          }}
          exchangeTypeFilter={exchangeTypeFilter}
          onExchangeTypeChange={(val) => {
            setExchangeTypeFilter(val);
            setCurrentPage(0);
          }}
          statusFilter={statusFilter}
          onStatusChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(0);
          }}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={(val) => {
            setFromDate(val);
            setCurrentPage(0);
          }}
          onToDateChange={(val) => {
            setToDate(val);
            setCurrentPage(0);
          }}
          onResetFilters={handleResetFilters}
        />
      }
    >
      <div className="flex flex-col gap-4 w-full flex-1 animate-page-fade">
        {/* Top Actions & Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm bg-white text-kv-blue-primary border border-slate-200"
            >
              Danh sách phiếu đổi hàng
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.RETURN_TICKETS)}
              className="flex h-11 lg:h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              title="Quản lý trả hàng"
            >
              <ArrowRightLeft size={15} />
              TRẢ HÀNG
            </button>

            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.PRODUCT_EXCHANGE_CREATE)}
              className="flex h-11 lg:h-9 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              LẬP PHIẾU ĐỔI HÀNG
            </button>
          </div>
        </div>

        {/* Content Area */}
        <ProductExchangeTable
          tickets={displayTickets}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onViewDetail={setSelectedTicket}
          onPrintTicket={setPrintingTicket}
        />
      </div>

      {/* Modals */}
      {selectedTicket && (
        <ProductExchangeDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onPrint={(t) => {
            setSelectedTicket(null);
            setPrintingTicket(t);
          }}
        />
      )}

      {printingTicket && (
        <ProductExchangePrintModal
          ticket={printingTicket}
          onClose={() => setPrintingTicket(null)}
        />
      )}
    </DashboardWorkspaceLayout>
  );
};

export default ProductExchangeListPage;
