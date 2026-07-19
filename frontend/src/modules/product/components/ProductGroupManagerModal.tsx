import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, AlertTriangle, Check, X } from "lucide-react";
import { APP_LANGUAGE } from "@/constants/format";
import {
  PRODUCT_GROUP_COPY,
  PRODUCT_KEYBOARD_KEY,
  PRODUCT_LABELS,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_NOTIFICATION_TYPE,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_SYMBOLS,
  PRODUCT_UI_CONFIG,
  type TProductNotificationType,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import {
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} from "@/modules/product/services/productApi";
import type { IProductGroup } from "@/modules/product/types/IProductGroup";
import { getProductApiErrorMessage } from "@/modules/product/utils/getProductApiErrorMessage";

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
  const isOwner = userRole === USER_ROLES.OWNER;

  // Queries/Mutations
  const { data: groups = [], refetch } = useGetProductGroupsQuery();
  const [createGroup] = useCreateProductGroupMutation();
  const [updateGroup] = useUpdateProductGroupMutation();
  const [deleteGroup] = useDeleteProductGroupMutation();

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, APP_LANGUAGE),
    );
  }, [groups]);

  // Form local states
  const [groupNameInput, setGroupNameInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom notification & confirm delete states
  const [notification, setNotification] = useState<{
    message: string;
    type: TProductNotificationType;
  } | null>(null);

  const showNotification = (
    message: string,
    type: TProductNotificationType,
  ) => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, PRODUCT_UI_CONFIG.NOTIFICATION_DURATION_MS);
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
      showNotification(
        PRODUCT_MESSAGE_BUILDERS.GROUP_DELETE_SUCCESS(groupToDelete.name),
        PRODUCT_NOTIFICATION_TYPE.SUCCESS,
      );
    } catch (error: unknown) {
      showNotification(
        getProductApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_DELETE_FAILED),
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
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
      showNotification(
        PRODUCT_MESSAGES.GROUP_NAME_REQUIRED,
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
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
      showNotification(
        PRODUCT_MESSAGES.GROUP_UPDATE_SUCCESS,
        PRODUCT_NOTIFICATION_TYPE.SUCCESS,
      );
    } catch (error: unknown) {
      showNotification(
        getProductApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_UPDATE_FAILED),
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
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
      setErrorMsg(PRODUCT_MESSAGES.GROUP_NAME_REQUIRED);
      return;
    }
    
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await createGroup({ name: nameTrimmed }).unwrap();
      setGroupNameInput("");
      refetch();
      showNotification(
        PRODUCT_MESSAGE_BUILDERS.GROUP_CREATE_SUCCESS(nameTrimmed),
        PRODUCT_NOTIFICATION_TYPE.SUCCESS,
      );
    } catch (error: unknown) {
      setErrorMsg(
        getProductApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_MUTATION_FAILED),
      );
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
            {PRODUCT_GROUP_COPY.TITLE}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            {PRODUCT_SYMBOLS.CLOSE}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          
          {/* Authorization Check */}
          {!isOwner && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 text-amber-800 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>{PRODUCT_GROUP_COPY.SECURITY_RULE_TITLE}</strong>{" "}
                {PRODUCT_GROUP_COPY.SECURITY_RULE_DESCRIPTION}
              </span>
            </div>
          )}

          {/* Inline Form (owner only) */}
          {isOwner && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <h3 className="text-slate-800 font-bold mb-1">
                {PRODUCT_GROUP_COPY.CREATE_TITLE}
              </h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={PRODUCT_GROUP_COPY.NAME_PLACEHOLDER}
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  className="flex-1 border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-semibold text-slate-700"
                />
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white w-9 h-9 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center shrink-0"
                  title={PRODUCT_GROUP_COPY.CREATE_TOOLTIP}
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
              {PRODUCT_GROUP_COPY.LIST_TITLE} ({sortedGroups.length})
            </h3>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5 w-16 text-center">
                      {PRODUCT_GROUP_COPY.INDEX_HEADER}
                    </th>
                    <th className="p-2.5">{PRODUCT_GROUP_COPY.NAME_HEADER}</th>
                    {isOwner && (
                      <th className="p-2.5 w-24 text-center">
                        {PRODUCT_GROUP_COPY.ACTION_HEADER}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {sortedGroups.length === 0 ? (
                    <tr>
                      <td colSpan={isOwner ? 3 : 2} className="p-4 text-center text-slate-400 italic">
                        {PRODUCT_GROUP_COPY.EMPTY_MESSAGE}
                      </td>
                    </tr>
                  ) : (
                    sortedGroups.map((group, index) => {
                      const isRowEditing = editingRowGroupId === group.id;
                      return (
                        <tr key={group.id} className="hover:bg-slate-50/50 h-10">
                          <td className="p-2.5 text-center text-slate-400 font-mono">
                            {index + PRODUCT_QUERY_CONFIG.DISPLAY_INDEX_OFFSET}
                          </td>
                          {isRowEditing ? (
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={editingRowGroupName}
                                onChange={(e) => setEditingRowGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === PRODUCT_KEYBOARD_KEY.ENTER) {
                                    handleSaveInline(group.id);
                                  }
                                  if (e.key === PRODUCT_KEYBOARD_KEY.ESCAPE) {
                                    handleCancelInline();
                                  }
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
                              title={
                                isOwner
                                  ? PRODUCT_GROUP_COPY.INLINE_EDIT_TOOLTIP
                                  : group.name
                              }
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
                                      title={PRODUCT_GROUP_COPY.INLINE_SAVE_TOOLTIP}
                                      className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelInline}
                                      title={PRODUCT_GROUP_COPY.CANCEL_TOOLTIP}
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
                                      title={PRODUCT_GROUP_COPY.DELETE_TOOLTIP}
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
            {PRODUCT_GROUP_COPY.CLOSE_ACTION}
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
              {PRODUCT_GROUP_COPY.DELETE_TITLE}
            </h3>
            <p className="text-slate-500 leading-relaxed mb-6 font-semibold">
              {PRODUCT_GROUP_COPY.DELETE_DESCRIPTION_PREFIX}{" "}
              <strong className="text-slate-700">"{groupToDelete.name}"</strong>
              {PRODUCT_GROUP_COPY.DELETE_DESCRIPTION_SUFFIX}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors h-9 rounded-lg text-slate-700 font-bold"
              >
                {PRODUCT_GROUP_COPY.CANCEL_TOOLTIP}
              </button>
              <button
                onClick={confirmDeleteGroup}
                type="button"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white transition-colors h-9 rounded-lg font-bold shadow-sm"
              >
                {PRODUCT_GROUP_COPY.DELETE_CONFIRM_ACTION}
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
            notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
              ? "bg-emerald-500"
              : "bg-rose-500"
          }`}>
            {notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
              ? PRODUCT_SYMBOLS.SUCCESS
              : PRODUCT_SYMBOLS.CLOSE}
          </div>
          <div className="flex flex-col gap-0.5 max-w-[200px] text-left">
            <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
              {notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
                ? PRODUCT_LABELS.NOTIFICATION_SUCCESS
                : PRODUCT_LABELS.NOTIFICATION_NOTICE}
            </span>
            <span className="text-slate-500 text-[11px] leading-snug break-words">
              {notification.message}
            </span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto font-semibold"
          >
            {PRODUCT_SYMBOLS.CLOSE}
          </button>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};
