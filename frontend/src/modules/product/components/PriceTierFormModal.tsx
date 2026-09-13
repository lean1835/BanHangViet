import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  AlertTriangle,
  Sparkles,
  Tag,
} from "lucide-react";
import type {
  IProductPriceTier,
  ICreatePriceTierRequest,
} from "@/modules/product/types/IProductPriceTier";
import type { IProductUnitConversion } from "@/modules/product/types/IProductUnitConversion";
import { PRICE_TIER_COPY } from "@/constants/product";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface PriceTierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreatePriceTierRequest) => Promise<void> | void;
  tier?: IProductPriceTier | null;
  baseUnit: string;
  basePrice?: number;
  costPrice?: number;
  unitConversions?: IProductUnitConversion[];
  productName?: string;
  productId?: string;
}

const priceTierSchema = z
  .object({
    tierName: z
      .string()
      .trim()
      .min(1, "Tên bậc giá không được để trống")
      .max(100, "Tên bậc giá không vượt quá 100 ký tự"),
    unitConversionId: z.string().nullable().optional(),
    minQuantity: z
      .number({ invalid_type_error: "Số lượng tối thiểu phải là số hợp lệ" })
      .positive("Số lượng tối thiểu phải lớn hơn 0"),
    maxQuantity: z
      .number({ invalid_type_error: "Số lượng tối đa phải là số hợp lệ" })
      .positive("Số lượng tối đa phải lớn hơn 0")
      .nullable()
      .optional(),
    price: z
      .number({ invalid_type_error: "Đơn giá bậc phải là số hợp lệ" })
      .min(0, "Đơn giá bậc không được nhỏ hơn 0"),
    isActive: z.boolean(),
    confirmBelowCost: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.maxQuantity !== null && data.maxQuantity !== undefined) {
        return data.maxQuantity >= data.minQuantity;
      }
      return true;
    },
    {
      message: "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu",
      path: ["maxQuantity"],
    }
  );

type PriceTierFormValues = z.infer<typeof priceTierSchema>;

