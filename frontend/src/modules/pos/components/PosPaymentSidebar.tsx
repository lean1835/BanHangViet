import React, { useEffect, useRef, useState } from "react";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IPosTab } from "../types/IPos";
import { formatCurrency } from "@/utils/formatCurrency";

interface IPosPaymentSidebarProps {
  tab: IPosTab;
  customers: ICustomer[];
  onUpdateTab: (updatedFields: Partial<IPosTab>) => void;
  onOpenAddCustomerModal: () => void;
  onSaveDraft: () => void;
  onCompleteOrder: () => void;
  isSavingDraft: boolean;
  isCompletingOrder: boolean;
}

export const PosPaymentSidebar: React.FC<IPosPaymentSidebarProps> = ({
  tab,
  customers,
  onUpdateTab,
  onOpenAddCustomerModal,
  onSaveDraft,
  onCompleteOrder,
  isSavingDraft,
  isCompletingOrder,
}) => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const customerContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: F9 to Complete Payment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (tab.items.length > 0 && !isCompletingOrder) {
          onCompleteOrder();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab.items.length, isCompletingOrder, onCompleteOrder]);

  // Reset customer search when tab changes (e.g. after order completion or tab switch)
  useEffect(() => {
    setCustomerSearchTerm("");
    setIsCustomerDropdownOpen(false);
  }, [tab.id]);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered customers for search dropdown
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchTerm.trim()) return customers;
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.toLowerCase().includes(term))
    );
  }, [customers, customerSearchTerm]);

  // 1. Calculate subtotal before discount
  const totalCartAmount = tab.items.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const totalItemCount = tab.items.reduce((sum, item) => sum + item.quantity, 0);

  // 2. Calculate discount cash amount
  const discountCash =
    tab.discountType === "PERCENTAGE"
      ? (totalCartAmount * (tab.discountValue || 0)) / 100
      : tab.discountValue || 0;

  const afterDiscountAmount = Math.max(0, totalCartAmount - discountCash);

  // 3. Calculate Tax (Thuế GTGT / VAT)
  const itemTaxTotal = tab.items.reduce((sum, item) => {
    const itemTax = (item.product.taxRatePercentage || 0) / 100;
    return sum + item.lineTotal * itemTax;
  }, 0);

  const totalTaxAmount =
    tab.vatRate !== undefined
      ? afterDiscountAmount * (tab.vatRate / 100)
      : itemTaxTotal;

  // 4. Calculate final total to pay (Khách cần trả)
  const finalTotal = Math.max(0, afterDiscountAmount + totalTaxAmount);

  // Auto-sync amountGiven in FAST sale mode to default to paying in full
  useEffect(() => {
    if (tab.saleMode === "FAST") {
      if (tab.amountGiven !== finalTotal) {
        onUpdateTab({ amountGiven: finalTotal });
      }
    }
  }, [tab.saleMode, finalTotal, tab.amountGiven, onUpdateTab]);

  // 5. Calculate change (Tiền thừa)
  const effectiveAmountGiven = tab.saleMode === "FAST" ? finalTotal : tab.amountGiven || 0;
  const changeAmount = effectiveAmountGiven - finalTotal;

  // Fast cash options
  const handleQuickCash = (amount: number) => {
    onUpdateTab({ amountGiven: amount });
  };

  return (
    <div className="w-80 lg:w-[380px] bg-white rounded-xl shadow-md border border-slate-200 flex flex-col justify-between overflow-y-auto select-none p-4 font-sans text-xs">
      <div className="space-y-4">
        {/* 1. Mode Switcher Header */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 font-bold">
          <button
            type="button"
            onClick={() =>
              onUpdateTab({
                saleMode: "FAST",
                customer: null,
                customerId: undefined,
                amountGiven: finalTotal,
              })
            }
            className={`flex-1 py-2 rounded-lg text-xs transition-all text-center ${
              tab.saleMode === "FAST"
                ? "bg-[#0070f4] text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bán nhanh
          </button>
          <button
            type="button"
            onClick={() => onUpdateTab({ saleMode: "NORMAL" })}
            className={`flex-1 py-2 rounded-lg text-xs transition-all text-center ${
              tab.saleMode === "NORMAL"
                ? "bg-[#0070f4] text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bán thường
          </button>
        </div>

        {/* 2. Customer Section */}
        {tab.saleMode === "NORMAL" ? (
          <div className="relative bg-slate-50/80 p-3 rounded-xl border border-slate-200" ref={customerContainerRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 text-xs">Khách hàng</label>
              <button
                type="button"
                onClick={onOpenAddCustomerModal}
                className="text-[11px] font-bold text-[#0070f4] hover:underline"
              >
                + Thêm mới
              </button>
            </div>

            {tab.customer ? (
              <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-2.5 shadow-xs">
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    {tab.customer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    SĐT: {tab.customer.phone || "Không có"}
                    {tab.customer.debt ? (
                      <span className="ml-2 text-red-600 font-bold">
                        Nợ: {formatCurrency(tab.customer.debt)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTab({ customer: null, customerId: undefined })
                  }
                  className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                  title="Bỏ chọn khách hàng"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium shadow-xs"
                  placeholder="Tìm theo tên hoặc SĐT..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />

                {/* Customer Dropdown Menu */}
                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 max-h-52 overflow-y-auto">
                    <div
                      onClick={() => {
                        setIsCustomerDropdownOpen(false);
                        onOpenAddCustomerModal();
                      }}
                      className="p-2.5 hover:bg-blue-50 text-[#0070f4] font-bold text-xs cursor-pointer border-b border-slate-100"
                    >
                      + Thêm mới khách hàng
                    </div>

                    <div
                      onClick={() => {
                        onUpdateTab({ customer: null, customerId: undefined });
                        setIsCustomerDropdownOpen(false);
                        setCustomerSearchTerm("");
                      }}
                      className="p-2.5 hover:bg-blue-50 text-slate-700 font-semibold text-xs cursor-pointer border-b border-slate-100 flex items-center justify-between"
                    >
                      <span>Khách lẻ (Khách vô danh)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">Mặc định</span>
                    </div>

                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        Không tìm thấy khách hàng
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            onUpdateTab({
                              customer: cust,
                              customerId: cust.id,
                            });
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearchTerm("");
                          }}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {cust.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              SĐT: {cust.phone || "N/A"}
                            </div>
                          </div>
                          {cust.debt ? (
                            <div className="text-right text-[10px] font-bold text-red-500">
                              Nợ: {formatCurrency(cust.debt)}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">Khách hàng:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              Khách lẻ (Khách vô danh)
            </span>
          </div>
        )}

        {/* 3. Financial Summary Card */}
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 space-y-3">
          {/* Item count & Subtotal */}
          <div className="flex items-center justify-between text-slate-600 font-semibold text-xs">
            <span className="flex items-center gap-1.5">
              <span>Tổng tiền hàng</span>
              <span className="text-[10px] bg-blue-100 text-[#0070f4] px-1.5 py-0.2 rounded-full font-bold">
                {tab.items.length} món ({totalItemCount} SL)
              </span>
            </span>
            <span className="font-bold text-slate-800 text-xs">
              {formatCurrency(totalCartAmount)}
            </span>
          </div>

          {/* Discount */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-semibold text-xs">
              <span className="flex items-center gap-1">
                <span>Giảm giá:</span>
                <div className="inline-flex bg-slate-200/70 rounded p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onUpdateTab({ discountType: "CASH" })}
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-all ${
                      tab.discountType === "CASH"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    ₫
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTab({ discountType: "PERCENTAGE" })}
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-all ${
                      tab.discountType === "PERCENTAGE"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    %
                  </button>
                </div>
              </span>
              <div className="w-28 flex justify-end">
                <input
                  type="number"
                  min={0}
                  value={tab.discountValue || 0}
                  onChange={(e) =>
                    onUpdateTab({ discountValue: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full text-right bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            {discountCash > 0 && (
              <div className="text-right text-[10px] font-bold text-amber-600">
                Giảm: -{formatCurrency(discountCash)}
              </div>
            )}
          </div>

          {/* Tax GTGT / VAT Section */}
          <div className="flex items-center justify-between text-slate-600 font-semibold text-xs">
            <span className="flex items-center gap-1">
              <span>Thuế GTGT (VAT):</span>
              <select
                value={tab.vatRate !== undefined ? tab.vatRate : "AUTO"}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateTab({
                    vatRate: val === "AUTO" ? undefined : Number(val),
                  });
                }}
                className="bg-white border border-slate-300 text-[10px] font-bold rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
              >
                <option value="AUTO">Theo SP</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="8">8%</option>
                <option value="10">10%</option>
              </select>
            </span>
            <span className="font-bold text-slate-800 text-xs">
              {formatCurrency(totalTaxAmount)}
            </span>
          </div>
        </div>

        {/* 4. KHÁCH CẦN TRẢ Highlight Box */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
            KHÁCH CẦN TRẢ:
          </span>
          <span className="font-extrabold text-[#0070f4] text-lg tracking-tight">
            {formatCurrency(finalTotal)}
          </span>
        </div>

        {/* 5. Khách thanh toán Box */}
        {tab.saleMode === "FAST" ? (
          <div className="flex items-center justify-between text-slate-700 font-bold bg-emerald-50/60 px-3 py-2.5 rounded-xl border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <span>Khách thanh toán:</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                Trả đủ
              </span>
            </span>
            <span className="font-extrabold text-emerald-700 text-base">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        ) : (
          <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span className="text-xs">Khách thanh toán:</span>
              <input
                type="number"
                min={0}
                value={tab.amountGiven || 0}
                onChange={(e) =>
                  onUpdateTab({ amountGiven: Math.max(0, Number(e.target.value)) })
                }
                className="w-36 text-right bg-white border border-emerald-400 rounded-lg px-2.5 py-1.5 font-extrabold text-emerald-700 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
              />
            </div>
            {tab.amountGiven > 0 && (
              <div className="text-right text-[10px] font-bold text-emerald-600">
                {formatCurrency(tab.amountGiven)}
              </div>
            )}

            {/* Quick Cash Presets */}
            <div className="flex items-center justify-end gap-1 flex-wrap pt-1">
              {[50000, 100000, 200000, 500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-200 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-xs"
                >
                  {amt / 1000}k
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickCash(finalTotal)}
                className="px-2.5 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-[10px] font-extrabold text-blue-700 shadow-xs"
              >
                Đủ tiền
              </button>
            </div>
          </div>
        )}

        {/* Change Amount (Tiền thừa) - Normal Mode */}
        {tab.saleMode === "NORMAL" && (
          <div className="flex items-center justify-between text-slate-600 font-bold px-1 text-xs">
            <span>Tiền thừa trả khách:</span>
            <span
              className={`font-extrabold ${
                changeAmount < 0 ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {formatCurrency(Math.max(0, changeAmount))}
            </span>
          </div>
        )}

        {/* 6. Payment Method Segmented Buttons */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 text-xs">
            Hình thức thanh toán
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl font-bold text-xs">
            {(
              [
                { id: "CASH", label: "Tiền mặt" },
                { id: "BANK_TRANSFER", label: "Chuyển khoản" },
                { id: "DEBT", label: "Ghi nợ" },
              ] as const
            ).map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => {
                  if (pm.id === "DEBT") {
                    onUpdateTab({ paymentMethod: pm.id, amountGiven: 0 });
                  } else {
                    onUpdateTab({ paymentMethod: pm.id, amountGiven: finalTotal });
                  }
                }}
                className={`py-2 rounded-lg transition-all text-center ${
                  tab.paymentMethod === pm.id
                    ? "bg-white text-[#0070f4] shadow-sm font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Main Action Buttons Sticky at Bottom */}
      <div className="pt-3 mt-4 border-t border-slate-200 flex items-center gap-2.5">
        {/* Save Draft Button */}
        <button
          type="button"
          disabled={tab.items.length === 0 || isSavingDraft}
          onClick={onSaveDraft}
          className="flex-1 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-xs"
        >
          {isSavingDraft ? "Đang lưu..." : "Tạo đơn (Nháp)"}
        </button>

        {/* Complete Payment Button (F9) */}
        <button
          type="button"
          disabled={tab.items.length === 0 || isCompletingOrder}
          onClick={onCompleteOrder}
          className="flex-1 py-3 rounded-xl bg-[#0070f4] hover:bg-blue-600 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-center uppercase tracking-wide"
        >
          {isCompletingOrder ? "Đang xử lý..." : "Thanh toán (F9)"}
        </button>
      </div>
    </div>
  );
};

export default PosPaymentSidebar;
