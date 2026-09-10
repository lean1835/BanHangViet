import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Layers,
  Lock,
  Barcode,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type {
  IProductUnitConversion,
  ICreateUnitConversionRequest,
} from "@/modules/product/types/IProductUnitConversion";
import {
  UNIT_CONVERSION_COPY,
  UNIT_CONVERSION_MESSAGES,
} from "@/constants/product";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGenerateInternalBarcodeMutation } from "@/modules/barcode/services/barcodeApi";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface UnitConversionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateUnitConversionRequest) => Promise<void> | void;
  conversion?: IProductUnitConversion | null;
  baseUnit: string;
  basePrice?: number;
  productName?: string;
  productId?: string;
}

const calculateEan13CheckDigit = (code12: string): number => {
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(code12[i], 10);
    if (i % 2 === 0) sumOdd += d;
    else sumEven += d * 3;
  }
  const remainder = (sumOdd + sumEven) % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

const createConversionSchema = (baseUnit: string) =>
  z.object({
    unitName: z
      .string()
      .trim()
      .min(1, "Tên đơn vị quy đổi không được để trống")
      .max(50, "Tên đơn vị không vượt quá 50 ký tự")
      .refine(
        (val) => val.toLowerCase() !== baseUnit.trim().toLowerCase(),
        `Tên đơn vị quy đổi không được trùng với đơn vị cơ sở ("${baseUnit}")`
      ),
    conversionFactor: z
      .number({ invalid_type_error: "Tỷ lệ quy đổi phải là một số hợp lệ" })
      .positive("Tỷ lệ quy đổi phải lớn hơn 0")
      .refine((val) => val !== 1, "Tỷ lệ quy đổi phải khác 1 (1 là đơn vị cơ sở)"),
    price: z
      .number({ invalid_type_error: "Giá bán phải là số hợp lệ" })
      .min(0, "Giá bán không được nhỏ hơn 0")
      .nullable()
      .optional(),
    barcode: z
      .string()
      .trim()
      .max(100, "Mã vạch không vượt quá 100 ký tự")
      .optional()
      .or(z.literal("")),
    isDefaultImport: z.boolean(),
    isDefaultSale: z.boolean(),
  });

type ConversionFormValues = {
  unitName: string;
  conversionFactor: number;
  price?: number | null;
  barcode?: string;
  isDefaultImport: boolean;
  isDefaultSale: boolean;
};

