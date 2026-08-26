import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Tag, Search, Check } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  DISCOUNT_TYPE,
  DISCOUNT_TYPE_LABELS,
  PROMOTION_APPLY_SCOPE,
  PROMOTION_APPLY_SCOPE_LABELS,
  PROMOTION_MESSAGES,
  PROMOTION_STATUS,
  type TDiscountType,
  type TPromotionApplyScope,
  type TPromotionStatus,
} from "@/constants/promotion";
import type { IPromotion, IPromotionDetail } from "../types/IPromotion";
import type {
  ICreatePromotionPayload,
  IUpdatePromotionPayload,
} from "../types/IPromotionPayload";
import {
  useGetProductsQuery,
  useGetProductGroupsQuery,
} from "@/modules/product/services/productApi";

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    payload: ICreatePromotionPayload | IUpdatePromotionPayload
  ) => Promise<void>;
  initialData?: IPromotion | IPromotionDetail | null;
  isLoading?: boolean;
}

const toDatetimeLocal = (isoString?: string | null): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData?.id);
  const dialogRef = useAccessibleDialog<HTMLDivElement>({
    isOpen,
    onClose,
  });

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<TDiscountType>(
    DISCOUNT_TYPE.PERCENTAGE
  );
  const [discountValue, setDiscountValue] = useState<number | string>(10);
  const [applyScope, setApplyScope] = useState<TPromotionApplyScope>(
    PROMOTION_APPLY_SCOPE.ALL
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TPromotionStatus>(
    PROMOTION_STATUS.ACTIVE
  );

  // Target IDs
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Search in target pickers
  const [productSearch, setProductSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  // Error messages
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query products and groups
  const { data: productsData, isLoading: isProductsLoading } =
    useGetProductsQuery({ size: 100 });
  const { data: groupsData = [], isLoading: isGroupsLoading } =
    useGetProductGroupsQuery();

  const productsList = useMemo(
    () => productsData?.content || [],
    [productsData?.content]
  );

  // Reset form when modal opens / initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || "");
        setDescription(initialData.description || "");
        setDiscountType(initialData.discountType || DISCOUNT_TYPE.PERCENTAGE);
        setDiscountValue(initialData.discountValue ?? 10);
        setApplyScope(initialData.applyScope || PROMOTION_APPLY_SCOPE.ALL);
        setStartDate(toDatetimeLocal(initialData.startDate));
        setEndDate(toDatetimeLocal(initialData.endDate));
        setStatus(initialData.status || PROMOTION_STATUS.ACTIVE);

        // Pre-populate targets if detailed data is provided
        const detail = initialData as IPromotionDetail;
        if (detail.products) {
          setSelectedProductIds(detail.products.map((p) => p.id));
        } else {
          setSelectedProductIds([]);
        }
        if (detail.productGroups) {
          setSelectedGroupIds(detail.productGroups.map((g) => g.id));
        } else {
          setSelectedGroupIds([]);
        }
      } else {
        // Defaults for Create: Start today, End in 7 days
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setName("");
        setDescription("");
        setDiscountType(DISCOUNT_TYPE.PERCENTAGE);
        setDiscountValue(10);
        setApplyScope(PROMOTION_APPLY_SCOPE.ALL);
        setStartDate(toDatetimeLocal(now.toISOString()));
        setEndDate(toDatetimeLocal(nextWeek.toISOString()));
        setStatus(PROMOTION_STATUS.ACTIVE);
        setSelectedProductIds([]);
        setSelectedGroupIds([]);
      }
      setProductSearch("");
      setGroupSearch("");
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Filtered lists for picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productsList;
    const term = productSearch.toLowerCase().trim();
    return productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term))
    );
  }, [productsList, productSearch]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groupsData;
    const term = groupSearch.toLowerCase().trim();
    return groupsData.filter((g) => g.name.toLowerCase().includes(term));
  }, [groupsData, groupSearch]);

  // Target selection helpers
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllProducts = () => {
    setSelectedProductIds(productsList.map((p) => p.id));
  };

  const handleClearAllProducts = () => {
    setSelectedProductIds([]);
  };

  const handleSelectAllGroups = () => {
    setSelectedGroupIds(groupsData.map((g) => g.id));
  };

  const handleClearAllGroups = () => {
    setSelectedGroupIds([]);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = PROMOTION_MESSAGES.NAME_REQUIRED;
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      newErrors.discountValue = PROMOTION_MESSAGES.DISCOUNT_VALUE_INVALID;
    } else if (
      discountType === DISCOUNT_TYPE.PERCENTAGE &&
      numValue > 100
    ) {
      newErrors.discountValue = PROMOTION_MESSAGES.PERCENTAGE_MAX_INVALID;
    }

    if (!startDate) {
      newErrors.startDate = "Vui lòng chọn thời gian bắt đầu";
    }

    if (!endDate) {
      newErrors.endDate = "Vui lòng chọn thời gian kết thúc";
    }

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (end <= start) {
        newErrors.endDate = PROMOTION_MESSAGES.DATE_INVALID;
      }
    }

    if (
      applyScope === PROMOTION_APPLY_SCOPE.PRODUCT &&
      selectedProductIds.length === 0
    ) {
      newErrors.targets = PROMOTION_MESSAGES.PRODUCT_REQUIRED;
    }

    if (
      applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP &&
      selectedGroupIds.length === 0
    ) {
      newErrors.targets = PROMOTION_MESSAGES.GROUP_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ICreatePromotionPayload | IUpdatePromotionPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue: Number(discountValue),
      applyScope,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      ...(isEdit ? { status } : {}),
      productIds:
        applyScope === PROMOTION_APPLY_SCOPE.PRODUCT
          ? selectedProductIds
          : undefined,
      productGroupIds:
        applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP
          ? selectedGroupIds
          : undefined,
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-form-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-bounce"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-md">
              <Tag size={20} />
            </div>
            <div>
              <h2
                id="promotion-form-modal-title"
                className="text-base font-bold text-slate-800"
              >
                {isEdit
                  ? "Cập nhật chương trình khuyến mại"
                  : "Tạo chương trình khuyến mại theo thời gian"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Thiết lập mức giảm giá, đối tượng áp dụng và khoảng thời gian tự động hiệu lực
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          data-testid="promotion-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Tên chương trình */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên chương trình khuyến mại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Ví dụ: Giảm giá mùa tựu trường, Khuyến mại nhóm gia vị..."
                maxLength={255}
                className={`w-full text-xs font-semibold rounded-lg border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 ${
                  errors.name
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-slate-300 focus:border-kv-blue-primary"
                }`}
              />
              {errors.name && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về điều kiện áp dụng hoặc mục tiêu chương trình..."
                maxLength={500}
                rows={2}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-kv-blue-primary focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 resize-none"
              />
            </div>

            {/* Mức giảm & Loại giảm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hình thức giảm giá <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setDiscountType(type as TDiscountType)
                      }
                      className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        discountType === type
                          ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mức giảm{" "}
                  {discountType === DISCOUNT_TYPE.PERCENTAGE ? "(%)" : "(VNĐ)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    max={
                      discountType === DISCOUNT_TYPE.PERCENTAGE
                        ? "100"
                        : undefined
                    }
                    step={
                      discountType === DISCOUNT_TYPE.PERCENTAGE ? "any" : "1000"
                    }
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      if (errors.discountValue)
                        setErrors((prev) => ({ ...prev, discountValue: "" }));
                    }}
                    placeholder={
                      discountType === DISCOUNT_TYPE.PERCENTAGE ? "10" : "50000"
                    }
                    className={`w-full text-xs font-semibold rounded-lg border px-3 py-2 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 ${
                      errors.discountValue
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-300 focus:border-kv-blue-primary"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-slate-400">
                    {discountType === DISCOUNT_TYPE.PERCENTAGE ? "%" : "₫"}
                  </div>
                </div>
                {errors.discountValue && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1">
                    {errors.discountValue}
                  </p>
                )}
              </div>
            </div>

            {/* Thời gian bắt đầu - kết thúc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian bắt đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate)
                      setErrors((prev) => ({ ...prev, startDate: "" }));
                  }}
                  className={`w-full text-xs font-semibold rounded-lg border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 ${
                    errors.startDate
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-slate-300 focus:border-kv-blue-primary"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian kết thúc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate)
                      setErrors((prev) => ({ ...prev, endDate: "" }));
                  }}
                  className={`w-full text-xs font-semibold rounded-lg border px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 ${
                    errors.endDate
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-slate-300 focus:border-kv-blue-primary"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1">
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Phạm vi áp dụng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phạm vi áp dụng <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.entries(PROMOTION_APPLY_SCOPE_LABELS).map(
                  ([scope, label]) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        setApplyScope(scope as TPromotionApplyScope);
                        if (errors.targets)
                          setErrors((prev) => ({ ...prev, targets: "" }));
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        applyScope === scope
                          ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              {/* Scope === PRODUCT Picker */}
              {applyScope === PROMOTION_APPLY_SCOPE.PRODUCT && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                        <Search size={13} />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm theo tên, mã SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 focus:border-kv-blue-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="text-[11px] font-bold text-kv-blue-primary hover:underline px-1"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllProducts}
                        className="text-[11px] font-semibold text-slate-500 hover:underline px-1"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-600">
                    Đã chọn:{" "}
                    <span className="font-extrabold text-kv-blue-primary">
                      {selectedProductIds.length}
                    </span>{" "}
                    sản phẩm
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {isProductsLoading ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                        Đang tải danh sách sản phẩm...
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                        Không tìm thấy sản phẩm nào
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-kv-blue-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleProduct(p.id)}
                                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                              />
                              <div>
                                <span className="font-bold text-slate-800">
                                  {p.name}
                                </span>
                                {p.sku && (
                                  <span className="ml-1.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                    {p.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-slate-700">
                              {formatCurrency(p.price)}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Scope === PRODUCT_GROUP Picker */}
              {applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                        <Search size={13} />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm nhóm hàng..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 focus:border-kv-blue-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllGroups}
                        className="text-[11px] font-bold text-kv-blue-primary hover:underline px-1"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllGroups}
                        className="text-[11px] font-semibold text-slate-500 hover:underline px-1"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-600">
                    Đã chọn:{" "}
                    <span className="font-extrabold text-kv-blue-primary">
                      {selectedGroupIds.length}
                    </span>{" "}
                    nhóm hàng
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {isGroupsLoading ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                        Đang tải danh sách nhóm hàng...
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                        Chưa có nhóm hàng nào
                      </div>
                    ) : (
                      filteredGroups.map((g) => {
                        const isChecked = selectedGroupIds.includes(g.id);
                        return (
                          <label
                            key={g.id}
                            className={`flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-kv-blue-primary/5" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleGroup(g.id)}
                              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                            />
                            <span className="font-bold text-slate-800">
                              {g.name}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {errors.targets && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1">
                  {errors.targets}
                </p>
              )}
            </div>

            {/* Trạng thái nếu là Edit */}
            {isEdit && (
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái kích hoạt
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={PROMOTION_STATUS.ACTIVE}
                      checked={status === PROMOTION_STATUS.ACTIVE}
                      onChange={() => setStatus(PROMOTION_STATUS.ACTIVE)}
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                    />
                    <span>Hoạt động</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={PROMOTION_STATUS.INACTIVE}
                      checked={status === PROMOTION_STATUS.INACTIVE}
                      onChange={() => setStatus(PROMOTION_STATUS.INACTIVE)}
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                    />
                    <span>Tạm ngưng</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {isEdit ? "Cập nhật chương trình" : "Lưu chương trình"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
