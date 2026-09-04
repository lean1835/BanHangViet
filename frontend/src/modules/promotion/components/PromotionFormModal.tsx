import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Tag } from "lucide-react";
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
  initialProductIds?: string[];
  initialName?: string;
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
  initialProductIds,
  initialName,
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
        setName(initialName || "");
        setDescription("");
        setDiscountType(DISCOUNT_TYPE.PERCENTAGE);
        setDiscountValue(10);
        setApplyScope(
          initialProductIds && initialProductIds.length > 0
            ? PROMOTION_APPLY_SCOPE.PRODUCT
            : PROMOTION_APPLY_SCOPE.ALL
        );
        setStartDate(toDatetimeLocal(now.toISOString()));
        setEndDate(toDatetimeLocal(nextWeek.toISOString()));
        setStatus(PROMOTION_STATUS.ACTIVE);
        setSelectedProductIds(initialProductIds ? [...initialProductIds] : []);
        setSelectedGroupIds([]);
      }
      setProductSearch("");
      setGroupSearch("");
      setErrors({});
    }
  }, [isOpen, initialData, initialProductIds, initialName]);

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
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-sm">
              <Tag size={18} />
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
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Thiết lập mức giảm giá, đối tượng áp dụng và khoảng thời gian tự động hiệu lực
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Đóng"
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
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Tên chương trình */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                className={`w-full h-10 px-3 text-xs sm:text-sm font-medium rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-300 hover:border-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mô tả chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về điều kiện áp dụng hoặc mục tiêu chương trình..."
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
              />
            </div>

            {/* Hàng 1: Hình thức giảm giá & Mức giảm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hình thức giảm giá <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 h-10">
                  <button
                    type="button"
                    onClick={() => setDiscountType(DISCOUNT_TYPE.PERCENTAGE)}
                    className={`text-xs rounded-md transition-all flex items-center justify-center ${
                      discountType === DISCOUNT_TYPE.PERCENTAGE
                        ? "bg-white text-kv-blue-primary font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 font-medium"
                    }`}
                  >
                    {DISCOUNT_TYPE_LABELS[DISCOUNT_TYPE.PERCENTAGE]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType(DISCOUNT_TYPE.FIXED_AMOUNT)}
                    className={`text-xs rounded-md transition-all flex items-center justify-center ${
                      discountType === DISCOUNT_TYPE.FIXED_AMOUNT
                        ? "bg-white text-kv-blue-primary font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 font-medium"
                    }`}
                  >
                    {DISCOUNT_TYPE_LABELS[DISCOUNT_TYPE.FIXED_AMOUNT]}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mức giảm {discountType === DISCOUNT_TYPE.PERCENTAGE ? "(%)" : "(VNĐ)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center h-10">
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
                    className={`w-full h-full rounded-lg border bg-white pl-3 pr-12 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                      errors.discountValue
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-300 hover:border-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center bg-slate-100 border-l border-slate-300 rounded-r-lg text-xs font-bold text-slate-600 select-none">
                    {discountType === DISCOUNT_TYPE.PERCENTAGE ? "%" : "₫"}
                  </div>
                </div>
                {errors.discountValue && (
                  <p className="text-xs text-rose-500 mt-1">{errors.discountValue}</p>
                )}
              </div>
            </div>

            {/* Hàng 2: Thời gian bắt đầu & Thời gian kết thúc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className={`w-full h-10 px-3 text-xs sm:text-sm font-medium rounded-lg border bg-white text-slate-900 focus:outline-none transition-colors ${
                    errors.startDate
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-300 hover:border-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className={`w-full h-10 px-3 text-xs sm:text-sm font-medium rounded-lg border bg-white text-slate-900 focus:outline-none transition-colors ${
                    errors.endDate
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-300 hover:border-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Hàng 3: Phạm vi áp dụng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phạm vi áp dụng <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg border border-slate-200 h-10 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setApplyScope(PROMOTION_APPLY_SCOPE.ALL);
                    if (errors.targets)
                      setErrors((prev) => ({ ...prev, targets: "" }));
                  }}
                  className={`text-xs rounded-md transition-all flex items-center justify-center ${
                    applyScope === PROMOTION_APPLY_SCOPE.ALL
                      ? "bg-white text-kv-blue-primary font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {PROMOTION_APPLY_SCOPE_LABELS[PROMOTION_APPLY_SCOPE.ALL]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApplyScope(PROMOTION_APPLY_SCOPE.PRODUCT);
                    if (errors.targets)
                      setErrors((prev) => ({ ...prev, targets: "" }));
                  }}
                  className={`text-xs rounded-md transition-all flex items-center justify-center ${
                    applyScope === PROMOTION_APPLY_SCOPE.PRODUCT
                      ? "bg-white text-kv-blue-primary font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {PROMOTION_APPLY_SCOPE_LABELS[PROMOTION_APPLY_SCOPE.PRODUCT]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApplyScope(PROMOTION_APPLY_SCOPE.PRODUCT_GROUP);
                    if (errors.targets)
                      setErrors((prev) => ({ ...prev, targets: "" }));
                  }}
                  className={`text-xs rounded-md transition-all flex items-center justify-center ${
                    applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP
                      ? "bg-white text-kv-blue-primary font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {
                    PROMOTION_APPLY_SCOPE_LABELS[
                      PROMOTION_APPLY_SCOPE.PRODUCT_GROUP
                    ]
                  }
                </button>
              </div>

              {/* Scope === PRODUCT Picker */}
              {applyScope === PROMOTION_APPLY_SCOPE.PRODUCT && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm theo tên, mã SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full h-9 text-xs font-medium rounded-lg border border-slate-300 hover:border-slate-400 bg-white pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="text-xs font-bold text-kv-blue-primary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllProducts}
                        className="text-xs font-semibold text-slate-500 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <span>Đã chọn:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-kv-blue-primary">
                      {selectedProductIds.length}
                    </span>
                    <span>sản phẩm</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {isProductsLoading ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        Đang tải danh sách sản phẩm...
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        Không tìm thấy sản phẩm nào
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleProduct(p.id)}
                                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {p.name}
                                </span>
                                {p.sku && (
                                  <span className="ml-2 text-[11px] text-slate-400">
                                    SKU: {p.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm nhóm hàng..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="w-full h-9 text-xs font-medium rounded-lg border border-slate-300 hover:border-slate-400 bg-white pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllGroups}
                        className="text-xs font-bold text-kv-blue-primary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllGroups}
                        className="text-xs font-semibold text-slate-500 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <span>Đã chọn:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-kv-blue-primary">
                      {selectedGroupIds.length}
                    </span>
                    <span>nhóm hàng</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {isGroupsLoading ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        Đang tải danh sách nhóm hàng...
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        Chưa có nhóm hàng nào
                      </div>
                    ) : (
                      filteredGroups.map((g) => {
                        const isChecked = selectedGroupIds.includes(g.id);
                        return (
                          <label
                            key={g.id}
                            className={`flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleGroup(g.id)}
                              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 cursor-pointer"
                            />
                            <span className="font-semibold text-slate-800">
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
                <p className="text-xs text-rose-500 mt-1">{errors.targets}</p>
              )}
            </div>

            {/* Trạng thái nếu là Edit */}
            {isEdit && (
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Trạng thái chương trình
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
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-98 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isEdit ? "Cập nhật chương trình" : "Lưu chương trình"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
