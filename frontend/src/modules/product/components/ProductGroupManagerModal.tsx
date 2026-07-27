import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, AlertTriangle, Check, X } from "lucide-react";
import { APP_LANGUAGE } from "@/constants/format";
import {
  PRODUCT_GROUP_COPY,
  PRODUCT_KEYBOARD_KEY,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_SYMBOLS,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import {
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} from "@/modules/product/services/productApi";
import type { IProductGroup } from "@/modules/product/types/IProductGroup";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";

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
  const { showSuccess, showError } = useNotification();

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<IProductGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const mainDialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });
  const deleteDialogRef = useAccessibleDialog({
    isOpen: isOpen && isDeleteModalOpen && Boolean(groupToDelete),
    onClose: () => setIsDeleteModalOpen(false),
    canClose: !isDeleting,
  });

  const confirmDeleteGroup = async () => {
    if (!groupToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete.id).unwrap();
      refetch();
      showSuccess(
        PRODUCT_MESSAGE_BUILDERS.GROUP_DELETE_SUCCESS(groupToDelete.name),
      );
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_DELETE_FAILED),
      );
    } finally {
      setIsDeleting(false);
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
      showError(PRODUCT_MESSAGES.GROUP_NAME_REQUIRED);
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
      showSuccess(PRODUCT_MESSAGES.GROUP_UPDATE_SUCCESS);
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_UPDATE_FAILED),
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
      showSuccess(PRODUCT_MESSAGE_BUILDERS.GROUP_CREATE_SUCCESS(nameTrimmed));
    } catch (error: unknown) {
      setErrorMsg(
        getApiErrorMessage(error, PRODUCT_MESSAGES.GROUP_MUTATION_FAILED),
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
      aria-hidden={isDeleteModalOpen || undefined}
      inert={isDeleteModalOpen || undefined}
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
    >
      <div
        ref={mainDialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={PRODUCT_GROUP_COPY.TITLE}
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3.5 text-white">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {PRODUCT_GROUP_COPY.TITLE}
          </h2>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            aria-label={PRODUCT_GROUP_COPY.CLOSE_ACTION}
            className="flex min-h-11 min-w-11 items-center justify-center text-lg text-white/80 transition-colors hover:text-white"
          >
            {PRODUCT_SYMBOLS.CLOSE}
          </button>
        </div>

        {/* Modal Content */}
        <div className="app-modal-body flex flex-col gap-4 p-4 text-xs font-semibold text-slate-700 sm:p-5">
          
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
                  className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-kv-blue-primary focus:outline-none lg:h-9"
                />
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-kv-blue-primary font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9 lg:w-9"
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
            
            <div className="max-h-60 overflow-auto rounded-lg border border-slate-200">
              <table className="responsive-data-table responsive-data-table--compact w-full text-left border-collapse">
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
                                className="h-11 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-kv-blue-primary focus:outline-none lg:h-7"
                                autoFocus
                              />
                            </td>
                          ) : (
                            <td className="max-w-[200px] p-2.5 text-slate-800">
                              {isOwner ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartInlineEdit(group)}
                                  aria-label={`${PRODUCT_GROUP_COPY.INLINE_EDIT_TOOLTIP}: ${group.name}`}
                                  title={PRODUCT_GROUP_COPY.INLINE_EDIT_TOOLTIP}
                                  className="block min-h-11 w-full truncate rounded text-left font-semibold transition-colors hover:text-kv-blue-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-0"
                                >
                                  {group.name}
                                </button>
                              ) : (
                                <span className="block truncate" title={group.name}>
                                  {group.name}
                                </span>
                              )}
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
                                      aria-label={PRODUCT_GROUP_COPY.INLINE_SAVE_TOOLTIP}
                                      className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 lg:min-h-0 lg:min-w-0"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelInline}
                                      title={PRODUCT_GROUP_COPY.CANCEL_TOOLTIP}
                                      aria-label={PRODUCT_GROUP_COPY.CANCEL_TOOLTIP}
                                      className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 lg:min-h-0 lg:min-w-0"
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
                                      aria-label={PRODUCT_GROUP_COPY.DELETE_TOOLTIP}
                                      className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 lg:min-h-0 lg:min-w-0"
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
        <div className="app-modal-footer flex items-center justify-end gap-2 border-t p-4">
          <button
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            type="button"
            disabled={isSubmitting}
            className="h-11 rounded-lg bg-slate-100 px-4 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60 lg:h-9"
          >
            {PRODUCT_GROUP_COPY.CLOSE_ACTION}
          </button>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && groupToDelete && createPortal(
        <div 
          onClick={() => {
            if (!isDeleting) setIsDeleteModalOpen(false);
          }}
          className="app-modal-backdrop fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={deleteDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={PRODUCT_GROUP_COPY.DELETE_TITLE}
            aria-describedby="product-group-delete-description"
            className="app-modal-panel flex w-full max-w-sm flex-col overflow-y-auto rounded-xl border border-slate-100 bg-white p-5 text-center text-xs font-semibold shadow-2xl animate-modal-bounce-in sm:p-6"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-2">
              {PRODUCT_GROUP_COPY.DELETE_TITLE}
            </h3>
            <p
              id="product-group-delete-description"
              className="text-slate-500 leading-relaxed mb-6 font-semibold"
            >
              {PRODUCT_GROUP_COPY.DELETE_DESCRIPTION_PREFIX}{" "}
              <strong className="text-slate-700">"{groupToDelete.name}"</strong>
              {PRODUCT_GROUP_COPY.DELETE_DESCRIPTION_SUFFIX}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                disabled={isDeleting}
                className="h-11 flex-1 rounded-lg bg-slate-100 font-bold text-slate-700 transition-colors hover:bg-slate-200 lg:h-9"
              >
                {PRODUCT_GROUP_COPY.CANCEL_TOOLTIP}
              </button>
              <button
                onClick={confirmDeleteGroup}
                type="button"
                disabled={isDeleting}
                className="h-11 flex-1 rounded-lg bg-rose-600 font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60 lg:h-9"
              >
                {PRODUCT_GROUP_COPY.DELETE_CONFIRM_ACTION}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};
