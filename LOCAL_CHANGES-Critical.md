# 🚨 BÁO CÁO PHÂN TÍCH RỦI RO KỸ THUẬT (CRITICAL RISK REPORT)

**Đối tượng đánh giá:** Mã nguồn thay đổi cục bộ chưa commit (Local Uncommitted Changes)  
**Nhánh:** `develop`  
**Ngày cập nhật:** 14/09/2026  
**Chuyên gia đánh giá:** AI Senior Code Reviewer & System Architect  
**Phạm vi:** 
- **NCL-10-CN-007**: Đối chiếu công nợ và in giấy xác nhận nợ
- **NCL-10-CN-008**: Tích điểm và đổi điểm cho khách thân thiết
- **Quy tắc:** QTN-07, QTN-13, QTN-14, QTN-26

---

## 1. BẢNG TỔNG HỢP DANH MỤC LỖI & KẾT QUẢ XỬ LÝ

| Mã lỗi | Cấp độ | Tệp phát sinh | Tóm tắt rủi ro ban đầu | Tình trạng xử lý |
|---|:---:|---|---|:---:|
| **CRIT-01** | **P0 (Critical)** | [Order.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/entity/Order.java)<br>[EInvoice.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/entity/EInvoice.java) | Thiếu Migration script Flyway V35 cho các trường `tax_amount` trên bảng `orders` và `point_discount_amount`, `points_redeemed` trên bảng `e_invoices`. | **ĐÃ KHẮC PHỤC XONG ✅**<br>(Đã tạo tệp [V35__add_tax_amount_to_orders_and_point_columns_to_e_invoices.sql](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/resources/db/migration/V35__add_tax_amount_to_orders_and_point_columns_to_e_invoices.sql)) |
| **HIGH-01** | **P1 (High)** | [LoyaltyProgramSettingsPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/LoyaltyProgramSettingsPage.tsx) | Lỗi ESLint `no-constant-binary-expression` do biểu thức `Number(...) ?? DEFAULT`. Làm lệnh `npm run lint` bị thất bại. | **ĐÃ KHẮC PHỤC XONG ✅**<br>(Thay bằng nullish check an toàn, `npm run lint` đạt 0 lỗi) |
| **HIGH-02** | **P1 (High)** | [CustomerLoyalty.test.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/test/modules/customer/CustomerLoyalty.test.tsx) | 2 test cases TC-01 và TC-02 bị fail do chuỗi assertion không khớp với hằng số `LOYALTY_UI` đã chuẩn hóa. | **ĐÃ KHẮC PHỤC XONG ✅**<br>(Đồng bộ nhãn UI, vitest đạt 3/3 tests pass 100%) |
| **MED-01** | **P2 (Medium)** | [CustomerDetailPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/customer/pages/CustomerDetailPage.tsx) | Kích thước file vượt quá 1.400 dòng. | Ghi nhận backlog để tiếp tục tách component |
| **LOW-01** | **P3 (Low)** | [LookupInvoicePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/pages/LookupInvoicePage.tsx) | Sử dụng cast `(data as any)` khi lấy thông tin điểm tích lũy. | Tùy chọn cải tiến kiểu dữ liệu sau |

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG SAU KHI FIX (VERIFICATION)

### 2.1. Backend Tests (Maven Surefire)
- **Kiểm thử đối chiếu công nợ & tích điểm:**
  - `CustomerDebtReconciliationControllerTest`: 14/14 tests PASSED.
  - `LoyaltyControllerTest`: 9/9 tests PASSED.
  - `CustomerDebtReconciliationServiceImplTest`: 17/17 tests PASSED.
  - `LoyaltyServiceImplTest`: 16/16 tests PASSED.
- **Tổng kết:** **56/56 tests PASSED, 0 Failures, 0 Errors, BUILD SUCCESS**.

### 2.2. Frontend Tests (Vitest)
- **Lệnh chạy:** `npx vitest run src/test/modules/customer/CustomerDebtReconciliation.test.tsx src/test/modules/customer/CustomerDetailPage.test.tsx src/test/modules/customer/CustomerLoyalty.test.tsx src/test/modules/pos/PosLoyaltyRedeem.test.tsx src/test/modules/pos/CombinedPaymentFlow.test.tsx`
- **Kết quả:**
  - `PosLoyaltyRedeem.test.tsx`: 3/3 PASSED.
  - `CustomerLoyalty.test.tsx`: 3/3 PASSED.
  - `CustomerDetailPage.test.tsx`: 4/4 PASSED.
  - `CustomerDebtReconciliation.test.tsx`: 8/8 PASSED.
  - `CombinedPaymentFlow.test.tsx`: 9/9 PASSED.
- **Tổng kết:** **27/27 tests PASSED (100% SUCCESS)**.

### 2.3. Linter & Static Analysis
- **TypeScript Typecheck:** `npx tsc --noEmit` -> **0 lỗi** (Exit code 0).
- **ESLint Clean:** `npm run lint` (`eslint . --max-warnings 0`) -> **0 errors, 0 warnings** (Exit code 0).
- **Console.log Check:** **0 console.log** trong toàn bộ các file thay đổi.

---

## 3. PHÁN QUYẾT CUỐI CÙNG

- **Trạng thái:** **APPROVED ✅**
- **Đánh giá:** Toàn bộ các rủi ro vận hành (P0/P1) đã được triệt tiêu hoàn toàn. Mã nguồn đạt chất lượng rất cao, bảo đảm toàn vẹn dữ liệu kế toán và quy định pháp lý về thuế, tuân thủ nghiêm ngặt [BE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/BE_SKILL.md) và [FE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md).
- **Hành động tiếp theo:** **Sẵn sàng để thực hiện git commit và tạo Merge/Pull Request.**
