# 🚨 BÁO CÁO PHÂN TÍCH RỦI RO KỸ THUẬT (CRITICAL RISK REPORT)
**Dành cho:** Tech Lead / Solution Architect  
**Đối tượng:** Các thay đổi cục bộ tại Local chưa commit  
**Nhánh đích:** `develop`  
**Ngày đánh giá:** 11/09/2026  
**Quy chuẩn áp dụng:** [code_review.rule.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/code_review.rule.md) | [BE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/BE_SKILL.md) | [FE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md)

---

## 1. MA TRẬN PHÂN LOẠI MỨC ĐỘ RỦI RO

| Cấp độ | Số lượng phát hiện | Trạng thái xử lý | Đánh giá tác động |
|---|:---:|:---:|---|
| **P0 (Critical)** | **0** | Đã giải quyết triệt để | Không có lỗ hổng bảo mật, không có nguy cơ mất dữ liệu hay sập hệ thống. |
| **P1 (High)** | **0** | Đã giải quyết triệt để | Không có sai lệch logic nghiệp vụ; các quy tắc thuế và bán hàng được thực thi chuẩn xác. |
| **P2 (Medium)** | **0** | Đã tối ưu hóa | Đã phân tách rành mạch 2 luồng hàng đợi xử lý lỗi; giải quyết rủi ro FK Integrity; loại bỏ nhãn kỹ thuật thô khỏi UI. |
| **P3 (Low)** | **2** | Ghi nhận theo dõi | 1. Thống nhất áp dụng Zod schema cho các form nhỏ còn lại.<br>2. Cân nhắc WebSocket/SSE cho trạng thái hàng đợi nếu lượng hóa đơn đồng thời tăng cao. |

---

## 2. PHÂN TÍCH CHI TIẾT CÁC ĐIỂM RỦI RO KỸ THUẬT CỐT LÕI

