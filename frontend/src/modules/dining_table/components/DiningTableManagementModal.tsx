import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import {
  useGetDiningTablesQuery,
  useCreateDiningTableMutation,
  useUpdateDiningTableMutation,
  useDeleteDiningTableMutation,
} from "../services/diningTableApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IDiningTable } from "../types/IDiningTable";

interface IDiningTableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiningTableManagementModal: React.FC<IDiningTableManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<IDiningTable | null>(null);

  // Form states
  const [name, setName] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [seatCapacity, setSeatCapacity] = useState<number>(4);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // RTK Query
  const { data: tablesData, isLoading, refetch, isFetching } = useGetDiningTablesQuery(
    undefined,
    { skip: !isOpen }
  );
  const [createTableApi, { isLoading: isCreating }] = useCreateDiningTableMutation();
  const [updateTableApi, { isLoading: isUpdating }] = useUpdateDiningTableMutation();
  const [deleteTableApi, { isLoading: isDeleting }] = useDeleteDiningTableMutation();

  if (!isOpen) return null;

  const tables: IDiningTable[] = tablesData?.result || [];

  const handleOpenAddForm = () => {
    setEditingTable(null);
    setName("");
    setArea("");
    setSeatCapacity(4);
    setSortOrder(tables.length + 1);
    setIsActive(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (table: IDiningTable) => {
    setEditingTable(table);
    setName(table.name);
    setArea(table.area || "");
    setSeatCapacity(table.seatCapacity);
    setSortOrder(table.sortOrder);
    setIsActive(table.isActive);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTable(null);
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên bàn ăn");
      return;
    }
    if (seatCapacity <= 0) {
      setFormError("Số lượng chỗ ngồi phải lớn hơn 0");
      return;
    }

    try {
      if (editingTable) {
        await updateTableApi({
          id: editingTable.id,
          data: {
            name: name.trim(),
            area: area.trim() || undefined,
            seatCapacity,
            sortOrder,
            isActive,
          },
        }).unwrap();
      } else {
        await createTableApi({
          name: name.trim(),
          area: area.trim() || undefined,
          seatCapacity,
          sortOrder,
          isActive,
        }).unwrap();
      }
      handleCloseForm();
    } catch (err: unknown) {
      setFormError(
        getApiErrorMessage(err, "Không thể lưu thông tin bàn ăn. Vui lòng thử lại!")
      );
    }
  };

  const handleDeleteTable = async (table: IDiningTable) => {
    if (table.isOccupied) {
      alert(`Bàn "${table.name}" đang có khách phục vụ, không thể xóa!`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bàn "${table.name}" không?`)) {
      return;
    }
    try {
      await deleteTableApi(table.id).unwrap();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Không thể xóa bàn ăn. Vui lòng thử lại!"));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 text-white shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Quản Lý Danh Mục Bàn Ăn / Khu Vực
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Cấu hình sơ đồ bàn phục vụ tại chỗ cho điểm bán POS (NCL-03-CN-010)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-white/20 hover:text-white transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-xs text-slate-500 font-semibold">
              Tổng số bàn: <span className="font-extrabold text-slate-800">{tables.length}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bàn mới</span>
            </button>
          </div>

          {/* Inline Form Add/Edit */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmitForm}
              className="mb-5 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 animate-slide-down space-y-3"
            >
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="font-bold text-xs sm:text-sm text-blue-950">
                  {editingTable ? `Chỉnh sửa: ${editingTable.name}` : "Thêm bàn ăn mới"}
                </span>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên bàn ăn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Bàn 01, Bàn VIP..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khu vực / Tầng
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ví dụ: Tầng 1, Sân vườn, Tầng 2..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số chỗ ngồi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Bàn đang hoạt động
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {isCreating || isUpdating ? "Đang lưu..." : "Lưu bàn ăn"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tables Table */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Đang tải danh sách bàn ăn...
            </div>
          ) : tables.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Chưa có bàn ăn nào. Hãy bấm "Thêm bàn mới" để tạo bàn.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Tên bàn</th>
                    <th className="py-2.5 px-3">Khu vực</th>
                    <th className="py-2.5 px-3 text-center">Số chỗ</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 text-center">Phục vụ</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tables.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{t.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{t.area || "Mặc định"}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{t.seatCapacity}</td>
                      <td className="py-2.5 px-3 text-center">
                        {t.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                            Ngưng
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {t.isOccupied ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            {t.currentOrderLabel || "Có khách"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                            Trống
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(t)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTable(t)}
                            disabled={isDeleting || Boolean(t.isOccupied)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t.isOccupied ? "Bàn đang có khách không thể xóa" : "Xóa bàn"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
