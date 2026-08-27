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
  // 1. Calculate subtotal before discount and promotions
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

  // 2. Calculate Customer VIP discount (NCL-15-CN-003)
  const customerDiscountRate = tab.customer?.discountRate || 0;
  const isCustomerPercentage = tab.customer?.discountType !== "CASH";
  const customerDiscountCash = Math.round(
    customerDiscountRate > 0
      ? isCustomerPercentage
        ? (totalOriginalAmount * customerDiscountRate) / 100
        : Math.min(totalOriginalAmount, customerDiscountRate)
      : 0
  );

  // 3. Calculate manual discount cash amount
  const manualDiscountCash = Math.round(
    tab.discountType === "PERCENTAGE"
      ? (totalOriginalAmount * (tab.discountValue || 0)) / 100
      : tab.discountValue || 0
  );

  const totalOrderLevelDiscounts = Math.min(
    totalOriginalAmount,
    customerDiscountCash + manualDiscountCash
  );

  const afterDiscountAmount = Math.max(0, totalCartAmount - totalOrderLevelDiscounts);

  // 4. Calculate Tax (Thuế GTGT / VAT)
  const itemTaxTotal = Math.round(
    tab.items.reduce((sum, item) => {
      const itemTax = (item.product?.taxRatePercentage || 0) / 100;
      return sum + item.lineTotal * itemTax;
    }, 0)
  );

  const totalTaxAmount = Math.round(
    tab.vatRate !== undefined
      ? afterDiscountAmount * (tab.vatRate / 100)
      : itemTaxTotal
  );

  // 5. Calculate final total to pay (Khách cần trả)
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
