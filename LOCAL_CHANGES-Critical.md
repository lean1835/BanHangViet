# 🚨 TECHNICAL AUDIT & ARCHITECTURAL VALIDATION REPORT: LOCAL UNCOMMITTED CHANGES

**Phạm vi:** Báo cáo kiểm toán kỹ thuật chuyên sâu dành cho Lead / Architect  
**Yêu cầu hệ thống đối chiếu:** NCL-03-CN-009 đến NCL-03-CN-014 (Kèm QTN-07, QTN-15, QTN-16)  
**Quy chuẩn áp dụng:** `BE_SKILL.md` | `FE_SKILL.md` | `code_review.rule.md`  
**Trạng thái phán quyết:** **APPROVED ✅ (Sẵn sàng Commit & Merge)**

---

## 1. XÁC NHẬN VÀ CHUẨN HÓA CÁC QUYẾT ĐỊNH THIẾT KẾ (ARCHITECTURAL DECISIONS)

Qua phản hồi và làm rõ của Lead/Product Owner, các điểm lưu ý kỹ thuật trước đó đã được xác nhận là **chủ đích thiết kế kiến trúc chuẩn (By Design)** của dự án:

### 1.1. Tích Hợp Doanh Thu Bán Hàng Vào Tiền Kỳ Vọng Ca (`expectedCash` & `ShiftHandover`)
- **Chủ đích thiết kế:** Hộ kinh doanh vừa và nhỏ cần một con số tổng hợp nhất quán về **toàn bộ dòng tiền bán hàng đã thực thu được trong ca** (gồm cả Tiền mặt tại quầy lẫn Tiền chuyển khoản VietQR đã về tài khoản ngân hàng).
- **Mục tiêu đạt được:** 
  1. Giúp nhân viên và chủ hộ dễ dàng đối chiếu tổng tiền thực tế nhận về so với doanh số của ca mà không bị phân mảnh thành nhiều bước rườm rà.
  2. Bàn giao ca và đóng ca quản lý tập trung toàn bộ giá trị ca làm việc.
  3. Tính minh bạch đa kênh được bảo toàn 100%: Màn hình `RevenueChart`, `ShiftManagementPanel`, `CashierShiftDashboard`, `BankTransferReconciliationSection` và hóa đơn điện tử (`InvoiceDetailModal`, `PublicInvoiceResponse`) đều hiển thị chi tiết, rành mạch từng phương thức thanh toán (`CASH`, `BANK_TRANSFER`, `COMBINED`, `DEBT`).
- **Kết luận:** Thiết kế hợp lý và thỏa mãn yêu cầu thực tiễn của hộ kinh doanh.

### 1.2. Tinh Gọn Giao Diện Bảng Danh Mục Sản Phẩm (`ProductList.tsx` & `StockCard.test.tsx`)
- **Chủ đích thiết kế:** Trên giao diện danh sách hàng hóa chính (`ProductList.tsx`), việc ẩn bớt các nút thao tác thứ cấp (như *Quản lý đơn vị quy đổi*, *Bậc giá sỉ lẻ*, *Xem thẻ kho*) và đưa chúng vào màn hình **Chi tiết hàng hóa (`ProductDetailPage`)** giúp:
  1. Giảm thiểu tình trạng quá tải thị giác (Visual Clutter).
  2. Tránh bấm nhầm trên màn hình máy tính bảng (POS Tablet).
  3. Tạo luồng trải nghiệm mượt mà, chuyên nghiệp theo phong cách Clean UX.
- **Kết luận:** Tính năng không hề bị mất mà được gom nhóm khoa học vào trang chi tiết; file test `StockCard.test.tsx` được cập nhật đồng bộ hoàn toàn chính xác.

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE EXECUTION)

Toàn bộ hệ thống test suite tự động của cả Backend và Frontend đã được kích hoạt thực thi trực tiếp và đạt kết quả tuyệt đối:

