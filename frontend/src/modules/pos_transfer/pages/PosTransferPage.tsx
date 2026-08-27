import React, { useState } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  useGetTransfersQuery,
  useCreateTransferMutation,
  useReceiveTransferMutation,
  useCancelTransferMutation,
} from "../services/posTransferApi";
import { useGetActivePointsOfSaleQuery } from "@/modules/point_of_sale/services/pointOfSaleApi";
import type { IPosTransfer, ICreatePosTransferRequest, TPosTransferStatus } from "../types/IPosTransfer";
import { PosTransferTable } from "../components/PosTransferTable";
import { CreatePosTransferModal } from "../components/CreatePosTransferModal";
import { PosTransferDetailModal } from "../components/PosTransferDetailModal";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";

export const PosTransferPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TPosTransferStatus>("ALL");
  const [fromPosFilter, setFromPosFilter] = useState("");
  const [toPosFilter, setToPosFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Active Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<IPosTransfer | null>(null);

  // Queries
  const { data: posList = [] } = useGetActivePointsOfSaleQuery();

  const {
    data: transferData,
    isLoading,
    isFetching,
  } = useGetTransfersQuery({
    fromPosId: fromPosFilter || undefined,
    toPosId: toPosFilter || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    keyword: searchTerm.trim() || undefined,
    page: currentPage,
    size: pageSize,
  });

  const [createTransfer, { isLoading: isCreating }] = useCreateTransferMutation();
  const [receiveTransfer, { isLoading: isReceiving }] = useReceiveTransferMutation();
  const [cancelTransfer, { isLoading: isCanceling }] = useCancelTransferMutation();

  const transferList = transferData?.content || [];
  const totalElements = transferData?.totalElements || 0;
  const totalPages = transferData?.totalPages || 1;

  // KPIs
  const pendingCount = transferList.filter(
    (t) => t.status === "IN_TRANSIT" || (t.status as any) === "PENDING"
  ).length;
  const completedCount = transferList.filter((t) => t.status === "COMPLETED").length;
  const canceledCount = transferList.filter((t) => t.status === "CANCELED").length;

  const handleCreateSubmit = async (formData: ICreatePosTransferRequest) => {
    try {
      const res = await createTransfer(formData).unwrap();
      showSuccess(
        `Đã lập phiếu chuyển hàng "${res.transferNumber || res.transferCode}" thành công!`
      );
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showError(err?.data?.message || "Không thể lập phiếu chuyển hàng");
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await receiveTransfer(id).unwrap();
      showSuccess("Xác nhận đã nhận đủ hàng thành công! Tồn kho đã được cộng vào điểm nhận.");
      setSelectedTransfer(null);
    } catch (err: any) {
      showError(err?.data?.message || "Không thể xác nhận nhận hàng");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await cancelTransfer({ id, body: { cancelReason: reason } }).unwrap();
      showSuccess("Đã hủy phiếu chuyển hàng. Tồn kho đã được hoàn trả về điểm gửi.");
      setSelectedTransfer(null);
    } catch (err: any) {
      showError(err?.data?.message || "Không thể hủy phiếu chuyển hàng");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Chuyển hàng giữa các Điểm bán
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi luồng điều chuyển tồn kho giữa các chi nhánh, đảm bảo số liệu chính xác 2 đầu
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đang trên đường chuyển
            </span>
            <p className="text-lg font-black text-amber-600 mt-0.5">{pendingCount} phiếu</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đã nhận thành công
            </span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{completedCount} phiếu</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đã hủy
            </span>
            <p className="text-lg font-black text-slate-500 mt-0.5">{canceledCount} phiếu</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <PosTransferTable
        data={transferList}
        totalElements={totalElements}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(0);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(st) => {
          setStatusFilter(st);
          setCurrentPage(0);
        }}
        fromPosFilter={fromPosFilter}
        onFromPosFilterChange={(id) => {
          setFromPosFilter(id);
          setCurrentPage(0);
        }}
        toPosFilter={toPosFilter}
        onToPosFilterChange={(id) => {
          setToPosFilter(id);
          setCurrentPage(0);
        }}
        posList={posList}
        isLoading={isLoading || isFetching}
        onViewDetail={setSelectedTransfer}
        onAddNew={() => setIsCreateModalOpen(true)}
        userRole={currentRole}
      />

      {/* Modals */}
      <CreatePosTransferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />

      <PosTransferDetailModal
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        transfer={selectedTransfer}
        onReceive={handleReceive}
        onCancel={handleCancel}
        isReceiving={isReceiving}
        isCanceling={isCanceling}
        userRole={currentRole}
      />
    </div>
  );
};

export default PosTransferPage;
