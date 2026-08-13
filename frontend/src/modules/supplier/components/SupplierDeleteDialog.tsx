import { createPortal } from "react-dom";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { SUPPLIER_DELETE_COPY } from "@/constants/supplier";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { ISupplier } from "@/modules/supplier/types/ISupplier";

interface SupplierDeleteDialogProps {
  supplier: ISupplier | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SupplierDeleteDialog = ({
  supplier,
  isDeleting,
  onClose,
  onConfirm,
}: SupplierDeleteDialogProps) => {
  const isOpen = Boolean(supplier);
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isDeleting,
  });

  if (!supplier) return null;

  return createPortal(
    <div
      className="app-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/45 p-3 backdrop-blur-sm animate-backdrop-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="supplier-delete-title"
        aria-describedby="supplier-delete-description"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-modal-bounce-in sm:p-6"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600">
          <AlertTriangle size={26} aria-hidden="true" />
        </div>
        <h2 id="supplier-delete-title" className="mt-4 text-center text-base font-extrabold text-slate-800">
          {SUPPLIER_DELETE_COPY.TITLE}
        </h2>
        <p id="supplier-delete-description" className="mt-2 text-center text-sm font-medium leading-6 text-slate-600">
          {SUPPLIER_DELETE_COPY.DESCRIPTION(supplier.name)}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:cursor-wait disabled:opacity-50 lg:min-h-9"
          >
            {SUPPLIER_DELETE_COPY.CANCEL_ACTION}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-wait disabled:opacity-60 lg:min-h-9"
          >
            {isDeleting && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
            {isDeleting
              ? SUPPLIER_DELETE_COPY.DELETING_ACTION
              : SUPPLIER_DELETE_COPY.CONFIRM_ACTION}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};
