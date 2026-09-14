import { describe, it, expect } from "vitest";
import { calculatePosTotals } from "@/modules/pos/utils/posCalculations";
import type { IPosTab, IPosCartItem } from "@/modules/pos/types/IPos";

describe("POS Loyalty Points Redemption & Calculations (QTN-07, QTN-26)", () => {
  const createMockItem = (
    id: string,
    price: number,
    quantity: number,
    lineDiscount: number = 0,
    taxRate: number = 0
  ): IPosCartItem => ({
    id,
    product: {
      id,
      name: `Sản phẩm ${id}`,
      sku: `SP-${id}`,
      retailPrice: price,
      costPrice: price * 0.7,
      taxRatePercentage: taxRate,
    } as any,
    quantity,
    price,
    lineDiscount,
    lineTotal: price * quantity - lineDiscount,
  });

  it("TC-01: Khớp công thức tính tiền khi áp dụng đổi điểm theo chuẩn QTN-07", () => {
    // Đơn hàng gồm:
    // Món 1: 100.000đ x 2 = 200.000đ
    // Khách đổi 50 điểm = 50.000đ
    const tab: IPosTab = {
      id: "tab-1",
      orderNumber: "Hóa đơn 1",
      status: "DRAFT",
      saleMode: "NORMAL",
      customer: {
        id: "cust-1",
        name: "Khách quen A",
        creditLimit: 5000000,
        debt: 0,
      } as any,
      items: [createMockItem("1", 100000, 2)],
      discountType: "PERCENTAGE",
      discountValue: 0,
      paymentMethod: "CASH",
      amountGiven: 150000,
      isSaved: false,
      pointsRedeemed: 50,
      pointDiscountAmount: 50000,
    };

    const totals = calculatePosTotals(tab);

    expect(totals.totalOriginalAmount).toBe(200000);
    expect(totals.payableBeforePoints).toBe(200000);
    expect(totals.pointDiscountAmount).toBe(50000);
    // finalTotal = 200.000 - 50.000 = 150.000 (QTN-07)
    expect(totals.finalTotal).toBe(150000);
    expect(totals.changeAmount).toBe(0);
  });

  it("TC-02: Tách bạch hoàn toàn giữa khuyến mại SP, chiết khấu VIP và đổi điểm (QTN-26)", () => {
    // Đơn hàng gồm:
    // 1. Tiền gốc: 300.000đ, Khuyến mại tự động mặt hàng: 20.000đ -> còn 280.000đ
    // 2. Chiết khấu khách VIP 10% trên 280.000đ = 28.000đ -> còn 252.000đ
    // 3. Khách đổi 30 điểm = 30.000đ
    const tab: IPosTab = {
      id: "tab-2",
      orderNumber: "Hóa đơn 2",
      status: "DRAFT",
      saleMode: "NORMAL",
      customer: {
        id: "cust-vip",
        name: "Khách VIP",
        discountRate: 10,
        discountType: "PERCENTAGE",
        isVip: true,
        creditLimit: 5000000,
        debt: 0,
      } as any,
      items: [createMockItem("2", 150000, 2, 20000)],
      discountType: "PERCENTAGE",
      discountValue: 0,
      paymentMethod: "CASH",
      amountGiven: 222000,
      isSaved: false,
      pointsRedeemed: 30,
      pointDiscountAmount: 30000,
    };

    const totals = calculatePosTotals(tab);

    // Kiểm tra tính độc lập của từng khoản giảm trừ (QTN-26)
    expect(totals.totalPromotionDiscount).toBe(20000);
    expect(totals.customerDiscountCash).toBe(28000);
    expect(totals.payableBeforePoints).toBe(252000);
    expect(totals.pointDiscountAmount).toBe(30000);
    // finalTotal = 252.000 - 30.000 = 222.000
    expect(totals.finalTotal).toBe(222000);
  });

  it("TC-03: Khống chế tiền đổi điểm không được vượt quá số tiền phải trả của đơn", () => {
    // Tiền hàng chỉ có 40.000đ, nhưng điểm quy đổi là 50.000đ
    const tab: IPosTab = {
      id: "tab-3",
      orderNumber: "Hóa đơn 3",
      status: "DRAFT",
      saleMode: "NORMAL",
      customer: {
        id: "cust-3",
        name: "Khách C",
        creditLimit: 5000000,
        debt: 0,
      } as any,
      items: [createMockItem("3", 40000, 1)],
      discountType: "PERCENTAGE",
      discountValue: 0,
      paymentMethod: "CASH",
      amountGiven: 0,
      isSaved: false,
      pointsRedeemed: 50,
      pointDiscountAmount: 50000,
    };

    const totals = calculatePosTotals(tab);

    expect(totals.payableBeforePoints).toBe(40000);
    // Điểm quy đổi bị trần ở mức 40.000đ, không thể âm tiền
    expect(totals.pointDiscountAmount).toBe(40000);
    expect(totals.finalTotal).toBe(0);
  });
});
