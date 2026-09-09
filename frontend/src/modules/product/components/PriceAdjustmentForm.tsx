import React, { useState } from "react";
import {
  Calculator,
  Percent,
  Coins,
  TrendingUp,
  Search,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";
import {
  ADJUSTMENT_TYPE,
  ADJUSTMENT_TYPE_DESCRIPTIONS,
  PRICE_ROUNDING_METHOD,
  PRICE_ROUNDING_LABELS,
  PRICE_ADJUSTMENT_COPY,
  PRICE_ADJUSTMENT_MESSAGES,
  type TAdjustmentType,
  type TPriceRoundingMethod,
} from "@/constants/priceAdjustment";
import { useGetProductGroupsQuery, useGetProductsQuery } from "@/modules/product/services/productApi";
import type { IPriceAdjustmentPreviewRequest } from "../types/IPriceAdjustment";

interface PriceAdjustmentFormProps {
  isLoading: boolean;
  onPreview: (request: IPriceAdjustmentPreviewRequest) => void;
  initialGroupId?: string;
}

export const PriceAdjustmentForm: React.FC<PriceAdjustmentFormProps> = ({
  isLoading,
  onPreview,
  initialGroupId,
}) => {
  // Scope mode: 'GROUP' or 'CUSTOM_PRODUCTS'
  const [scopeMode, setScopeMode] = useState<"GROUP" | "CUSTOM_PRODUCTS">("GROUP");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || "");

  // For custom products selection
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Adjustment config
  const [adjustmentType, setAdjustmentType] = useState<TAdjustmentType>(
    ADJUSTMENT_TYPE.PERCENTAGE
  );
  const [adjustmentValue, setAdjustmentValue] = useState<string>("5");
  const [roundingMethod, setRoundingMethod] = useState<TPriceRoundingMethod>(
    PRICE_ROUNDING_METHOD.ROUND_TO_1000
  );

  // Validation error
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: groups = [] } = useGetProductGroupsQuery();
  const { data: productsData } = useGetProductsQuery(
    {
      size: 300,
      groupId: scopeMode === "CUSTOM_PRODUCTS" && selectedGroupId ? selectedGroupId : undefined,
    },
    { skip: scopeMode !== "CUSTOM_PRODUCTS" }
  );

  const availableProducts = productsData?.content || [];
  const filteredProducts = availableProducts.filter((p) => {
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleSubmitPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (scopeMode === "GROUP" && !selectedGroupId) {
      setFormError("Vui lòng chọn một nhóm hàng để cập nhật");
      return;
    }

    if (scopeMode === "CUSTOM_PRODUCTS" && selectedProductIds.length === 0) {
      setFormError("Vui lòng tích chọn ít nhất một mặt hàng cần đổi giá");
      return;
    }

    const numValue = parseFloat(adjustmentValue);
    if (isNaN(numValue)) {
      setFormError(PRICE_ADJUSTMENT_MESSAGES.VALUE_REQUIRED);
      return;
    }

    if (adjustmentType === ADJUSTMENT_TYPE.PERCENTAGE && numValue < -100) {
      setFormError(PRICE_ADJUSTMENT_MESSAGES.INVALID_VALUE_PERCENT);
      return;
    }

    const request: IPriceAdjustmentPreviewRequest = {
      adjustmentType,
      adjustmentValue: numValue,
      roundingMethod,
      targetGroupId: selectedGroupId || undefined,
      productIds: scopeMode === "CUSTOM_PRODUCTS" ? selectedProductIds : undefined,
    };

    onPreview(request);
  };

  return (
    <form
      onSubmit={handleSubmitPreview}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-kv-blue-primary" />
          <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
            Bước 1: Chọn phạm vi & Cơ chế tính giá mới
          </h3>
        </div>
      </div>

      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-bold animate-auth-fade-in flex items-center gap-2">
          <span>⚠️ {formError}</span>
        </div>
      )}

      {/* 1. Chọn phạm vi áp dụng */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          1. Phạm vi áp dụng đổi giá
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setScopeMode("GROUP");
              setFormError(null);
            }}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              scopeMode === "GROUP"
                ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary shadow-sm ring-1 ring-kv-blue-primary"
                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                scopeMode === "GROUP"
                  ? "border-kv-blue-primary bg-kv-blue-primary"
                  : "border-slate-300"
              }`}
            >
              {scopeMode === "GROUP" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <div className="font-bold text-xs md:text-sm">Áp dụng cho toàn bộ Nhóm hàng</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Cập nhật nhanh toàn bộ sản phẩm thuộc một nhóm
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setScopeMode("CUSTOM_PRODUCTS");
              setFormError(null);
            }}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              scopeMode === "CUSTOM_PRODUCTS"
                ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary shadow-sm ring-1 ring-kv-blue-primary"
                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                scopeMode === "CUSTOM_PRODUCTS"
                  ? "border-kv-blue-primary bg-kv-blue-primary"
                  : "border-slate-300"
              }`}
            >
              {scopeMode === "CUSTOM_PRODUCTS" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <div>
              <div className="font-bold text-xs md:text-sm">Chọn lọc mặt hàng lẻ cụ thể</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Tự tay chọn danh sách các sản phẩm cần điều chỉnh
              </div>
            </div>
          </button>
        </div>

        {/* Group Selector */}
        <div className="mt-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            {scopeMode === "GROUP"
              ? "Chọn nhóm hàng áp dụng (*):"
              : "Lọc theo nhóm hàng (tùy chọn để chọn sản phẩm nhanh hơn):"}
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setFormError(null);
            }}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 focus:border-kv-blue-primary focus:outline-none transition-all"
          >
            <option value="">-- Vui lòng chọn nhóm hàng --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Products Picker */}
        {scopeMode === "CUSTOM_PRODUCTS" && (
          <div className="mt-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-kv-blue-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllProducts}
                className="text-xs font-bold text-kv-blue-primary hover:text-kv-blue-dark flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
              >
                {selectedProductIds.length === filteredProducts.length &&
                filteredProducts.length > 0 ? (
                  <>
                    <CheckSquare className="w-4 h-4" /> Bỏ chọn tất cả
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" /> Chọn tất cả ({filteredProducts.length})
                  </>
                )}
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy mặt hàng nào phù hợp
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <label
                      key={prod.id}
                      className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectProduct(prod.id)}
                        className="w-4 h-4 text-kv-blue-primary rounded border-slate-300 focus:ring-kv-blue-primary"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{prod.name}</span>
                          <span className="ml-2 font-mono text-[11px] text-slate-400">
                            ({prod.sku})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-600">
                            Giá hiện tại: {Number(prod.price || 0).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="text-xs font-bold text-slate-600 text-right">
              Đã chọn:{" "}
              <span className="text-kv-blue-primary font-extrabold">
                {selectedProductIds.length}
              </span>{" "}
              mặt hàng
            </div>
          </div>
        )}
      </div>

      {/* 2. Chọn cơ chế tính giá */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            2. Cơ chế điều chỉnh giá
          </label>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tự động tính theo công thức</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Percentage */}
          <button
            type="button"
            onClick={() => setAdjustmentType(ADJUSTMENT_TYPE.PERCENTAGE)}
            className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
              adjustmentType === ADJUSTMENT_TYPE.PERCENTAGE
                ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary ring-1 ring-kv-blue-primary"
                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Percent className="w-4 h-4" />
              <span>Tỷ lệ phần trăm (%)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Tăng/giảm theo % so với giá hiện tại
            </span>
          </button>

          {/* Fixed amount */}
          <button
            type="button"
            onClick={() => setAdjustmentType(ADJUSTMENT_TYPE.FIXED_AMOUNT)}
            className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
              adjustmentType === ADJUSTMENT_TYPE.FIXED_AMOUNT
                ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary ring-1 ring-kv-blue-primary"
                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Coins className="w-4 h-4" />
              <span>Số tiền cố định (VNĐ)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Cộng/trừ số tiền cụ thể vào giá bán
            </span>
          </button>

          {/* Profit margin */}
          <button
            type="button"
            onClick={() => setAdjustmentType(ADJUSTMENT_TYPE.PROFIT_MARGIN)}
            className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
              adjustmentType === ADJUSTMENT_TYPE.PROFIT_MARGIN
                ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary ring-1 ring-kv-blue-primary"
                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>Lãi trên giá vốn (%)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              Giá bán = Giá vốn bình quân + % lãi
            </span>
          </button>
        </div>

        {/* Input Value & Helper text */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-1">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nhập giá trị điều chỉnh (*):
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="any"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-extrabold text-slate-800 focus:border-kv-blue-primary focus:outline-none pr-12 shadow-2xs"
                placeholder="VD: 5, -2, 2000..."
              />
              <span className="absolute right-3.5 top-3 text-xs font-extrabold text-slate-400">
                {adjustmentType === ADJUSTMENT_TYPE.FIXED_AMOUNT ? "VNĐ" : "%"}
              </span>
            </div>
          </div>
          <div className="sm:max-w-xs text-[11px] text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
            {ADJUSTMENT_TYPE_DESCRIPTIONS[adjustmentType]}
          </div>
        </div>
      </div>

      {/* 3. Phương pháp làm tròn */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          3. Phương thức làm tròn giá
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {Object.values(PRICE_ROUNDING_METHOD).map((method) => (
            <label
              key={method}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                roundingMethod === method
                  ? "border-kv-blue-primary bg-blue-50/40 text-kv-blue-primary font-bold shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
              }`}
            >
              <input
                type="radio"
                name="roundingMethod"
                value={method}
                checked={roundingMethod === method}
                onChange={() => setRoundingMethod(method)}
                className="w-4 h-4 text-kv-blue-primary focus:ring-kv-blue-primary"
              />
              <span>{PRICE_ROUNDING_LABELS[method]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Button Action */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 h-12 bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang tính toán xem trước...</span>
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              <span>{PRICE_ADJUSTMENT_COPY.PREVIEW_BUTTON}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
