import React, { useState, useEffect, useCallback } from "react";
import { Calculator } from "lucide-react";
import type { IProductPriceTier } from "@/modules/product/types/IProductPriceTier";
import type { IProductUnitConversion } from "@/modules/product/types/IProductUnitConversion";
import { useResolveTierPriceMutation } from "@/modules/product/services/productApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { PRICE_TIER_COPY } from "@/constants/product";

interface PriceTierSimulatorProps {
  productId: string;
  baseUnit: string;
  baseRetailPrice: number;
  costPrice?: number;
  unitConversions?: IProductUnitConversion[];
  activeTiers?: IProductPriceTier[];
}

export const PriceTierSimulator: React.FC<PriceTierSimulatorProps> = ({
  productId,
  baseUnit,
  baseRetailPrice,
  costPrice: _costPrice = 0,
  unitConversions = [],
  activeTiers = [],
}) => {
  const [testQty, setTestQty] = useState<number>(12);
  const [testConversionId, setTestConversionId] = useState<string>("");

  const [resolveTierPrice, { data: resolveResult, isLoading }] =
    useResolveTierPriceMutation();

  const handleSimulate = useCallback(
    async (qty: number, conversionId: string) => {
      if (qty <= 0) return;
      try {
        await resolveTierPrice({
          productId,
          data: {
            quantity: qty,
            unitConversionId: conversionId || null,
          },
        }).unwrap();
      } catch {
        // ignore, fallback calculation
      }
    },
    [productId, resolveTierPrice],
  );

  useEffect(() => {
    if (productId && testQty > 0) {
      handleSimulate(testQty, testConversionId);
    }
  }, [productId, testQty, testConversionId, activeTiers, handleSimulate]);

  const selectedConversion = unitConversions.find((c) => c.id === testConversionId);
  const currentUnit = selectedConversion ? selectedConversion.unitName : baseUnit;

  // Local fallback calculation if resolve API not finished yet
  const effectiveBasePrice =
    selectedConversion && selectedConversion.price
      ? selectedConversion.price
      : baseRetailPrice * (selectedConversion ? selectedConversion.conversionFactor : 1);

  // Match tier locally
  const matchedTier = activeTiers
    .filter((t) => t.isActive)
    .filter((t) =>
      testConversionId
        ? t.unitConversionId === testConversionId
        : !t.unitConversionId
    )
    .filter((t) => testQty >= t.minQuantity)
    .filter((t) => t.maxQuantity === null || t.maxQuantity === undefined || testQty <= t.maxQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  const appliedPrice = resolveResult?.appliedUnitPrice ?? (matchedTier ? matchedTier.price : effectiveBasePrice);
  const appliedTierName = resolveResult?.matchedTierName ?? (matchedTier ? matchedTier.tierName : "Bán lẻ thông thường");
  const savingPerUnit = resolveResult?.savingAmountPerUnit ?? Math.max(0, effectiveBasePrice - appliedPrice);
  const totalPay = testQty * appliedPrice;
  const totalSaving = resolveResult?.totalSavingAmount ?? (savingPerUnit * testQty);

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-slate-500 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-800 text-xs">
              {PRICE_TIER_COPY.SIMULATOR_TITLE}
            </h4>
            <p className="text-[11px] text-slate-500">
              {PRICE_TIER_COPY.SIMULATOR_DESC}
            </p>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-medium mr-1">Thử nhanh:</span>
          {[1, 5, 10, 12, 24, 50].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setTestQty(q)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                testQty === q
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Columns Calculator Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        {/* Cột 1: Input số lượng & Đơn vị */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex flex-col justify-center gap-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Số lượng mua:
              </label>
              <input
                type="number"
                min="0.001"
                step="any"
                value={testQty}
                onChange={(e) => setTestQty(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-kv-blue-primary text-xs font-bold text-slate-800 outline-hidden bg-white shadow-2xs"
              />
            </div>

            {unitConversions.length > 0 && (
              <div className="w-32">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Đơn vị:
                </label>
                <select
                  value={testConversionId}
                  onChange={(e) => setTestConversionId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-kv-blue-primary text-xs font-medium text-slate-700 outline-hidden bg-white shadow-2xs"
                >
                  <option value="">{baseUnit}</option>
                  {unitConversions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.unitName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Bậc giá áp dụng & Đơn giá */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Bậc giá khớp:</span>
            <span className="font-bold text-slate-800">{appliedTierName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Đơn giá áp dụng:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatCurrency(appliedPrice)} / {currentUnit}
            </span>
          </div>

          {savingPerUnit > 0 && (
            <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium pt-1 border-t border-slate-100">
              <span>Ưu đãi mỗi đơn vị:</span>
              <span>-{formatCurrency(savingPerUnit)}</span>
            </div>
          )}
        </div>

        {/* Cột 3: Tổng tiền thanh toán */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Tổng thanh toán ({testQty} {currentUnit}):</span>
            {isLoading && (
              <div className="w-3 h-3 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
              {formatCurrency(totalPay)}
            </span>
            {totalSaving > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700">
                Tiết kiệm: {formatCurrency(totalSaving)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