export const PriceTierFormModal: React.FC<PriceTierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tier,
  baseUnit,
  basePrice = 0,
  costPrice = 0,
  unitConversions = [],
  productName,
}) => {
  const isEditing = Boolean(tier);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverBelowCostWarning, setServerBelowCostWarning] = useState(false);
  const [discountPercentInput, setDiscountPercentInput] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PriceTierFormValues>({
    resolver: zodResolver(priceTierSchema),
    defaultValues: {
      tierName: "Giá sỉ (≥ 10)",
      unitConversionId: null,
      minQuantity: 10,
      maxQuantity: null,
      price: basePrice > 0 ? Math.round(basePrice * 0.9) : 0,
      isActive: true,
      confirmBelowCost: false,
    },
  });

  const selectedConversionId = watch("unitConversionId");
  const enteredPrice = watch("price");

  // Determine effective unit name & cost price
  const selectedConversion = unitConversions.find(
    (c) => c.id === selectedConversionId
  );
  const currentUnitName = selectedConversion ? selectedConversion.unitName : baseUnit;
  const currentFactor = selectedConversion ? selectedConversion.conversionFactor : 1;
  const effectiveCost = costPrice > 0 ? Math.round(costPrice * currentFactor) : 0;
  const currentRetailPrice =
    selectedConversion && selectedConversion.price
      ? selectedConversion.price
      : Math.round(basePrice * currentFactor);

  const isBelowCostDetected =
    effectiveCost > 0 &&
    typeof enteredPrice === "number" &&
    enteredPrice > 0 &&
    enteredPrice < effectiveCost;

  // % giảm giá tự động suy luận từ đơn giá so với giá niêm yết
  const calculatedDiscountPercent =
    currentRetailPrice > 0 &&
    typeof enteredPrice === "number" &&
    enteredPrice > 0 &&
    enteredPrice < currentRetailPrice
      ? Math.round(((currentRetailPrice - enteredPrice) / currentRetailPrice) * 100 * 10) / 10
      : 0;

  const currentPercentDisplay =
    discountPercentInput !== ""
      ? discountPercentInput
      : calculatedDiscountPercent > 0
      ? String(calculatedDiscountPercent)
      : "";

  // Khi người dùng gõ vào ô % giảm giá
  const handleDiscountPercentChange = (valStr: string) => {
    setDiscountPercentInput(valStr);
    if (valStr === "") return;
    const num = parseFloat(valStr);
    if (!isNaN(num) && currentRetailPrice > 0) {
      const clamped = Math.max(0, Math.min(100, num));
      const calculatedPrice = Math.max(0, Math.round(currentRetailPrice * (1 - clamped / 100)));
      setValue("price", calculatedPrice, { shouldValidate: true });
    }
  };

  // Khi bấm nút chọn nhanh % (-5%, -10%, -15%...)
  const handleQuickPercent = (pct: number) => {
    setDiscountPercentInput(String(pct));
    if (currentRetailPrice > 0) {
      const calculatedPrice = Math.max(0, Math.round(currentRetailPrice * (1 - pct / 100)));
      setValue("price", calculatedPrice, { shouldValidate: true });
    }
  };

  // Reset or initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setServerBelowCostWarning(false);
      setDiscountPercentInput("");
      if (tier) {
        reset({
          tierName: tier.tierName,
          unitConversionId: tier.unitConversionId || null,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity ?? null,
          price: tier.price,
          isActive: tier.isActive,
          confirmBelowCost: Boolean(tier.isBelowCost),
        });
      } else {
        reset({
          tierName: `Giá sỉ (≥ 10)`,
          unitConversionId: null,
          minQuantity: 10,
          maxQuantity: null,
          price: basePrice > 0 ? Math.round(basePrice * 0.9) : 0,
          isActive: true,
          confirmBelowCost: false,
        });
      }
    }
  }, [isOpen, tier, basePrice, reset]);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  if (!isOpen) return null;

  const onSubmit = async (values: PriceTierFormValues) => {
    // If below cost and not yet confirmed by user, prompt first
    if (isBelowCostDetected && !values.confirmBelowCost) {
      setServerBelowCostWarning(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        tierName: values.tierName.trim(),
        minQuantity: values.minQuantity,
        maxQuantity: values.maxQuantity ?? null,
        price: values.price,
        unitConversionId: values.unitConversionId || null,
        isActive: values.isActive,
        confirmBelowCost: values.confirmBelowCost,
      });
      onClose();
    } catch (err: any) {
      // If server returns below cost error
      if (
        err?.data?.code === 3101 ||
        err?.data?.message?.includes("bán lỗ") ||
        err?.data?.message?.includes("giá vốn")
      ) {
        setServerBelowCostWarning(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tier-modal-title"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-kv-blue-primary flex items-center justify-center border border-sky-100/80 shadow-2xs shrink-0">
              <Tag size={20} />
            </div>
            <div>
              <h3 id="tier-modal-title" className="text-base font-bold text-slate-800">
                {isEditing
                  ? PRICE_TIER_COPY.MODAL_EDIT_TITLE
                  : PRICE_TIER_COPY.MODAL_CREATE_TITLE}
              </h3>
              {productName && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span>Mặt hàng:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                    {productName}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form
          id="tier-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {/* Quick suggestions ribbon */}
            {!isEditing && (
              <div className="flex items-center gap-2.5 flex-wrap p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 shrink-0">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Gợi ý đặt tên thông dụng:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_TIER_COPY.QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setValue("tierName", sug);
                        if (sug.includes("10")) setValue("minQuantity", 10);
                        if (sug.includes("50")) setValue("minQuantity", 50);
                        if (sug.includes("5")) setValue("minQuantity", 5);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 text-slate-600 text-[11px] font-medium border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2-column layout for spacious, ergonomic workflow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: Scope & Conditions */}
              <div className="space-y-4">
                {/* Tier Name */}
                <div>
                  <label htmlFor="tierName" className="block font-bold text-slate-700 mb-1.5 text-xs">
                    {PRICE_TIER_COPY.TIER_NAME_LABEL} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="tierName"
                    type="text"
                    {...register("tierName")}
                    placeholder={PRICE_TIER_COPY.TIER_NAME_PLACEHOLDER}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all ${
                      errors.tierName
                        ? "border-rose-300 bg-rose-50/30 text-rose-900"
                        : "border-slate-200 focus:border-kv-blue-primary bg-white"
                    }`}
                  />
                  {errors.tierName && (
                    <p className="mt-1 text-rose-500 text-[11px] font-semibold">
                      {errors.tierName.message}
                    </p>
                  )}
                </div>

                {/* Unit selection */}
                <div>
                  <label htmlFor="unitConversionId" className="block font-bold text-slate-700 mb-1.5 text-xs">
                    {PRICE_TIER_COPY.UNIT_LABEL}
                  </label>
                  <select
                    id="unitConversionId"
                    {...register("unitConversionId")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-kv-blue-primary text-xs outline-hidden bg-white focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                  >
                    <option value="">
                      {baseUnit} (Đơn vị cơ sở)
                    </option>
                    {unitConversions.map((conv) => (
                      <option key={conv.id} value={conv.id}>
                        {conv.unitName} (x{conv.conversionFactor} {baseUnit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Ranges */}
                <div>
                  <span className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Dải số lượng mua áp dụng:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="minQuantity" className="block font-medium text-slate-500 mb-1 text-[11px]">
                        {PRICE_TIER_COPY.MIN_QUANTITY_LABEL} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="minQuantity"
                          type="number"
                          step="any"
                          {...register("minQuantity", {
                            setValueAs: (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v)),
                          })}
                          className={`w-full pl-3.5 pr-12 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500/20 outline-hidden font-bold ${
                            errors.minQuantity
                              ? "border-rose-300 bg-rose-50/30 text-rose-900"
                              : "border-slate-200 focus:border-kv-blue-primary text-slate-800 bg-white"
                          }`}
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-semibold text-xs pointer-events-none">
                          {currentUnitName}
                        </span>
                      </div>
                      {errors.minQuantity && (
                        <p className="mt-1 text-rose-500 text-[11px] font-semibold">
                          {errors.minQuantity.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="maxQuantity" className="block font-medium text-slate-500 mb-1 text-[11px]">
                        {PRICE_TIER_COPY.MAX_QUANTITY_LABEL}
                      </label>
                      <div className="relative">
                        <input
                          id="maxQuantity"
                          type="number"
                          step="any"
                          {...register("maxQuantity", {
                            setValueAs: (v) => {
                              if (v === "" || v === null || v === undefined || v === 0) return null;
                              const num = Number(v);
                              return isNaN(num) ? null : num;
                            },
                          })}
                          placeholder="Để trống = trở lên"
                          className={`w-full pl-3.5 pr-12 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500/20 outline-hidden font-bold ${
                            errors.maxQuantity
                              ? "border-rose-300 bg-rose-50/30 text-rose-900"
                              : "border-slate-200 focus:border-kv-blue-primary text-slate-800 bg-white"
                          }`}
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-semibold text-xs pointer-events-none">
                          {currentUnitName}
                        </span>
                      </div>
                      {errors.maxQuantity && (
                        <p className="mt-1 text-rose-500 text-[11px] font-semibold">
                          {errors.maxQuantity.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Price Calculation & Discount */}
              <div className="space-y-4">
                {/* Retail price badge card */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-sky-800 font-semibold block">
                      Giá bán lẻ niêm yết hiện tại:
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(currentRetailPrice)} <span className="text-xs font-normal text-slate-500">/ {currentUnitName}</span>
                    </span>
                  </div>
                  {effectiveCost > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">Giá vốn đối chiếu</span>
                      <span className="text-xs font-bold text-slate-600">
                        {formatCurrency(effectiveCost)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing section card */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag size={13} className="text-kv-blue-primary" />
                      <span>Thiết lập giá bán bậc sỉ:</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Discount percent */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="discountPercent" className="block font-bold text-slate-700 text-xs">
                          {PRICE_TIER_COPY.DISCOUNT_PERCENT_LABEL}
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Tự tính</span>
                      </div>
                      <div className="relative">
                        <input
                          id="discountPercent"
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={currentPercentDisplay}
                          onChange={(e) => handleDiscountPercentChange(e.target.value)}
                          placeholder={PRICE_TIER_COPY.DISCOUNT_PERCENT_PLACEHOLDER}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all shadow-2xs"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs pointer-events-none">
                          %
                        </span>
                      </div>

                      {/* Quick percent buttons */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium mr-0.5">Nhanh:</span>
                        {PRICE_TIER_COPY.QUICK_DISCOUNTS.map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleQuickPercent(pct)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                              currentPercentDisplay === String(pct)
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            -{pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tier Price */}
                    <div>
                      <label htmlFor="price" className="block font-bold text-slate-700 mb-1 text-xs">
                        {PRICE_TIER_COPY.PRICE_LABEL} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="price"
                          type="number"
                          step="any"
                          {...register("price", {
                            setValueAs: (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v)),
                          })}
                          onFocus={() => setDiscountPercentInput("")}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm font-extrabold bg-white focus:ring-2 focus:ring-sky-500/20 outline-hidden shadow-2xs transition-all ${
                            errors.price
                              ? "border-rose-300 bg-rose-50/30 text-rose-900"
                              : "border-slate-200 focus:border-kv-blue-primary text-slate-900"
                          }`}
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-medium text-xs pointer-events-none">
                          VNĐ
                        </span>
                      </div>
                      {errors.price && (
                        <p className="mt-1 text-rose-500 text-[11px] font-semibold">
                          {errors.price.message}
                        </p>
                      )}
                      {enteredPrice !== undefined && enteredPrice !== null && enteredPrice > 0 && !errors.price && (
                        <p className="mt-1 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                          <span>Định dạng:</span>
                          <strong className="text-slate-800 font-mono font-bold">{formatCurrency(enteredPrice)}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Savings preview */}
                  {enteredPrice > 0 && currentRetailPrice > 0 && (
                    <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      {enteredPrice < currentRetailPrice ? (
                        <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                          <span>Khách tiết kiệm:</span>
                          <strong className="underline">
                            {formatCurrency(currentRetailPrice - enteredPrice)} / {currentUnitName}
                          </strong>
                          <span>(-{Math.round(((currentRetailPrice - enteredPrice) / currentRetailPrice) * 100)}%)</span>
                        </span>
                      ) : enteredPrice > currentRetailPrice ? (
                        <span className="text-amber-700 font-bold">
                          Cao hơn giá niêm yết: +{formatCurrency(enteredPrice - currentRetailPrice)}
                        </span>
                      ) : (
                        <span className="text-slate-500">Bằng giá bán lẻ niêm yết</span>
                      )}

                      {effectiveCost > 0 && (
                        <span className="text-[10px] text-slate-500">
                          Giá vốn: {formatCurrency(effectiveCost)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BELOW COST WARNING */}
            {(isBelowCostDetected || serverBelowCostWarning) && (
              <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/80 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-800 text-xs">
                      {PRICE_TIER_COPY.BELOW_COST_WARNING_TITLE}
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Đơn giá bậc <strong className="underline">{formatCurrency(enteredPrice || 0)}</strong> thấp hơn giá vốn bình quân{" "}
                      <strong className="underline">{formatCurrency(effectiveCost)}</strong>. Hộ kinh doanh có thể bị bán lỗ đối với mặt hàng này!
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60">
                  <label htmlFor="confirmBelowCost" className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="confirmBelowCost"
                      type="checkbox"
                      {...register("confirmBelowCost")}
                      className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-900 text-xs">
                      {PRICE_TIER_COPY.CONFIRM_BELOW_COST_CHECKBOX}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Active status */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  {PRICE_TIER_COPY.ACTIVE_LABEL}
                </span>
                <span className="text-[11px] text-slate-500">
                  Khi bật, hệ thống tại quầy POS sẽ tự động áp dụng bậc giá này khi đơn hàng đạt số lượng mua
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kv-blue-primary"></div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? "Lưu thay đổi" : "Tạo bậc giá"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
