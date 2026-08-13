import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserRoundPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  SUPPLIER_FORM_COPY,
  SUPPLIER_SECTION_COPY,
  SUPPLIER_STATUS,
} from "@/constants/supplier";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  supplierSchema,
  type TSupplierFormValues,
} from "@/modules/supplier/schemas/supplierSchema";
import type {
  ISupplier,
  ISupplierCreatePayload,
  ISupplierGroup,
  ISupplierUpdatePayload,
} from "@/modules/supplier/types/ISupplier";
import { formatNumber } from "@/utils/formatCurrency";

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier: ISupplier | null;
  groups: ISupplierGroup[];
  isGroupsLoading: boolean;
  onClose: () => void;
  onSave: (
    payload: ISupplierCreatePayload | ISupplierUpdatePayload,
  ) => Promise<void>;
}

const EMPTY_FORM_VALUES: TSupplierFormValues = {
  name: "",
  phoneNumber: "",
  email: "",
  groupId: "",
  taxCode: "",
  address: "",
  initialDebt: 0,
  note: "",
  status: SUPPLIER_STATUS.ACTIVE,
};

export const SupplierFormModal = ({
  isOpen,
  supplier,
  groups,
  isGroupsLoading,
  onClose,
  onSave,
}: SupplierFormModalProps) => {
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
  } = useForm<TSupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    reset(
      supplier
        ? {
            name: supplier.name,
            phoneNumber: supplier.phoneNumber,
            email: supplier.email,
            groupId: supplier.groupId ?? "",
            taxCode: supplier.taxCode,
            address: supplier.address,
            initialDebt: supplier.initialDebt,
            note: supplier.note,
            status: supplier.status,
          }
        : EMPTY_FORM_VALUES,
    );
    setGlobalError("");
  }, [isOpen, reset, supplier]);

  if (!isOpen) return null;

  const isEditMode = Boolean(supplier);
  const submitForm = async (values: TSupplierFormValues) => {
    const commonPayload = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      email: values.email,
      address: values.address,
      taxCode: values.taxCode,
      note: values.note,
      groupId: values.groupId || null,
    };

    const payload: ISupplierCreatePayload | ISupplierUpdatePayload = isEditMode
      ? { ...commonPayload, status: values.status }
      : { ...commonPayload, initialDebt: values.initialDebt };

    try {
      setIsSubmitting(true);
      setGlobalError("");
      await onSave(payload);
      onClose();
    } catch (error: unknown) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Chưa thể lưu thông tin. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClassName = (hasError: boolean): string =>
    `min-h-11 rounded-lg border px-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/15 lg:min-h-10 lg:text-xs ${
      hasError ? "border-rose-400 bg-rose-50/30" : "border-slate-300 bg-white"
    }`;

  const renderError = (id: string, message?: string) =>
    message ? (
      <p id={id} className="text-xs font-semibold text-rose-600">
        {message}
      </p>
    ) : null;

  return createPortal(
    <div
      className="app-modal-backdrop fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/55 p-2 backdrop-blur-[1px] animate-backdrop-fade-in sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-form-title"
        className="app-modal-panel my-3 flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl animate-modal-bounce-in sm:my-0"
      >
        <header className="flex min-h-16 items-center justify-between bg-slate-800 px-5 text-white sm:px-7">
          <div className="flex items-center gap-2.5">
            <UserRoundPlus size={21} aria-hidden="true" />
            <h2 id="supplier-form-title" className="text-base font-extrabold sm:text-lg">
              {isEditMode
                ? SUPPLIER_FORM_COPY.EDIT_TITLE
                : SUPPLIER_FORM_COPY.CREATE_TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-50 lg:min-h-9 lg:min-w-9"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit(submitForm)} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 p-5 sm:grid-cols-2 sm:p-7">
            {globalError && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700 sm:col-span-2">
                {globalError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-code" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.CODE_LABEL}{" "}
                <span className="font-medium text-slate-400">({SUPPLIER_FORM_COPY.CODE_HINT})</span>
              </label>
              <input
                id="supplier-code"
                type="text"
                disabled
                value={supplier?.supplierCode ?? ""}
                placeholder={SUPPLIER_FORM_COPY.CODE_PLACEHOLDER}
                className={`${fieldClassName(false)} cursor-not-allowed bg-slate-50 font-mono text-slate-500 disabled:opacity-100`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-name" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.NAME_LABEL} <span className="text-rose-600">*</span>
              </label>
              <input
                id="supplier-name"
                type="text"
                autoComplete="organization"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "supplier-name-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.NAME_PLACEHOLDER}
                className={fieldClassName(Boolean(errors.name))}
              />
              {renderError("supplier-name-error", errors.name?.message)}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-phone" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.PHONE_LABEL} <span className="text-rose-600">*</span>
              </label>
              <input
                id="supplier-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                {...register("phoneNumber")}
                aria-invalid={Boolean(errors.phoneNumber)}
                aria-describedby={errors.phoneNumber ? "supplier-phone-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.PHONE_PLACEHOLDER}
                className={fieldClassName(Boolean(errors.phoneNumber))}
              />
              {renderError("supplier-phone-error", errors.phoneNumber?.message)}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-email" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.EMAIL_LABEL}
              </label>
              <input
                id="supplier-email"
                type="email"
                autoComplete="email"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "supplier-email-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.EMAIL_PLACEHOLDER}
                className={fieldClassName(Boolean(errors.email))}
              />
              {renderError("supplier-email-error", errors.email?.message)}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-group" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.GROUP_LABEL}
              </label>
              <select
                id="supplier-group"
                {...register("groupId")}
                disabled={isGroupsLoading}
                className={`${fieldClassName(Boolean(errors.groupId))} disabled:cursor-wait disabled:bg-slate-50`}
              >
                <option value="">
                  {isGroupsLoading
                    ? SUPPLIER_SECTION_COPY.GROUPS_LOADING_LABEL
                    : SUPPLIER_FORM_COPY.NO_GROUP_LABEL}
                </option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supplier-tax-code" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.TAX_CODE_LABEL}
              </label>
              <input
                id="supplier-tax-code"
                type="text"
                inputMode="numeric"
                {...register("taxCode")}
                aria-invalid={Boolean(errors.taxCode)}
                aria-describedby={errors.taxCode ? "supplier-tax-code-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.TAX_CODE_PLACEHOLDER}
                className={`${fieldClassName(Boolean(errors.taxCode))} font-mono`}
              />
              {renderError("supplier-tax-code-error", errors.taxCode?.message)}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="supplier-address" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.ADDRESS_LABEL}
              </label>
              <input
                id="supplier-address"
                type="text"
                autoComplete="street-address"
                {...register("address")}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "supplier-address-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.ADDRESS_PLACEHOLDER}
                className={fieldClassName(Boolean(errors.address))}
              />
              {renderError("supplier-address-error", errors.address?.message)}
            </div>

            {isEditMode ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="supplier-current-debt" className="text-xs font-bold text-slate-700">
                    {SUPPLIER_FORM_COPY.CURRENT_DEBT_LABEL}
                  </label>
                  <input
                    id="supplier-current-debt"
                    type="text"
                    readOnly
                    value={formatNumber(supplier?.currentDebt ?? 0)}
                    className={`${fieldClassName(false)} cursor-default bg-slate-50 font-semibold text-rose-600`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="supplier-status" className="text-xs font-bold text-slate-700">
                    {SUPPLIER_FORM_COPY.STATUS_LABEL}
                  </label>
                  <select id="supplier-status" {...register("status")} className={fieldClassName(Boolean(errors.status))}>
                    <option value={SUPPLIER_STATUS.ACTIVE}>{SUPPLIER_SECTION_COPY.ACTIVE_STATUS_LABEL}</option>
                    <option value={SUPPLIER_STATUS.INACTIVE}>{SUPPLIER_SECTION_COPY.INACTIVE_STATUS_LABEL}</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="supplier-initial-debt" className="text-xs font-bold text-slate-700">
                  {SUPPLIER_FORM_COPY.INITIAL_DEBT_LABEL}
                </label>
                <div className="relative">
                  <input
                    id="supplier-initial-debt"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    {...register("initialDebt", { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.initialDebt)}
                    aria-describedby={errors.initialDebt ? "supplier-initial-debt-error" : undefined}
                    className={`${fieldClassName(Boolean(errors.initialDebt))} w-full pr-14 font-semibold text-rose-600`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
                {renderError("supplier-initial-debt-error", errors.initialDebt?.message)}
              </div>
            )}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="supplier-note" className="text-xs font-bold text-slate-700">
                {SUPPLIER_FORM_COPY.NOTE_LABEL}
              </label>
              <textarea
                id="supplier-note"
                rows={3}
                {...register("note")}
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? "supplier-note-error" : undefined}
                placeholder={SUPPLIER_FORM_COPY.NOTE_PLACEHOLDER}
                className={`${fieldClassName(Boolean(errors.note))} resize-y py-3`}
              />
              {renderError("supplier-note-error", errors.note?.message)}
            </div>
          </div>

          <footer className="mx-5 flex flex-col-reverse gap-2 border-t border-slate-200 py-4 sm:mx-7 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:cursor-wait disabled:opacity-50 lg:min-h-10"
            >
              {SUPPLIER_FORM_COPY.CANCEL_ACTION}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-kv-blue-primary px-6 text-xs font-bold text-white shadow-sm transition-colors hover:bg-kv-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-blue-primary disabled:cursor-wait disabled:opacity-60 lg:min-h-10"
            >
              {isSubmitting && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
              {isSubmitting
                ? SUPPLIER_FORM_COPY.SAVING_ACTION
                : isEditMode
                  ? SUPPLIER_FORM_COPY.UPDATE_ACTION
                  : SUPPLIER_FORM_COPY.CREATE_ACTION}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
};