export const UnitConversionFormModal: React.FC<UnitConversionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  conversion,
  baseUnit,
  basePrice = 0,
  productName,
  productId,
}) => {
  const isEditing = Boolean(conversion);
  const isFactorLocked = isEditing && Boolean(conversion?.hasStockMovement);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateInternalBarcode, { isLoading: isGeneratingBarcode }] =
    useGenerateInternalBarcodeMutation();

  const schema = React.useMemo(() => createConversionSchema(baseUnit), [baseUnit]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConversionFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      unitName: "",
      conversionFactor: 24,
      price: null,
      barcode: "",
      isDefaultImport: false,
      isDefaultSale: false,
    },
  });

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  const watchedUnitName = watch("unitName");
  const watchedFactor = watch("conversionFactor");
  const watchedPrice = watch("price");

  // Sync form on open or edit
  useEffect(() => {
    if (isOpen) {
      if (conversion) {
        reset({
          unitName: conversion.unitName,
          conversionFactor: conversion.conversionFactor,
          price: conversion.price ?? null,
          barcode: conversion.barcode || "",
          isDefaultImport: Boolean(conversion.isDefaultImport),
          isDefaultSale: Boolean(conversion.isDefaultSale),
        });
      } else {
        reset({
          unitName: "",
          conversionFactor: 12,
          price: null,
          barcode: "",
          isDefaultImport: false,
          isDefaultSale: false,
        });
      }
    }
  }, [isOpen, conversion, reset]);

  if (!isOpen) return null;

  const handleGenerateBarcode = async () => {
    if (productId) {
      try {
        const res = await generateInternalBarcode(productId).unwrap();
        if (res?.barcode) {
          setValue("barcode", res.barcode, { shouldValidate: true });
          return;
        }
      } catch {
        // Fallback to local EAN-13 barcode
      }
    }
    const base12 =
      "200" + Math.floor(100000000 + Math.random() * 900000000).toString();
    const checkDigit = calculateEan13CheckDigit(base12);
    setValue("barcode", base12 + checkDigit, { shouldValidate: true });
  };

  const handleSuggestPrice = () => {
    if (basePrice > 0 && watchedFactor > 0) {
      const calculated = Math.round(basePrice * watchedFactor);
      setValue("price", calculated, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: ConversionFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave({
        unitName: values.unitName.trim(),
        conversionFactor: isFactorLocked && conversion ? conversion.conversionFactor : values.conversionFactor,
        price: values.price !== null && values.price !== undefined && values.price >= 0 ? values.price : null,
        barcode: values.barcode ? values.barcode.trim() : null,
        isDefaultImport: values.isDefaultImport,
        isDefaultSale: values.isDefaultSale,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-conversion-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto flex flex-col animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Layers size={18} />
            </div>
            <div>
              <h3
                id="unit-conversion-modal-title"
                className="text-sm sm:text-base font-bold text-white"
              >
                {isEditing
                  ? UNIT_CONVERSION_COPY.MODAL_EDIT_TITLE
                  : UNIT_CONVERSION_COPY.MODAL_CREATE_TITLE}
              </h3>
              {productName && (
                <p className="text-[11px] text-sky-100 font-medium truncate max-w-xs sm:max-w-sm">
                  Mặt hàng: <strong>{productName}</strong> (ĐVT cơ sở: <strong>{baseUnit}</strong>)
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4 text-xs">
          {/* TC-03 Alert if factor locked */}
          {isFactorLocked && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 animate-fadeIn">
              <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">
                  {UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_SHORT}
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_WARNING}
                </p>
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Quy đổi tương đương:</span>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="text-kv-blue-primary">1 {watchedUnitName || "Đơn vị mới"}</span>
              <ArrowRight size={13} className="text-slate-400" />
              <span className="text-emerald-700">
                {watchedFactor || 1} {baseUnit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tên đơn vị */}
            <div>
              <label
                htmlFor="unitName"
                className="block text-slate-700 font-bold mb-1"
              >
                {UNIT_CONVERSION_COPY.UNIT_NAME_LABEL}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="unitName"
                type="text"
                placeholder={UNIT_CONVERSION_COPY.UNIT_NAME_PLACEHOLDER}
                {...register("unitName")}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  errors.unitName
                    ? "border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-sky-100"
                }`}
              />
              {errors.unitName && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  {errors.unitName.message}
                </p>
              )}
            </div>

            {/* Tỷ lệ quy đổi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="conversionFactor"
                  className="block text-slate-700 font-bold"
                >
                  {UNIT_CONVERSION_COPY.FACTOR_LABEL}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                {isFactorLocked && (
                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                    <Lock size={10} /> Đã khóa
                  </span>
                )}
              </div>
              <input
                id="conversionFactor"
                type="number"
                step="any"
                disabled={isFactorLocked}
                placeholder={UNIT_CONVERSION_COPY.FACTOR_PLACEHOLDER}
                {...register("conversionFactor", { valueAsNumber: true })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isFactorLocked
                    ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-bold"
                    : errors.conversionFactor
                    ? "border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-sky-100 font-bold text-slate-900"
                }`}
              />
              {errors.conversionFactor && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  {errors.conversionFactor.message}
                </p>
              )}
            </div>
          </div>

          {/* Giá bán riêng */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="price" className="block text-slate-700 font-bold">
                {UNIT_CONVERSION_COPY.PRICE_LABEL}
              </label>
              {basePrice > 0 && watchedFactor > 0 && (
                <button
                  type="button"
                  onClick={handleSuggestPrice}
                  className="text-[11px] text-kv-blue-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles size={11} />
                  Gợi ý giá ({formatCurrency(basePrice * watchedFactor)})
                </button>
              )}
            </div>
            <input
              id="price"
              type="number"
              min="0"
              step="1000"
              placeholder={UNIT_CONVERSION_COPY.PRICE_PLACEHOLDER}
              {...register("price", {
                setValueAs: (v) => (v === "" || v === null || isNaN(Number(v)) ? null : Number(v)),
              })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-sky-100 text-xs outline-none transition-all font-semibold"
            />
            {watchedPrice !== null && watchedPrice !== undefined && watchedPrice > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Bằng chữ: <strong>{formatCurrency(watchedPrice)}</strong>
              </p>
            )}
          </div>

          {/* Mã vạch riêng */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="barcode" className="block text-slate-700 font-bold">
                {UNIT_CONVERSION_COPY.BARCODE_LABEL}
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                disabled={isGeneratingBarcode}
                className="text-[11px] text-kv-blue-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles size={11} />
                Tạo mã vạch tự động
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Barcode size={14} />
              </span>
              <input
                id="barcode"
                type="text"
                placeholder={UNIT_CONVERSION_COPY.BARCODE_PLACEHOLDER}
                {...register("barcode")}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-sky-100 text-xs outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Checkboxes mặc định nhập / bán */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                {...register("isDefaultImport")}
                className="w-4 h-4 rounded text-kv-blue-primary focus:ring-kv-blue-primary border-slate-300"
              />
              <span>{UNIT_CONVERSION_COPY.DEFAULT_IMPORT_LABEL}</span>
            </label>

            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                {...register("isDefaultSale")}
                className="w-4 h-4 rounded text-kv-blue-primary focus:ring-kv-blue-primary border-slate-300"
              />
              <span>{UNIT_CONVERSION_COPY.DEFAULT_SALE_LABEL}</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? "Lưu thay đổi" : "Thêm đơn vị"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
