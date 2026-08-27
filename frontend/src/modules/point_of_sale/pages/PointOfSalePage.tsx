import React, { useState } from "react";
import { Building2, Star, CheckCircle } from "lucide-react";
import {
  useGetPointsOfSaleQuery,
  useCreatePointOfSaleMutation,
  useUpdatePointOfSaleMutation,
  useSetDefaultPointOfSaleMutation,
  useDeletePointOfSaleMutation,
} from "../services/pointOfSaleApi";
import type { IPointOfSale, IPointOfSaleRequest } from "../types/IPointOfSale";
import { PointOfSaleTable } from "../components/PointOfSaleTable";
import { PointOfSaleModal } from "../components/PointOfSaleModal";
import { DeletePointOfSaleModal } from "../components/DeletePointOfSaleModal";
import { SetDefaultPosModal } from "../components/SetDefaultPosModal";
import { AssignEmployeeModal } from "../components/AssignEmployeeModal";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";

export const PointOfSalePage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Active modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<IPointOfSale | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPos, setDeletingPos] = useState<IPointOfSale | null>(null);

  const [isSetDefaultModalOpen, setIsSetDefaultModalOpen] = useState(false);
  const [defaultingPos, setDefaultingPos] = useState<IPointOfSale | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningPos, setAssigningPos] = useState<IPointOfSale | null>(null);

  // Queries & Mutations
  const isActiveParam = statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE";
  const { data: posData, isLoading, isFetching } = useGetPointsOfSaleQuery({
    keyword: searchTerm.trim() || undefined,
    isActive: isActiveParam,
    page: currentPage,
    size: pageSize,
  });

  const [createPointOfSale, { isLoading: isCreating }] = useCreatePointOfSaleMutation();
  const [updatePointOfSale, { isLoading: isUpdating }] = useUpdatePointOfSaleMutation();
  const [setDefaultPointOfSale, { isLoading: isSettingDefault }] = useSetDefaultPointOfSaleMutation();
  const [deletePointOfSale, { isLoading: isDeleting }] = useDeletePointOfSaleMutation();

  const posList = posData?.content || [];
  const totalElements = posData?.totalElements || 0;
  const totalPages = posData?.totalPages || 1;

  // KPIs
  const totalActiveCount = posList.filter((p) => p.isActive).length;
  const defaultPos = posList.find((p) => p.isDefault);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingPos(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pos: IPointOfSale) => {
    setEditingPos(pos);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: IPointOfSaleRequest) => {
    try {
      if (editingPos) {
        await updatePointOfSale({ id: editingPos.id, body: formData }).unwrap();
        showSuccess(`Cập nhật điểm bán "${formData.name}" thành công!`);
      } else {
        await createPointOfSale(formData).unwrap();
        showSuccess(`Tạo mới điểm bán "${formData.name}" thành công!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showError(err?.data?.message || "Đã xảy ra lỗi khi lưu điểm bán");
    }
  };

  const handleOpenDelete = (pos: IPointOfSale) => {
    setDeletingPos(pos);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPos) return;
    try {
      await deletePointOfSale(deletingPos.id).unwrap();
      showSuccess(`Xóa điểm bán "${deletingPos.name}" thành công!`);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      showError(err?.data?.message || "Không thể xóa điểm bán");
    }
  };

  const handleOpenSetDefault = (pos: IPointOfSale) => {
    setDefaultingPos(pos);
    setIsSetDefaultModalOpen(true);
  };

  const handleConfirmSetDefault = async () => {
    if (!defaultingPos) return;
    try {
      await setDefaultPointOfSale(defaultingPos.id).unwrap();
      showSuccess(`Đã đặt "${defaultingPos.name}" làm điểm bán mặc định!`);
      setIsSetDefaultModalOpen(false);
    } catch (err: any) {
      showError(err?.data?.message || "Không thể đặt làm điểm bán mặc định");
    }
  };

  const handleOpenAssign = (pos: IPointOfSale) => {
    setAssigningPos(pos);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Quản lý Điểm bán & Chi nhánh
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Khai báo nhiều quầy hoặc nhiều chi nhánh bán hàng trong cùng một tài khoản hộ kinh doanh
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng số điểm bán
            </span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{totalElements}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đang hoạt động
            </span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{totalActiveCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Điểm mặc định
            </span>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-[170px]" title={defaultPos?.name}>
              {defaultPos ? `${defaultPos.name} (${defaultPos.posCode})` : "Chưa thiết lập"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <PointOfSaleTable
        data={posList}
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
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(0);
        }}
        isLoading={isLoading || isFetching}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDelete}
        onSetDefault={handleOpenSetDefault}
        onAssignEmployees={handleOpenAssign}
        onAddNew={handleOpenAddModal}
        userRole={currentRole}
      />

      {/* Modals */}
      <PointOfSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPos}
        isLoading={isCreating || isUpdating}
      />

      <DeletePointOfSaleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        pointOfSale={deletingPos}
        isLoading={isDeleting}
      />

      <SetDefaultPosModal
        isOpen={isSetDefaultModalOpen}
        onClose={() => setIsSetDefaultModalOpen(false)}
        onConfirm={handleConfirmSetDefault}
        pointOfSale={defaultingPos}
        isLoading={isSettingDefault}
      />

      <AssignEmployeeModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        pointOfSale={assigningPos}
        onSuccessToast={(msg) => showSuccess(msg)}
        onErrorToast={(msg) => showError(msg)}
      />
    </div>
  );
};

export default PointOfSalePage;
