import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserRoundPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { SUPPLIER_GROUP_FORM_COPY } from "@/constants/supplier";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  supplierGroupSchema,
  type TSupplierGroupFormValues,
} from "@/modules/supplier/schemas/supplierSchema";
import type { ISupplierGroupPayload } from "@/modules/supplier/types/ISupplier";

interface SupplierGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ISupplierGroupPayload) => Promise<void>;
}

const EMPTY_GROUP: TSupplierGroupFormValues = { name: "", note: "" };

export const SupplierGroupFormModal = ({
  isOpen,
  onClose,
  onSave,
}: SupplierGroupFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TSupplierGroupFormValues>({
    resolver: zodResolver(supplierGroupSchema),
    defaultValues: EMPTY_GROUP,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(EMPTY_GROUP);
    setGlobalError("");
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const submitForm = async (values: TSupplierGroupFormValues) => {
    try {
      setIsSubmitting(true);
      setGlobalError("");
      await onSave(values);
      onClose();
    } catch (error: unknown) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Chưa thể lưu nhóm nhà cung cấp. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = (hasError: boolean): string =>
    `min-h-11 rounded-lg border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/15 lg:min-h-10 lg:text-xs ${
      hasError ? "border-rose-400" : "border-slate-300"
    }`;

  return createPortal(
    <div
      className="app-modal-backdrop fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-900/55 p-3 backdrop-blur-[1px] animate-backdrop-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-group-form-title"
        className="app-modal-panel flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl animate-modal-bounce-in"
      >
        <header className="flex min-h-16 items-center justify-between bg-slate-800 px-5 text-white sm:px-6">
          <div className="flex items-center gap-2.5">
            <UserRoundPlus size={21} aria-hidden="true" />
            <h2 id="supplier-group-form-title" className="text-base font-extrabold">
              {SUPPLIER_GROUP_FORM_COPY.TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 lg:min-h-9 lg:min-w-9"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit(submitForm)}>
          <div className="space-y-4 p-5 sm:p-6">
            {globalError && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {globalError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-group-name" className="text-xs font-bold text-slate-700">
                {SUPPLIER_GROUP_FORM_COPY.NAME_LABEL} <span className="text-rose-600">*</span>
              </label>
              <input
                id="supplier-group-name"
                type="text"
                autoComplete="off"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "supplier-group-name-error" : undefined}
                placeholder={SUPPLIER_GROUP_FORM_COPY.NAME_PLACEHOLDER}
                className={inputClassName(Boolean(errors.name))}
              />
              {errors.name && (
                <p id="supplier-group-name-error" className="text-xs font-semibold text-rose-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-group-note" className="text-xs font-bold text-slate-700">
                {SUPPLIER_GROUP_FORM_COPY.NOTE_LABEL}
              </label>
              <textarea
                id="supplier-group-note"
                rows={4}
                {...register("note")}
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? "supplier-group-note-error" : undefined}
                placeholder={SUPPLIER_GROUP_FORM_COPY.NOTE_PLACEHOLDER}
                className={`${inputClassName(Boolean(errors.note))} resize-y py-3`}
              />
              {errors.note && (
                <p id="supplier-group-note-error" className="text-xs font-semibold text-rose-600">
                  {errors.note.message}
                </p>
              )}
            </div>
          </div>

          <footer className="mx-5 flex flex-col-reverse gap-2 border-t border-slate-200 py-4 sm:mx-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:opacity-50 lg:min-h-10"
            >
              {SUPPLIER_GROUP_FORM_COPY.CANCEL_ACTION}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-kv-blue-primary px-6 text-xs font-bold text-white transition-colors hover:bg-kv-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-blue-primary disabled:opacity-60 lg:min-h-10"
            >
              {isSubmitting && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
              {isSubmitting
                ? SUPPLIER_GROUP_FORM_COPY.SAVING_ACTION
                : SUPPLIER_GROUP_FORM_COPY.SAVE_ACTION}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
};
