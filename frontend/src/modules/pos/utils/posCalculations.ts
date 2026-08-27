import type { IPosTab } from "../types/IPos";

export interface IPosCalculatedTotals {
  totalOriginalAmount: number;
  totalPromotionDiscount: number;
  totalCartAmount: number;
  totalItemCount: number;
  customerDiscountRate: number;
  isCustomerPercentage: boolean;
  customerDiscountCash: number;
  manualDiscountCash: number;
  totalOrderLevelDiscounts: number;
  afterDiscountAmount: number;
  itemTaxTotal: number;
  totalTaxAmount: number;
  finalTotal: number;
  effectiveAmountGiven: number;
  changeAmount: number;
}

export function calculatePosTotals(tab: IPosTab): IPosCalculatedTotals {
  // 1. Bước 1: Tính tiền hàng và giảm giá khuyến mại tự động mặt hàng
  const totalOriginalAmount = tab.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const totalPromotionDiscount = tab.items.reduce(
    (sum, item) => sum + (item.lineDiscount || 0),
    0
  );
  const totalCartAmount = tab.items.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const totalItemCount = tab.items.reduce((sum, item) => sum + item.quantity, 0);

  // 2. Bước 2: Chiết khấu khách VIP (áp dụng trên số tiền sau khuyến mại tự động SP: totalCartAmount)
  const customerDiscountRate = tab.customer?.discountRate || 0;
  const isCustomerPercentage = tab.customer?.discountType !== "CASH";
  const customerDiscountCash = Math.round(
    customerDiscountRate > 0
      ? isCustomerPercentage
        ? (totalCartAmount * customerDiscountRate) / 100
        : Math.min(totalCartAmount, customerDiscountRate)
      : 0
  );

  const afterVipDiscountAmount = Math.max(0, totalCartAmount - customerDiscountCash);

  // 3. Bước 3: Chiết khấu thêm (áp dụng trên số tiền sau chiết khấu VIP: afterVipDiscountAmount)
  const manualDiscountCash = Math.round(
    tab.discountType === "PERCENTAGE"
      ? (afterVipDiscountAmount * (tab.discountValue || 0)) / 100
      : Math.min(afterVipDiscountAmount, tab.discountValue || 0)
  );

  const totalOrderLevelDiscounts = customerDiscountCash + manualDiscountCash;
  const afterDiscountAmount = Math.max(0, afterVipDiscountAmount - manualDiscountCash);

  // 4. Bước 4: Tính Thuế GTGT (VAT) trên giá sau khi đã chiết khấu thêm (afterDiscountAmount)
  const discountRatio = totalCartAmount > 0 ? afterDiscountAmount / totalCartAmount : 1;
  const itemTaxTotal = Math.round(
    tab.items.reduce((sum, item) => {
      const itemTax = (item.product?.taxRatePercentage || 0) / 100;
      const discountedItemBase = item.lineTotal * discountRatio;
      return sum + discountedItemBase * itemTax;
    }, 0)
  );

  const totalTaxAmount = Math.round(
    tab.vatRate !== undefined
      ? afterDiscountAmount * (tab.vatRate / 100)
      : itemTaxTotal
  );

  // 5. Bước 5: Khách cần trả (finalTotal = Giá sau chiết khấu + Thuế VAT)
  const finalTotal = Math.round(Math.max(0, afterDiscountAmount + totalTaxAmount));

  // 6. Calculate effective amount given & change
  const effectiveAmountGiven =
    tab.saleMode === "FAST"
      ? finalTotal
      : typeof tab.amountGiven === "number"
      ? tab.amountGiven
      : tab.paymentMethod === "DEBT"
      ? 0
      : finalTotal;

  const changeAmount = effectiveAmountGiven - finalTotal;

  return {
    totalOriginalAmount,
    totalPromotionDiscount,
    totalCartAmount,
    totalItemCount,
    customerDiscountRate,
    isCustomerPercentage,
    customerDiscountCash,
    manualDiscountCash,
    totalOrderLevelDiscounts,
    afterDiscountAmount,
    itemTaxTotal,
    totalTaxAmount,
    finalTotal,
    effectiveAmountGiven,
    changeAmount,
  };
}
