import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Search, CheckCircle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useAssignBarcodeMutation } from "../services/barcodeApi";
import type { IProduct } from "@/modules/product/types/IProduct";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface IUnrecognizedBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  unrecognizedBarcode: string;
  onAssignAndAddToCart: (product: IProduct) => void;
  canManage?: boolean;
}

export const UnrecognizedBarcodeModal: React.FC<IUnrecognizedBarcodeModalProps> = ({
  isOpen,
  onClose,
  unrecognizedBarcode,
  onAssignAndAddToCart,
  canManage = true,
}) => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({
    search: searchKeyword.trim() || undefined,
    page: 0,
    size: 20,
  });

  const [assignBarcode, { isLoading: isAssigning }] = useAssignBarcodeMutation();

  const productsList = productsData?.content || [];
  const selectedProduct = productsList.find((p) => p.id === selectedProductId);

  const handleConfirmAssign = async () => {
    if (!selectedProductId || !selectedProduct) {
      setErrorMessage("Vui lòng chọn một mặt hàng để gán mã vạch.");
      return;
    }

    setErrorMessage(null);
    try {
      await assignBarcode({
        productId: selectedProductId,
        data: { barcode: unrecognizedBarcode.trim() },
      }).unwrap();

      // Trigger callback to add to cart
      onAssignAndAddToCart({
        ...selectedProduct,
        barcode: unrecognizedBarcode.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(
        getApiErrorMessage(err, "Không thể gán mã vạch cho mặt hàng. Vui lòng thử lại!")
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">
                Chưa Nhận Diện Mã Vạch
              </h3>
              <p className="text-[11px] text-amber-100 font-normal">
                Mã vạch chưa được gán cho mặt hàng nào trong danh mục
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Unrecognized Barcode Pill */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-slate-600 font-semibold">Mã vạch vừa quét:</span>
            <span className="font-mono font-extrabold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-lg text-sm tracking-wider">
              {unrecognizedBarcode}
            </span>
          </div>

          {!canManage ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800">
              <ShieldAlert size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-0.5">Yêu cầu quyền Chủ hộ kinh doanh</div>
                <div className="text-[11px] text-rose-700">
                  Tài khoản nhân viên bán hàng không có quyền gán mã vạch mới. Vui lòng nhờ Chủ hộ (VT-01) gán mã vạch này cho mặt hàng hoặc tìm kiếm sản phẩm bằng tên (/).
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Mời chọn mặt hàng có sẵn để gán mã vạch này:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Products List Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
                {isLoadingProducts ? (
                  <div className="p-4 text-center text-slate-400 font-medium">
                    Đang tìm sản phẩm...
                  </div>
                ) : productsList.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 font-medium">
                    Không tìm thấy mặt hàng nào phù hợp
                  </div>
                ) : (
                  productsList.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProductId(prod.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-50/90 border-l-4 border-amber-500"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && <CheckCircle size={12} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {prod.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} • ĐVT: {prod.unit}
                              {prod.barcode && ` • Mã cũ: ${prod.barcode}`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-extrabold text-[#0070f4]">
                          {formatCurrency(prod.price)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-xs"
          >
            Bỏ qua / Đóng
          </button>
          {canManage && (
            <button
              type="button"
              disabled={!selectedProductId || isAssigning}
              onClick={handleConfirmAssign}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition-all text-xs"
            >
              <span>{isAssigning ? "Đang gán mã..." : "Gán mã & Thêm vào đơn"}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
