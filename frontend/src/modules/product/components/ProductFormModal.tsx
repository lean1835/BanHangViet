import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { APP_LANGUAGE, APP_LOCALE } from "@/constants/format";
import {
  PRODUCT_FORM_DEFAULTS,
  PRODUCT_FORM_COPY,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_FORM_LIMITS,
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_STATUS_VALUES,
  PRODUCT_SYMBOLS,
  PRODUCT_VALIDATION_MESSAGES,
  TAX_RATES,
} from "@/constants/product";
import { useGetProductGroupsQuery } from "@/modules/product/services/productApi";
import type { IProduct } from "@/modules/product/types/IProduct";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<IProduct> & { taxRateId: string }) => void | Promise<void>;
  product?: IProduct | null;
}

// Zod Schema to strictly validate form data
const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(
      PRODUCT_FORM_LIMITS.MIN_REQUIRED_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.SKU_REQUIRED,
    )
    .max(
      PRODUCT_FORM_LIMITS.SKU_MAX_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.SKU_TOO_LONG,
    ),
  name: z
    .string()
    .trim()
    .min(
      PRODUCT_FORM_LIMITS.MIN_REQUIRED_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.NAME_REQUIRED,
    )
    .max(
      PRODUCT_FORM_LIMITS.NAME_MAX_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.NAME_TOO_LONG,
    ),
  groupId: z.string().nullable().optional(),
  unit: z
    .string()
    .trim()
    .min(
      PRODUCT_FORM_LIMITS.MIN_REQUIRED_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.UNIT_REQUIRED,
    )
    .max(
      PRODUCT_FORM_LIMITS.UNIT_MAX_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.UNIT_TOO_LONG,
    ),
  price: z
    .number()
    .min(
      PRODUCT_FORM_LIMITS.MIN_NON_NEGATIVE_VALUE,
      PRODUCT_VALIDATION_MESSAGES.PRICE_NEGATIVE,
    ),
  stockQuantity: z
    .number()
    .min(
      PRODUCT_FORM_LIMITS.MIN_NON_NEGATIVE_VALUE,
      PRODUCT_VALIDATION_MESSAGES.STOCK_NEGATIVE,
    ),
  taxRateId: z
    .string()
    .min(
      PRODUCT_FORM_LIMITS.MIN_REQUIRED_LENGTH,
      PRODUCT_VALIDATION_MESSAGES.TAX_RATE_REQUIRED,
    ),
  status: z.enum(PRODUCT_STATUS_VALUES),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const [priceInput, setPriceInput] = useState<string>(
    PRODUCT_FORM_DEFAULTS.EMPTY_TEXT,
  );
  const { data: groups = [] } = useGetProductGroupsQuery();
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, APP_LANGUAGE),
    );
  }, [groups]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: PRODUCT_FORM_DEFAULTS.SKU,
      name: PRODUCT_FORM_DEFAULTS.NAME,
      groupId: PRODUCT_FORM_DEFAULTS.GROUP_ID,
      unit: PRODUCT_FORM_DEFAULTS.UNIT,
      price: PRODUCT_FORM_DEFAULTS.PRICE,
      stockQuantity: PRODUCT_FORM_DEFAULTS.STOCK_QUANTITY,
      taxRateId: PRODUCT_FORM_DEFAULTS.TAX_RATE_ID,
      status: PRODUCT_FORM_DEFAULTS.STATUS,
    },
  });

  // Explicitly register custom form field (price is updated manually to handle dynamic styling/dots formatting)
  useEffect(() => {
    register(PRODUCT_FORM_FIELD_NAMES.PRICE);
  }, [register]);

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku || PRODUCT_FORM_DEFAULTS.SKU,
        name: product.name || PRODUCT_FORM_DEFAULTS.NAME,
        groupId: product.groupId || PRODUCT_FORM_DEFAULTS.GROUP_ID,
        unit: product.unit || PRODUCT_FORM_DEFAULTS.EMPTY_TEXT,
        price: product.price || PRODUCT_FORM_DEFAULTS.PRICE,
        stockQuantity:
          product.stockQuantity || PRODUCT_FORM_DEFAULTS.STOCK_QUANTITY,
        taxRateId: product.taxRateId || PRODUCT_FORM_DEFAULTS.TAX_RATE_ID,
        status: product.status || PRODUCT_FORM_DEFAULTS.STATUS,
      });
      setPriceInput(
        product.price
          ? new Intl.NumberFormat(APP_LOCALE).format(product.price)
          : PRODUCT_FORM_DEFAULTS.EMPTY_TEXT,
      );
    } else {
      reset({
        sku: PRODUCT_FORM_DEFAULTS.SKU,
        name: PRODUCT_FORM_DEFAULTS.NAME,
        groupId: PRODUCT_FORM_DEFAULTS.GROUP_ID,
        unit: PRODUCT_FORM_DEFAULTS.UNIT,
        price: PRODUCT_FORM_DEFAULTS.PRICE,
        stockQuantity: PRODUCT_FORM_DEFAULTS.STOCK_QUANTITY,
        taxRateId:
          TAX_RATES[PRODUCT_FORM_DEFAULTS.DEFAULT_TAX_RATE_INDEX]?.id ||
          PRODUCT_FORM_DEFAULTS.TAX_RATE_ID,
        status: PRODUCT_FORM_DEFAULTS.STATUS,
      });
      setPriceInput(PRODUCT_FORM_DEFAULTS.EMPTY_TEXT);
    }
  }, [product, isOpen, reset]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setPriceInput(PRODUCT_FORM_DEFAULTS.EMPTY_TEXT);
      setValue(PRODUCT_FORM_FIELD_NAMES.PRICE, PRODUCT_FORM_DEFAULTS.PRICE, {
        shouldValidate: true,
      });
      return;
    }
    const num = Number(rawVal);
    setValue(PRODUCT_FORM_FIELD_NAMES.PRICE, num, { shouldValidate: true });
    setPriceInput(new Intl.NumberFormat(APP_LOCALE).format(num));
  };

  if (!isOpen) return null;

  const onSubmit = async (values: ProductFormValues) => {
    const data: Partial<IProduct> & { taxRateId: string } = {
      sku: values.sku.trim(),
      name: values.name.trim(),
      groupId: values.groupId || null,
      unit: values.unit.trim(),
      price: values.price,
      stockQuantity: values.stockQuantity,
      taxRateId: values.taxRateId,
      status: values.status,
    };

    try {
      await onSave(data);
      onClose();
    } catch {
      // Error handled by parent component / page notification
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {product
              ? PRODUCT_FORM_COPY.UPDATE_TITLE
              : PRODUCT_FORM_COPY.CREATE_TITLE}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            {PRODUCT_SYMBOLS.CLOSE}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* SKU */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.SKU_LABEL}</label>
              <input
                type="text"
                placeholder={PRODUCT_FORM_COPY.SKU_PLACEHOLDER}
                {...register(PRODUCT_FORM_FIELD_NAMES.SKU)}
                className={`border ${errors.sku ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.sku && <span className="text-[10px] text-rose-500 font-bold">{errors.sku.message}</span>}
            </div>

            {/* Đơn vị tính */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.UNIT_LABEL}</label>
              <input
                type="text"
                placeholder={PRODUCT_FORM_COPY.UNIT_PLACEHOLDER}
                {...register(PRODUCT_FORM_FIELD_NAMES.UNIT)}
                className={`border ${errors.unit ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.unit && <span className="text-[10px] text-rose-500 font-bold">{errors.unit.message}</span>}
            </div>

            {/* Tên hàng hóa */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.NAME_LABEL}</label>
              <input
                type="text"
                placeholder={PRODUCT_FORM_COPY.NAME_PLACEHOLDER}
                {...register(PRODUCT_FORM_FIELD_NAMES.NAME)}
                className={`border ${errors.name ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.name && <span className="text-[10px] text-rose-500 font-bold">{errors.name.message}</span>}
            </div>

            {/* Nhóm hàng */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.GROUP_LABEL}</label>
              <select
                {...register(PRODUCT_FORM_FIELD_NAMES.GROUP_ID)}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                <option value="">{PRODUCT_FORM_COPY.GROUP_PLACEHOLDER}</option>
                {sortedGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.STATUS_LABEL}</label>
              <select
                {...register(PRODUCT_FORM_FIELD_NAMES.STATUS)}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                {PRODUCT_STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Giá bán lẻ */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.PRICE_LABEL}</label>
              <input
                type="text"
                placeholder={PRODUCT_FORM_COPY.PRICE_PLACEHOLDER}
                value={priceInput}
                onChange={handlePriceChange}
                className={`border ${errors.price ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.price && <span className="text-[10px] text-rose-500 font-bold">{errors.price.message}</span>}
            </div>

            {/* Tồn kho ban đầu */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">{PRODUCT_FORM_COPY.STOCK_LABEL}</label>
              <input
                type="number"
                min={PRODUCT_FORM_LIMITS.MIN_NON_NEGATIVE_VALUE}
                {...register(PRODUCT_FORM_FIELD_NAMES.STOCK_QUANTITY, {
                  valueAsNumber: true,
                })}
                className={`border ${errors.stockQuantity ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
                disabled={!!product}
              />
              {errors.stockQuantity && (
                <span className="text-[10px] text-rose-500 font-bold">{errors.stockQuantity.message}</span>
              )}
            </div>

            {/* Thuế suất */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">
                {PRODUCT_FORM_COPY.TAX_RATE_LABEL}
              </label>
              <select
                {...register(PRODUCT_FORM_FIELD_NAMES.TAX_RATE_ID)}
                className={`border ${errors.taxRateId ? "border-rose-500" : "border-slate-300"} h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary`}
              >
                <option value="">{PRODUCT_FORM_COPY.TAX_RATE_PLACEHOLDER}</option>
                {TAX_RATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.taxRateId && <span className="text-[10px] text-rose-500 font-bold">{errors.taxRateId.message}</span>}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-3">
            <button
              onClick={onClose}
              type="button"
              className="bg-slate-100 hover:bg-slate-200 transition-colors px-4 h-9 rounded-lg text-slate-700 font-bold"
            >
              {PRODUCT_FORM_COPY.CANCEL_ACTION}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors px-5 h-9 rounded-lg font-bold shadow-sm"
            >
              {isSubmitting
                ? PRODUCT_FORM_COPY.SAVING_ACTION
                : PRODUCT_FORM_COPY.SAVE_ACTION}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
