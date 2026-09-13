import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  ShieldAlert,
} from "lucide-react";
import {
  useGetCashCategoriesQuery,
  useCreateCashCategoryMutation,
  useUpdateCashCategoryMutation,
  useDeleteCashCategoryMutation,
  useUpdateExpenseThresholdMutation,
} from "../services/cashTransactionApi";
import type {
  CashTransactionType,
  ICashTransactionCategoryResponse,
} from "../types/ICashTransaction";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface CashCategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold?: number;
}

export const CashCategoryManagementModal: React.FC<CashCategoryManagementModalProps> = ({
  isOpen,
  onClose,
  currentThreshold = 500000,
}) => {
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<CashTransactionType>("EXPENSE");

  // Threshold state
  const [thresholdInput, setThresholdInput] = useState<number>(currentThreshold);
  const [updateThreshold, { isLoading: isUpdatingThreshold }] = useUpdateExpenseThresholdMutation();

  // Category queries & mutations
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCashCategoriesQuery(
    { type: activeTab },
    { skip: !isOpen }
  );
  const categories = categoriesData?.result || [];

  const [createCategory, { isLoading: isCreating }] = useCreateCashCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCashCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCashCategoryMutation();

  // New Category Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit Category State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isCreating && !isUpdating && !isDeleting && !isUpdatingThreshold,
  });

  if (!isOpen) return null;

  const handleSaveThreshold = async () => {
    if (thresholdInput < 0) {
      showError("Hạn mức duyệt chi phải lớn hơn hoặc bằng 0");
      return;
    }
    try {
      await updateThreshold({ expenseApprovalThreshold: thresholdInput }).unwrap();
      showSuccess(`Đã cập nhật hạn mức duyệt chi thành ${formatCurrency(thresholdInput)}`);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể cập nhật hạn mức"));
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showError("Vui lòng nhập tên loại thu chi");
      return;
    }
    try {
      await createCategory({
        name: newName.trim(),
        type: activeTab,
        description: newDescription.trim() || undefined,
      }).unwrap();
      showSuccess(`Đã thêm loại ${activeTab === "INCOME" ? "thu" : "chi"} "${newName.trim()}"`);
      setNewName("");
      setNewDescription("");
      setIsAdding(false);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể tạo loại thu chi"));
    }
  };

  const handleStartEdit = (cat: ICashTransactionCategoryResponse) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      showError("Tên không được để trống");
      return;
    }
    try {
      await updateCategory({
        id,
        body: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        },
      }).unwrap();
      showSuccess("Cập nhật loại thu chi thành công");
      setEditingCatId(null);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể cập nhật"));
    }
  };

  const handleDelete = async (cat: ICashTransactionCategoryResponse) => {
    if (!window.confirm(`Bạn có chắc muốn xóa loại "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id).unwrap();
      showSuccess(`Đã xóa loại "${cat.name}"`);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể xóa loại thu chi"));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h3 id="cat-modal-title" className="text-sm font-extrabold text-slate-800">
                Quản lý thu chi & Hạn mức duyệt chi
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                Dành cho Chủ hộ kinh doanh thiết lập quy định tài chính ca
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Hạn mức duyệt chi tiền mặt */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hạn mức chi tiền mặt nhân viên tự duyệt (VNĐ)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Các khoản chi vượt hạn mức này do nhân viên lập sẽ phải được Chủ hộ phê duyệt trước khi đóng ca.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[240px]">
                <input
                  type="text"
                  inputMode="numeric"
                  value={thresholdInput ? formatNumber(thresholdInput) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setThresholdInput(raw ? parseInt(raw, 10) : 0);
                  }}
                  className="w-full bg-white border border-amber-300 rounded-lg pl-3 pr-10 py-1.5 font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">
                  VNĐ
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveThreshold}
                disabled={isUpdatingThreshold}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                {isUpdatingThreshold ? "Đang lưu..." : "Lưu hạn mức"}
              </button>
            </div>
          </div>

          {/* Section 2: Danh mục loại thu chi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs">
                Danh mục loại thu chi
              </h4>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("EXPENSE");
                    setIsAdding(false);
                    setEditingCatId(null);
                  }}
                  className={`px-3 py-1 font-bold rounded transition-all ${
                    activeTab === "EXPENSE"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Khoản Chi (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("INCOME");
                    setIsAdding(false);
                    setEditingCatId(null);
                  }}
                  className={`px-3 py-1 font-bold rounded transition-all ${
                    activeTab === "INCOME"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Khoản Thu (+)
                </button>
              </div>
            </div>

            {/* Add New Category Button / Form */}
            {!isAdding ? (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl text-slate-500 hover:text-blue-600 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm loại {activeTab === "INCOME" ? "thu" : "chi"} mới</span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateCategory}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 animate-fade-in"
              >
                <div className="font-bold text-slate-800 text-xs">
                  Thêm loại {activeTab === "INCOME" ? "thu" : "chi"} mới
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tên loại thu chi (ví dụ: Mua đá lạnh, Nạp tiền lẻ thối...)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-xs"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả mục đích (tùy chọn)..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newName.trim()}
                    className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    {isCreating ? "Đang thêm..." : "Thêm mới"}
                  </button>
                </div>
              </form>
            )}

            {/* List of categories */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {isCategoriesLoading ? (
                <div className="p-4 text-center text-slate-400 font-medium">
                  Đang tải danh mục...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-medium">
                  Chưa có loại thu chi nào trong nhóm này.
                </div>
              ) : (
                categories.map((cat) => {
                  const isEditing = editingCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      {!isEditing ? (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{cat.name}</span>
                              {cat.isSystemDefault && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <div className="text-[11px] text-slate-400 truncate">
                                {cat.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!cat.isSystemDefault && (
                              <button
                                type="button"
                                onClick={() => handleDelete(cat)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CashCategoryManagementModal;