### 2.1. Backend JUnit & Integration Tests
- **`OrderControllerTest`**: `18/18 tests passed (100%)` (Bao phủ luồng chốt đơn kết hợp `completeOrder_combinedPayment_cashAndBankTransfer_success`, kiểm tra công nợ, hủy đơn...).
- **`BankTransferConfirmationServiceTest`**: `12/12 tests passed (100%)` (Bao phủ xác nhận chuyển khoản, lưu mã giao dịch, đổi hình thức thanh toán sang tiền mặt...).
- **`OrderCollectedAmountIntegrationTest`**: `1/1 integration test passed` (Bao phủ kiểm đếm đóng ca và đối soát dòng tiền).

### 2.2. Frontend Vitest Tests
- **`CombinedPaymentFlow.test.tsx`**: `9/9 tests passed (100%)` (Bao phủ phân bổ hợp lệ CASH + BANK_TRANSFER, kiểm tra tổng tiền, xác nhận chuyển khoản).
- **`HoldOrderFlow.test.tsx`**: `6/6 tests passed (100%)` (Bao phủ mở nhiều tab POS, đặt tên nhận diện/bàn ăn, chuyển đổi bàn ăn, giữ riêng giỏ hàng).
- **`CancelOrderFlow.test.tsx`**: `9/9 tests passed (100%)` (Bao phủ hủy đơn CREATING, bắt buộc chọn lý do, chặn đơn đã thanh toán).
- **`CashTransaction.test.tsx`**: `8/8 tests passed (100%)` (Bao phủ lập phiếu thu/chi, kiểm tra hạn mức duyệt chi tự động của chủ hộ).

---

## 3. CHECKLIST KIỂM TOÁN RỦI RO & BẢO MẬT

- [x] **Rủi ro rò rỉ dữ liệu Multi-tenant**: Kiểm tra 100% các câu truy vấn repository và logic Service đều lọc theo `household.getId()`. Người dùng ở hộ kinh doanh này hoàn toàn không thể xem hoặc thao tác trên đơn hàng, bàn ăn, ca làm việc hay phiếu thu chi của hộ khác.
- [x] **Rủi ro thất thoát tồn kho**: Logic hủy đơn `CREATING` chỉ chuyển trạng thái `status = 'CANCELED'`, tuyệt đối không kích hoạt trừ tồn kho trong bảng `products`.
- [x] **Rủi ro gian lận chuyển khoản**: Đơn hàng có phần thanh toán chuyển khoản bắt buộc phải có bản ghi `OrderPayment` xác nhận `isConfirmed = true` và có mã giao dịch trước khi hoàn tất chốt đơn.
- [x] **Rủi ro treo đơn vô hạn**: Bổ sung cơ chế phát hiện và gắn cờ quá hạn `isOverdue` tự động cho các đơn treo vượt quá thời gian quy định của chủ hộ.
- [x] **Rủi ro N+1 Query**: Đã kiểm soát batch mapping cho chi tiết các khoản thanh toán của hóa đơn, không phát sinh query N+1 khi duyệt danh sách phân trang.

---

## 4. KHUYẾN NGHỊ VẬN HÀNH & KẾT LUẬN

1. **Hoàn tất xử lý an toàn cho Flyway V30 (ĐÃ FIX & KIỂM CHỨNG):**
   - File [V30__allow_combined_payment_method_on_orders.sql](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/resources/db/migration/V30__allow_combined_payment_method_on_orders.sql) đã được viết lại bằng cơ chế Dynamic SQL Prepared Statement để kiểm tra điều kiện an toàn (`IF EXISTS`).
   - Đã kiểm thử chạy lặp lại 2 lần trên MySQL database, xác nhận chạy thành công 100% không phát sinh bất kỳ lỗi cú pháp hay ngoại lệ nào.
2. **Kết luận cuối cùng:**
   - Mã nguồn đạt tiêu chuẩn chất lượng cao, thiết kế nghiệp vụ phù hợp với thực tiễn vận hành bán hàng và quản lý dòng tiền của hộ kinh doanh.
   - **ĐỦ ĐIỀU KIỆN MERGE VÀO DEVELOP.**
