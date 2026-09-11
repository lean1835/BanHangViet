import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Scale, Banknote, X, Check, AlertCircle, RefreshCw } from "lucide-react";
import type { IProduct } from "@/modules/product/types/IProduct";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCalculateWeightMutation } from "@/modules/order/services/orderApi";
import { useResolveTierPriceMutation } from "@/modules/product/services/productApi";
import { WEIGHT_SELLING_CONSTANTS } from "@/constants/product";

interface WeightScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: IProduct | null;
  initialQuantity?: number;
  initialBuyAmount?: number;
  unitConversionId?: string | null;
  onConfirm: (data: {
    quantity: number;
    buyAmount?: number;
    unitConversionId?: string;
    roundingDifference?: number;
    priceTierId?: string | null;
    priceTierName?: string | null;
    appliedUnitPrice?: number;
  }) => void;
}

export const WeightScaleModal: React.FC<WeightScaleModalProps> = ({
  isOpen,
  onClose,
  product,
  initialQuantity = 1,
  initialBuyAmount,
  unitConversionId: initialUnitConversionId,
  onConfirm,
}) => {
  const [mode, setMode] = useState<"WEIGHT" | "MONEY">("WEIGHT");
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [buyAmount, setBuyAmount] = useState<number>(initialBuyAmount || 50000);
  const [selectedConversionId, setSelectedConversionId] = useState<string>(
    initialUnitConversionId || "BASE"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [calculateWeightApi, { isLoading: isCalculating }] = useCalculateWeightMutation();
  const [resolveTierPrice] = useResolveTierPriceMutation();
  const [calculatedResult, setCalculatedResult] = useState<{
    calculatedQuantity: number;
    exactSubtotal: number;
    roundedSubtotal: number;
    roundingDifference: number;
  } | null>(null);
  const [matchedTierInfo, setMatchedTierInfo] = useState<{
    appliedUnitPrice: number;
    matchedTierId?: string | null;
    matchedTierName?: string | null;
    savingAmountPerUnit?: number;
  } | null>(null);

  // Determine active unit info and price
  const activeUnitInfo = useMemo(() => {
    if (!product) return { unitName: "Kg", unitPrice: 0, factor: 1 };
    if (selectedConversionId && selectedConversionId !== "BASE") {
      const conv = product.unitConversions?.find((c) => c.id === selectedConversionId);
      if (conv) {
        const price =
          conv.price != null && conv.price > 0
            ? conv.price
            : product.price * conv.conversionFactor;
        return {
          unitName: conv.unitName,
          unitPrice: price,
          factor: conv.conversionFactor,
        };
      }
    }
    return {
      unitName: product.unit || "Kg",
      unitPrice: product.price,
      factor: 1,
    };
  }, [product, selectedConversionId]);

  const decimalPlaces = product?.decimalPlaces ?? WEIGHT_SELLING_CONSTANTS.DEFAULT_DECIMAL_PLACES;
  const minWeightStep = product?.minWeightStep ?? WEIGHT_SELLING_CONSTANTS.DEFAULT_MIN_WEIGHT_STEP;

  // Instant local estimation to avoid layout shift and visual lag
  const calculateLocalEstimate = useCallback(
    (amount: number, unitPrice: number, step: number, decimals: number) => {
      if (!amount || amount <= 0 || !unitPrice || unitPrice <= 0) return null;
      const rawQty = amount / unitPrice;
      const steps = Math.round(rawQty / step);
      const calculatedQuantity = Number(Math.max(step, steps * step).toFixed(decimals));
      const exactSubtotal = calculatedQuantity * unitPrice;
      return {
        calculatedQuantity,
        exactSubtotal,
        roundedSubtotal: amount,
        roundingDifference: amount - exactSubtotal,
      };
    },
    []
  );

  // Reset state when opening or changing product
  useEffect(() => {
    if (isOpen && product) {
      if (initialBuyAmount && initialBuyAmount > 0) {
        setMode("MONEY");
        setBuyAmount(initialBuyAmount);
        setCalculatedResult(
          calculateLocalEstimate(
            initialBuyAmount,
            activeUnitInfo.unitPrice,
            minWeightStep,
            decimalPlaces
          )
        );
      } else {
        setMode("WEIGHT");
        setQuantity(initialQuantity > 0 ? initialQuantity : minWeightStep);
      }
      setSelectedConversionId(initialUnitConversionId || "BASE");
      setErrorMessage(null);
    }
  }, [isOpen, product, initialQuantity, initialBuyAmount, initialUnitConversionId, minWeightStep, decimalPlaces, activeUnitInfo.unitPrice, calculateLocalEstimate]);

  // Debounce preview calculation when in MONEY mode to sync backend rounding rule
  useEffect(() => {
    if (!isOpen || !product || mode !== "MONEY" || !buyAmount || buyAmount <= 0) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setErrorMessage(null);
        const res = await calculateWeightApi({
          productId: product.id,
          buyAmount,
          unitConversionId:
            selectedConversionId !== "BASE" ? selectedConversionId : undefined,
        }).unwrap();

        if (res.result) {
          setCalculatedResult({
            calculatedQuantity: res.result.calculatedQuantity,
            exactSubtotal: res.result.exactSubtotal,
            roundedSubtotal: res.result.roundedSubtotal,
            roundingDifference: res.result.roundingDifference,
          });
        }
      } catch (err: any) {
        const msg =
          err?.data?.message || err?.message || "Số tiền mua quá nhỏ hoặc không hợp lệ.";
        setErrorMessage(msg);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [buyAmount, mode, product, selectedConversionId, calculateWeightApi, isOpen]);

  // Live tier price resolution when weighing in modal (NCL-02-CN-010)
  const effectiveQty = mode === "WEIGHT" ? quantity : (calculatedResult?.calculatedQuantity || 0);

  useEffect(() => {
    if (!isOpen || !product || effectiveQty <= 0) {
      setMatchedTierInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const convId = selectedConversionId !== "BASE" ? selectedConversionId : undefined;
        const res = await resolveTierPrice({
          productId: product.id,
          data: {
            quantity: effectiveQty,
            unitConversionId: convId || null,
          },
        }).unwrap();

        if (res && res.matchedTierId) {
          setMatchedTierInfo({
            appliedUnitPrice: res.appliedUnitPrice,
            matchedTierId: res.matchedTierId,
            matchedTierName: res.matchedTierName,
            savingAmountPerUnit: res.savingAmountPerUnit,
          });
        } else {
          setMatchedTierInfo(null);
        }
      } catch {
        setMatchedTierInfo(null);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, product, effectiveQty, selectedConversionId, resolveTierPrice]);

  if (!isOpen || !product) return null;

  const handleAddWeight = (delta: number) => {
    setQuantity((prev) => {
      const next = Number((prev + delta).toFixed(decimalPlaces));
      return Math.max(minWeightStep, next);
    });
  };

  const handleSetQuickMoney = (amount: number) => {
    setBuyAmount(amount);
    setErrorMessage(null);
    // Instant smooth preview update
    const instant = calculateLocalEstimate(
      amount,
      activeUnitInfo.unitPrice,
      minWeightStep,
      decimalPlaces
    );
    if (instant) {
      setCalculatedResult(instant);
    }
  };

  const handleConfirm = () => {
    if (mode === "WEIGHT") {
      if (quantity < minWeightStep) {
        setErrorMessage(`Số lượng tối thiểu phải là ${minWeightStep} ${activeUnitInfo.unitName}`);
        return;
      }
      onConfirm({
        quantity,
        unitConversionId:
          selectedConversionId !== "BASE" ? selectedConversionId : undefined,
        priceTierId: matchedTierInfo?.matchedTierId,
        priceTierName: matchedTierInfo?.matchedTierName,
        appliedUnitPrice: matchedTierInfo?.appliedUnitPrice,
      });
      onClose();
    } else {
      // MONEY mode
      if (!calculatedResult || calculatedResult.calculatedQuantity <= 0) {
        setErrorMessage("Vui lòng nhập số tiền hợp lệ để quy đổi ra khối lượng.");
        return;
      }
      onConfirm({
        quantity: calculatedResult.calculatedQuantity,
        buyAmount,
        unitConversionId:
          selectedConversionId !== "BASE" ? selectedConversionId : undefined,
        roundingDifference: calculatedResult.roundingDifference,
        priceTierId: matchedTierInfo?.matchedTierId,
        priceTierName: matchedTierInfo?.matchedTierName,
        appliedUnitPrice: matchedTierInfo?.appliedUnitPrice,
      });
      onClose();
    }
  };

  const effectiveUnitPrice = matchedTierInfo ? matchedTierInfo.appliedUnitPrice : activeUnitInfo.unitPrice;
  const subtotalInWeightMode = quantity * effectiveUnitPrice;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-scale-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Scale size={20} />
            </div>
            <div>
              <h3 id="weight-scale-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Cân khối lượng & Bán theo tiền</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium truncate max-w-[280px] sm:max-w-sm">
                Mặt hàng: <strong className="text-white">{product.name}</strong> • Đơn giá:{" "}
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(activeUnitInfo.unitPrice)}/{activeUnitInfo.unitName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("WEIGHT")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === "WEIGHT"
                ? "bg-white text-kv-blue-primary shadow-xs border border-slate-200"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Scale size={15} />
            <span>Nhập khối lượng ({activeUnitInfo.unitName})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("MONEY")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === "MONEY"
                ? "bg-white text-emerald-600 shadow-xs border border-slate-200"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Banknote size={15} />
            <span>Mua theo số tiền (VNĐ)</span>
          </button>
        </div>

        {/* Unit Selector (if conversions available) */}
        {product.unitConversions && product.unitConversions.length > 0 && (
          <div className="px-5 pt-3 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">Đơn vị bán:</span>
            <select
              value={selectedConversionId}
              onChange={(e) => setSelectedConversionId(e.target.value)}
              className="bg-sky-50 text-kv-blue-primary border border-sky-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-kv-blue-primary"
            >
              <option value="BASE">{product.unit || "Kg"} (Đơn vị cơ sở)</option>
              {product.unitConversions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.unitName} (x{c.conversionFactor}) - {formatCurrency(c.price || product.price * c.conversionFactor)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Body Content with fixed stable height */}
        <div className="p-5 overflow-y-auto space-y-4 min-h-[385px] flex flex-col justify-between">
          {mode === "WEIGHT" ? (
            /* Tab 1: Input by Weight */
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1 h-[115px] flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Khối lượng thực tế ({activeUnitInfo.unitName})
                </span>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min={minWeightStep}
                    step={minWeightStep}
                    value={quantity || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    placeholder={`0.${"0".repeat(decimalPlaces - 1)}1`}
                    className="w-48 text-center text-3xl sm:text-4xl font-black text-slate-900 bg-white border-2 border-kv-blue-primary/40 focus:border-kv-blue-primary rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 transition-all font-mono"
                  />
                  <span className="text-lg font-bold text-slate-600">
                    {activeUnitInfo.unitName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bước nhảy: {minWeightStep} {activeUnitInfo.unitName} • Độ chính xác: {decimalPlaces} chữ số lẻ
                </p>
              </div>

              {/* Quick Weight Adjust Buttons */}
              <div className="space-y-1.5 h-[65px]">
                <span className="text-xs font-bold text-slate-700">Cộng dồn nhanh:</span>
                <div className="grid grid-cols-5 gap-2">
                  {WEIGHT_SELLING_CONSTANTS.QUICK_WEIGHT_AMOUNTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAddWeight(item.value)}
                      className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-kv-blue-primary hover:border-sky-300 active:scale-95 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary in Weight mode (Matching height with Tab 2 preview card) */}
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 flex flex-col justify-center min-h-[142px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Đơn giá áp dụng:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">
                      {formatCurrency(effectiveUnitPrice)} / {activeUnitInfo.unitName}
                    </span>
                    {matchedTierInfo && (
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        ★ {matchedTierInfo.matchedTierName} (-{formatCurrency(matchedTierInfo.savingAmountPerUnit || 0)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Khối lượng cân:</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {quantity} {activeUnitInfo.unitName}
                  </span>
                </div>
                <div className="pt-2 border-t border-sky-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Thành tiền tạm tính:</span>
                  <span className="text-xl font-black text-kv-blue-primary font-mono">
                    {formatCurrency(subtotalInWeightMode)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Input by Money */
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1 h-[115px] flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Số tiền khách mua (VNĐ)
                </span>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={buyAmount || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const amt = isNaN(val) ? 0 : val;
                      setBuyAmount(amt);
                      const instant = calculateLocalEstimate(
                        amt,
                        activeUnitInfo.unitPrice,
                        minWeightStep,
                        decimalPlaces
                      );
                      if (instant) setCalculatedResult(instant);
                    }}
                    placeholder="50000"
                    className="w-56 text-center text-3xl sm:text-4xl font-black text-emerald-700 bg-white border-2 border-emerald-400/60 focus:border-emerald-500 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                  <span className="text-lg font-bold text-slate-600">đ</span>
                </div>
              </div>

              {/* Quick Money Buttons */}
              <div className="space-y-1.5 h-[65px]">
                <span className="text-xs font-bold text-slate-700">Mệnh giá thông dụng:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {WEIGHT_SELLING_CONSTANTS.QUICK_MONEY_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetQuickMoney(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                        buyAmount === amt
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-100"
                          : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 text-slate-700"
                      }`}
                    >
                      {amt / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Calculation Preview Card with stable height */}
              {calculatedResult ? (
                <div
                  className={`p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 min-h-[142px] flex flex-col justify-center space-y-2 text-xs transition-opacity duration-150 ${
                    isCalculating ? "opacity-75" : "opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Khối lượng quy đổi:</span>
                    <div className="flex items-center gap-1.5">
                      {isCalculating && (
                        <RefreshCw size={11} className="animate-spin text-emerald-600" />
                      )}
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {calculatedResult.calculatedQuantity} {activeUnitInfo.unitName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Tiền chính xác theo cân:</span>
                    <span className="font-mono">{formatCurrency(calculatedResult.exactSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Làm tròn tiền theo quy tắc:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {calculatedResult.roundingDifference > 0 ? `+` : ""}
                      {formatCurrency(calculatedResult.roundingDifference)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Thành tiền thu khách:</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {formatCurrency(calculatedResult.roundedSubtotal)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[142px] p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-1">
                  <Banknote size={22} className="text-slate-300" />
                  <span className="font-semibold text-slate-600">Chọn mệnh giá hoặc nhập số tiền khách mua</span>
                  <span className="text-[11px] text-slate-400">Hệ thống sẽ tự động tính khối lượng cần cân</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-auth-fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Check size={15} />
            <span>Xác nhận đưa vào giỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
