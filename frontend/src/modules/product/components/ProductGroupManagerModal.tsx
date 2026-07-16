import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, AlertTriangle, Check, X } from "lucide-react";
import {
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} from "../services/productApi";
import { IProductGroup } from "../types/product";

interface ProductGroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const ProductGroupManagerModal: React.FC<ProductGroupManagerModalProps> = ({
  isOpen,
  onClose,
  userRole,
}) => {
  const isOwner = userRole === "VT-01";

  // Queries/Mutations
  const { data: groups = [], refetch } = useGetProductGroupsQuery();
  const [createGroup] = useCreateProductGroupMutation();
  const [updateGroup] = useUpdateProductGroupMutation();
  const [deleteGroup] = useDeleteProductGroupMutation();

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [groups]);

  // Form local states
  const [groupNameInput, setGroupNameInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom notification & confirm delete states
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<IProductGroup | null>(null);

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroup(groupToDelete.id).unwrap();
      refetch();
      showNotification(`Xóa nhóm hàng "${groupToDelete.name}" thành công`, "success");
    } catch (err: any) {
      showNotification(err?.data?.message || "Không thể xóa nhóm hàng!", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
    }
  };

  // Inline edit local states
  const [editingRowGroupId, setEditingRowGroupId] = useState<string | null>(null);
  const [editingRowGroupName, setEditingRowGroupName] = useState("");

  const handleStartInlineEdit = (group: IProductGroup) => {
    setEditingRowGroupId(group.id);
    setEditingRowGroupName(group.name);
  };

  const handleCancelInline = () => {
    setEditingRowGroupId(null);
    setEditingRowGroupName("");
  };

  const handleSaveInline = async (id: string) => {
    if (!isOwner) return; // Phòng vệ chiều sâu
    const nameTrimmed = editingRowGroupName.trim();
    if (!nameTrimmed) {
      showNotification("Tên nhóm hàng không được để trống!", "error");
      handleCancelInline();
      return;
    }
    const originalGroup = groups.find((g) => g.id === id);
    if (originalGroup && originalGroup.name === nameTrimmed) {
      handleCancelInline();
      return;
    }
    try {
      await updateGroup({ id, name: nameTrimmed }).unwrap();
      refetch();
      showNotification(`Cập nhật tên nhóm hàng thành công`, "success");
    } catch (err: any) {
      showNotification(err?.data?.message || "Không thể cập nhật tên nhóm hàng!", "error");
    } finally {
      handleCancelInline();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    
    const nameTrimmed = groupNameInput.trim();
    if (!nameTrimmed) {
      setErrorMsg("Tên nhóm hàng không được để trống!");
      return;
    }
    
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await createGroup({ name: nameTrimmed }).unwrap();
      setGroupNameInput("");
      refetch();
      showNotification(`Thêm nhóm hàng "${nameTrimmed}" thành công`, "success");
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Không thể thực hiện tác vụ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (group: IProductGroup) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Quản lý nhóm hàng hóa
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          
          {/* Authorization Check */}
          {!isOwner && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 text-amber-800 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Quy tắc bảo mật QTN-17:</strong> Chỉ có Chủ hộ kinh doanh mới được phép tạo, chỉnh sửa hoặc xóa nhóm hàng. Nhân viên/Kế toán chỉ có quyền xem danh sách.
              </span>
            </div>
          )}

          {/* Inline Form (VT-01 only) */}
          {isOwner && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <h3 className="text-slate-800 font-bold mb-1">
                Thêm nhóm hàng mới
              </h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên nhóm hàng..."
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  className="flex-1 border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-semibold text-slate-700"
                />
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white w-9 h-9 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center shrink-0"
                  title="Thêm nhóm hàng"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {errorMsg && (
                <span className="text-[10px] text-rose-500 font-bold mt-1">
                  {errorMsg}
                </span>
              )}
            </form>
          )}

          {/* Product Group List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-slate-800 font-bold border-b pb-2">
              Danh sách nhóm hàng ({sortedGroups.length})
            </h3>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5 w-16 text-center">STT</th>
                    <th className="p-2.5">Tên nhóm hàng</th>
                    {isOwner && <th className="p-2.5 w-24 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {sortedGroups.length === 0 ? (
                    <tr>
                      <td colSpan={isOwner ? 3 : 2} className="p-4 text-center text-slate-400 italic">
                        Chưa có nhóm hàng nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    sortedGroups.map((group, index) => {
                      const isRowEditing = editingRowGroupId === group.id;
                      return (
                        <tr key={group.id} className="hover:bg-slate-50/50 h-10">
                          <td className="p-2.5 text-center text-slate-400 font-mono">
                            {index + 1}
                          </td>
                          {isRowEditing ? (
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={editingRowGroupName}
                                onChange={(e) => setEditingRowGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveInline(group.id);
                                  if (e.key === "Escape") handleCancelInline();
                                }}
                                className="border border-slate-300 h-7 px-2 rounded-md focus:outline-none focus:border-kv-blue-primary text-xs w-full font-semibold text-slate-700 bg-white"
                                autoFocus
                              />
                            </td>
                          ) : (
                            <td 
                              onClick={() => isOwner && handleStartInlineEdit(group)}
                              className={`p-2.5 text-slate-800 truncate max-w-[200px] ${
                                isOwner ? "cursor-pointer hover:text-kv-blue-primary hover:underline" : ""
                              }`}
                              title={isOwner ? "Nhấp chuột để sửa trực tiếp" : group.name}
                            >
                              {group.name}
                            </td>
                          )}
                          {isOwner && (
                            <td className="p-2.5">
                              <div className="flex items-center justify-center gap-2">
                                {isRowEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInline(group.id)}
                                      title="Lưu trực tiếp"
                                      className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelInline}
                                      title="Hủy bỏ"
                                      className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                                    >
                                      <X size={13} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteClick(group)}
                                      title="Xóa nhóm"
                                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t gap-2">
          <button
            onClick={onClose}
            type="button"
            className="bg-slate-100 hover:bg-slate-200 transition-colors px-4 h-9 rounded-lg text-slate-700 font-bold font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && groupToDelete && createPortal(
        <div 
          onClick={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col p-6 animate-modal-bounce-in text-center font-semibold text-xs"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-2">
              Xác nhận xóa nhóm hàng?
            </h3>
            <p className="text-slate-500 leading-relaxed mb-6 font-semibold">
              Bạn có chắc chắn muốn xóa nhóm hàng <strong className="text-slate-700">"{groupToDelete.name}"</strong>? Hàng hóa thuộc nhóm này sẽ được chuyển về nhóm mặc định.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors h-9 rounded-lg text-slate-700 font-bold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeleteGroup}
                type="button"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white transition-colors h-9 rounded-lg font-bold shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Notification Toast */}
      {notification && createPortal(
        <div className="fixed top-5 right-5 z-[210] flex items-center gap-3 bg-white border border-slate-100 shadow-2xl px-4 py-3 rounded-xl max-w-sm animate-modal-bounce-in font-semibold text-xs">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
            notification.type === "success" ? "bg-emerald-500" : "bg-rose-500"
          }`}>
            {notification.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col gap-0.5 max-w-[200px] text-left">
            <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
              {notification.type === "success" ? "Thành công" : "Thông báo"}
            </span>
            <span className="text-slate-500 text-[11px] leading-snug break-words">
              {notification.message}
            </span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto font-semibold"
          >
            ✕
          </button>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};