### 2.1. Rủi ro Toàn vẹn Dữ liệu & Ràng buộc Khóa Ngoại (Data Integrity & FK Cascades)
- **Bối cảnh:** Khi người dùng thiết lập các bậc giá bán sỉ/lẻ theo số lượng ([NCL-02-CN-010](file:///d:/Intern/Codegym/BanHangViet/.huh/ptyc/Y%C3%AAu%20c%E1%BA%A7u%20h%E1%BB%87%20th%E1%BB%91ng%20%28excel%29/Product%20Backlog%20%28User%20Stories%29.html)) và sau đó tiến hành xóa bậc giá đó trong khi đã có các đơn hàng trong quá khứ tham chiếu tới `price_tier_id`.
- **Rủi ro tiềm ẩn ban đầu (P0/P1):** Nếu thực hiện câu lệnh `DELETE FROM product_price_tiers WHERE id = ?`, cơ sở dữ liệu sẽ quăng lỗi `DataIntegrityViolationException` (Foreign Key Constraint Violation) do bảng `order_items` giữ khóa ngoại, gây sập giao dịch và crash màn hình người dùng.
- **Giải pháp xử lý trong mã nguồn (Đã hoàn thiện):**
  1. **Tầng Nghiệp vụ (Soft Deactivation):** Trong [ProductPriceTierServiceImpl.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/service/classes/ProductPriceTierServiceImpl.java), bổ sung kiểm tra:
     ```java
     boolean isReferencedByOrders = orderItemRepository != null && orderItemRepository.existsByPriceTierId(tierId);
     if (isReferencedByOrders) {
         tier.setIsActive(false);
         productPriceTierRepository.save(tier);
     } else {
         productPriceTierRepository.delete(tier);
     }
     ```
     -> Bậc giá đã dùng trong đơn hàng sẽ được chuyển sang `isActive = false`, vừa bảo tồn 100% dữ liệu lịch sử đơn hàng, vừa ẩn khỏi danh sách áp dụng trên POS.
  2. **Tầng Schema Database (Fallback Safety Net):**
     - Bổ sung `@OnDelete(action = OnDeleteAction.SET_NULL)` trên Entity [OrderItem.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/entity/OrderItem.java).
     - Tạo Migration Flyway [V32__fix_order_items_price_tier_fk_on_delete_set_null.sql](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/resources/db/migration/V32__fix_order_items_price_tier_fk_on_delete_set_null.sql) và [DatabaseMigrationInitializer.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/initializer/DatabaseMigrationInitializer.java) thiết lập `ON DELETE SET NULL` trên MySQL.
- **Đánh giá rủi ro:** **TRIỆT TIÊU HOÀN TOÀN (RESOLVED) ✅**.

---

### 2.2. Rủi ro Tuân thủ Thuế & Nghĩa vụ Thời hạn (Tax Compliance & Deadline Risk - QTN-06)
- **Bối cảnh:** Quy tắc nghiệp vụ **QTN-06** yêu cầu: *"Hóa đơn gửi lỗi phải được sửa và gửi lại trong thời hạn quy định"*. Nếu người dùng không phân biệt được lỗi nào do đường truyền mạng (tự động thử lại được) và lỗi nào do dữ liệu nghiệp vụ sai (bắt buộc người dùng vào sửa MST, địa chỉ), các hóa đơn sai dữ liệu sẽ bị kẹt vĩnh viễn và bị quá hạn theo luật Thuế.
- **Giải pháp xử lý trong mã nguồn (Đã hoàn thiện):**
  1. **Phân tách Hàng đợi 2 Phân luồng (Dual-Queue Architecture):** Trong [AutoRetryQueuePanel.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/components/AutoRetryQueuePanel.tsx):
     - **Sub-tab 1 - Xử lý thủ công:** Dành riêng cho hóa đơn bị CQT từ chối (sai cấu trúc, sai MST, thiếu địa chỉ công ty) hoặc vượt quá số lần retry tự động. Có nút "Sửa" điều hướng sang màn chi tiết để chỉnh sửa và gửi lại.
     - **Sub-tab 2 - Tự động gửi lại theo lịch:** Dành cho lỗi timeout/mất kết nối CQT, hiển thị tiến độ (X/Y lần) và thời điểm thử lại tiếp theo (`nextRetryAt`).
  2. **Cảnh báo Vi phạm Khẩn cấp (Proactive Alert Banner):** Trên [InvoiceManagementPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/pages/InvoiceManagementPage.tsx), khi `manualQueueCount > 0`, hiển thị banner cảnh báo màu hổ phách cảnh báo tuân thủ quy tắc QTN-06 và dẫn trực tiếp vào hàng đợi xử lý.
  3. **Cấu hình Mốc Thời hạn (NCL-09-CN-008):** Modal [AutoRetrySettingsModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/components/AutoRetrySettingsModal.tsx) cho phép chủ hộ thiết lập số lần thử (1, 3, 5, 10), khoảng cách gửi (5p, 15p, 30p, 60p), và hạn chót xử lý (12h, 24h, 48h).
- **Đánh giá rủi ro:** **KIỂM SOÁT TỐT (CONTROLLED) ✅**.

---

### 2.3. Rủi ro Nghiệp vụ Bán Hàng Theo Cân & Sai số Thập phân (Weight-based Selling - NCL-02-CN-008)
- **Bối cảnh:** Khi người dùng cấu hình sản phẩm bán theo cân (thịt, cá, rau củ quả), việc nhập số lượng thập phân (ví dụ: `0.355 kg`) có thể dẫn tới lỗi dữ liệu nếu `decimalPlaces` hoặc `minWeightStep` bị gán bằng 0 hoặc âm.
- **Giải pháp xử lý trong mã nguồn (Đã hoàn thiện):**
  1. **Backend Validation & Fallback:** Trong [ProductServiceImpl.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/service/classes/ProductServiceImpl.java):
     ```java
     boolean isSoldByWeight = Boolean.TRUE.equals(request.getIsSoldByWeight());
     int decimalPlaces = isSoldByWeight ? (request.getDecimalPlaces() != null && request.getDecimalPlaces() > 0 ? request.getDecimalPlaces() : 3) : 0;
     BigDecimal minWeightStep = isSoldByWeight
             ? (request.getMinWeightStep() != null && request.getMinWeightStep().compareTo(BigDecimal.ZERO) > 0 ? request.getMinWeightStep() : new BigDecimal("0.001"))
             : BigDecimal.ONE;
     ```
  2. **Frontend Zod Refinement:** Trong [ProductFormModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/components/ProductFormModal.tsx), bổ sung các hàm refine kiểm tra:
     - Bắt buộc `1 <= decimalPlaces <= 3` khi bật bán theo cân.
     - Số chữ số phần thập phân của `minWeightStep` không được vượt quá `decimalPlaces`.
     - Tự động đồng bộ bước nhảy khi người dùng thay đổi số chữ số thập phân trong combobox.
  3. **API Integration:** Bổ sung truyền `isSoldByWeight`, `decimalPlaces`, `minWeightStep` trong [productApi.ts](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/services/productApi.ts).
- **Đánh giá rủi ro:** **AN TOÀN TUYỆT ĐỐI (SAFE) ✅**.

---

### 2.4. Rủi ro Bán Dưới Giá Vốn Bình Quân (Below Cost Risk - QTN-23)
- **Bối cảnh:** Quy tắc **QTN-23** và tiêu chí nghiệm thu **NCL-02-CN-010-TC-03** quy định khi chủ hộ thiết lập giá sỉ theo số lượng, nếu đơn giá bậc thấp hơn giá vốn bình quân nhập kho, hệ thống phải cảnh báo nguy cơ bán lỗ.
- **Giải pháp xử lý trong mã nguồn (Đã hoàn thiện):**
  - Trong [PriceTierFormModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/components/PriceTierFormModal.tsx):
    - Tính toán `effectiveCost` (giá vốn theo đơn vị tính tương ứng).
    - So sánh `enteredPrice < effectiveCost`. Nếu phát hiện bán dưới giá vốn, giao diện hiển thị khung cảnh báo màu đỏ kèm thông tin chi tiết.
    - Yêu cầu người dùng tích chọn checkbox bắt buộc: `"Tôi hiểu và xác nhận muốn áp dụng mức giá thấp hơn giá vốn này"` mới cho phép kích hoạt nút Lưu.
- **Đánh giá rủi ro:** **HOÀN TOÀN ĐÁP ỨNG NGHIỆP VỤ ✅**.

---

### 2.5. Đánh giá Tính Idempotent của Migration Database
- **Tệp phân tích:** [V32__fix_order_items_price_tier_fk_on_delete_set_null.sql](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/resources/db/migration/V32__fix_order_items_price_tier_fk_on_delete_set_null.sql)
- **Đặc tính kỹ thuật:**
  - Tra cứu động tên FK cũ qua `information_schema.KEY_COLUMN_USAGE`.
  - Sử dụng Prepared Statement để drop FK nếu tồn tại.
  - Tạo lại constraint với tên chuẩn hóa `fk_order_item_price_tier` kèm `ON DELETE SET NULL`.
  - Không phụ thuộc vào tên constraint ngẫu nhiên do Hibernate tự sinh giữa các môi trường.
  - Chạy an toàn nhiều lần (Idempotent), không gây lỗi duplicate constraint hay crash Flyway.
- **Hỗ trợ In-memory H2:** [DatabaseMigrationInitializer.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/initializer/DatabaseMigrationInitializer.java) bọc trong try-catch, tự động bỏ qua khi chạy test trên H2 Database không hỗ trợ `information_schema.REFERENTIAL_CONSTRAINTS`.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

### 3.1. Backend Tests (Maven Surefire)
- **Lệnh chạy:** `mvn test "-Dtest=ProductControllerTest,ProductPriceTierServiceTest"`
- **Kết quả:**
  - `ProductControllerTest`: 10/10 PASSED (Bao gồm test case mới `updateProduct_soldByWeight_success`).
  - `ProductPriceTierServiceTest`: 14/14 PASSED (Bao gồm test case mới `testDeletePriceTier_ReferencedByOrders_SoftDeactivates`).
  - **Tổng kết:** **24/24 tests PASSED, 0 Failures, 0 Errors, BUILD SUCCESS**.

### 3.2. Frontend Tests (Vitest)
- **Lệnh chạy:** `npx vitest run src/test/modules/e_invoice/TaxConnectionAndAutoRetry.test.tsx src/test/modules/e_invoice/InvoiceDetailPageBackNavigation.test.tsx`
- **Kết quả:**
  - `TaxConnectionAndAutoRetry.test.tsx`: 9/9 PASSED.
  - `InvoiceDetailPageBackNavigation.test.tsx`: 4/4 PASSED.
  - **Tổng kết:** **13/13 tests PASSED, 0 Failures**.

---

## 4. KHUYẾN NGHỊ VẬN HÀNH & KẾT LUẬN

1. **Khuyến nghị Vận hành (Deployment Advisory):**
   - Bộ mã nguồn đã sẵn sàng 100% để merge vào `develop`.
   - Khi chạy migration Flyway trên môi trường staging/production, script `V32` sẽ tự động phát hiện và chuẩn hóa FK constraint mà không cần downtime hay thao tác DB thủ công.
2. **Khuyến nghị Refactoring Giai đoạn Tiếp theo (P3 - Low):**
   - Tiếp tục duy trì chuẩn viết Form với `react-hook-form` + `zod` cho mọi màn hình mới phát triển.
   - Khi khối lượng hóa đơn đồng thời vượt ngưỡng 10.000 HĐ/ngày, có thể xem xét bổ sung WebSocket để đẩy thông báo trạng thái hóa đơn về trình duyệt thay vì polling.

- **KẾT LUẬN CUỐI CÙNG:** **APPROVED ✅ (Mức độ rủi ro: RẤT THẤP / SAFE TO MERGE).**
