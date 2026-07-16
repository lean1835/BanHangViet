import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IProduct, TAX_RATES } from "../types/product";
import { useGetProductGroupsQuery } from "../services/productApi";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<IProduct> & { taxRateId: string }) => void | Promise<void>;
  product?: IProduct | null;
}

// Zod Schema to strictly validate form data
const productSchema = z.object({
  sku: z.string().trim().min(1, "Vui lòng nhập mã sản phẩm (SKU)").max(50, "Mã hàng (SKU) không được vượt quá 50 ký tự"),
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm").max(255, "Tên hàng hóa không được vượt quá 255 ký tự"),
  groupId: z.string().nullable().optional(),
  unit: z.string().trim().min(1, "Vui lòng nhập đơn vị tính").max(50, "Đơn vị tính không được vượt quá 50 ký tự"),
  price: z.number().min(0, "Giá bán không được nhỏ hơn 0"),
  stockQuantity: z.number().min(0, "Tồn kho không được nhỏ hơn 0"),
  taxRateId: z.string().min(1, "Vui lòng chọn thuế suất"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
}) => {
  const [priceInput, setPriceInput] = useState("");
  const { data: groups = [] } = useGetProductGroupsQuery();
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, "vi"));
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
      sku: "",
      name: "",
      groupId: "",
      unit: "Lon",
      price: 0,
      stockQuantity: 0,
      taxRateId: "",
      status: "ACTIVE",
    },
  });

  // Explicitly register custom form field (price is updated manually to handle dynamic styling/dots formatting)
  useEffect(() => {
    register("price");
  }, [register]);

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku || "",
        name: product.name || "",
        groupId: product.groupId || "",
        unit: product.unit || "",
        price: product.price || 0,
        stockQuantity: product.stockQuantity || 0,
        taxRateId: product.taxRateId || "",
        status: product.status || "ACTIVE",
      });
      setPriceInput(product.price ? new Intl.NumberFormat("vi-VN").format(product.price) : "");
    } else {
      reset({
        sku: "",
        name: "",
        groupId: "",
        unit: "Lon",
        price: 0,
        stockQuantity: 0,
        taxRateId: TAX_RATES[0]?.id || "",
        status: "ACTIVE",
      });
      setPriceInput("");
    }
  }, [product, isOpen, reset]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setPriceInput("");
      setValue("price", 0, { shouldValidate: true });
      return;
    }
    const num = Number(rawVal);
    setValue("price", num, { shouldValidate: true });
    setPriceInput(new Intl.NumberFormat("vi-VN").format(num));
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
    } catch (err) {
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
            {product ? "Cập nhật thông tin hàng hóa" : "Thêm mới hàng hóa"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* SKU */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Mã hàng hóa (SKU)*:</label>
              <input
                type="text"
                placeholder="Ví dụ: 8934567890123"
                {...register("sku")}
                className={`border ${errors.sku ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.sku && <span className="text-[10px] text-rose-500 font-bold">{errors.sku.message}</span>}
            </div>

            {/* Đơn vị tính */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Đơn vị tính*:</label>
              <input
                type="text"
                placeholder="Ví dụ: Lon, Chai, Gói..."
                {...register("unit")}
                className={`border ${errors.unit ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.unit && <span className="text-[10px] text-rose-500 font-bold">{errors.unit.message}</span>}
            </div>

            {/* Tên hàng hóa */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">Tên hàng hóa*:</label>
              <input
                type="text"
                placeholder="Ví dụ: Nước ngọt Coca-Cola lon 320ml"
                {...register("name")}
                className={`border ${errors.name ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.name && <span className="text-[10px] text-rose-500 font-bold">{errors.name.message}</span>}
            </div>

            {/* Nhóm hàng */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Nhóm hàng hóa:</label>
              <select
                {...register("groupId")}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                <option value="">-- Chọn nhóm hàng --</option>
                {sortedGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Trạng thái bán:</label>
              <select
                {...register("status")}
                className="border border-slate-300 h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary"
              >
                <option value="ACTIVE">Đang bán (ACTIVE)</option>
                <option value="INACTIVE">Ngừng bán (INACTIVE)</option>
              </select>
            </div>

            {/* Giá bán lẻ */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Giá bán lẻ (đ)*:</label>
              <input
                type="text"
                placeholder="Ví dụ: 10.000"
                value={priceInput}
                onChange={handlePriceChange}
                className={`border ${errors.price ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
              />
              {errors.price && <span className="text-[10px] text-rose-500 font-bold">{errors.price.message}</span>}
            </div>

            {/* Tồn kho ban đầu */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-slate-600">Tồn kho ban đầu:</label>
              <input
                type="number"
                min="0"
                {...register("stockQuantity", { valueAsNumber: true })}
                className={`border ${errors.stockQuantity ? "border-rose-500" : "border-slate-300"} h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary`}
                disabled={!!product}
              />
              {errors.stockQuantity && (
                <span className="text-[10px] text-rose-500 font-bold">{errors.stockQuantity.message}</span>
              )}
            </div>

            {/* Thuế suất */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-600">Thuế suất doanh thu áp dụng*:</label>
              <select
                {...register("taxRateId")}
                className={`border ${errors.taxRateId ? "border-rose-500" : "border-slate-300"} h-9 px-2 rounded-lg bg-white focus:outline-none focus:border-kv-blue-primary`}
              >
                <option value="">-- Chọn thuế suất --</option>
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
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors px-5 h-9 rounded-lg font-bold shadow-sm"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
