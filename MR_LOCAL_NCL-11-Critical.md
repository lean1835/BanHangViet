# 🛡️ CRITICAL RISK REPORT: LOCAL UNCOMMITTED CHANGES REVIEW
**Mã nghiệp vụ:** NCL-11 (4 Chức năng): Trả hàng, hoàn tiền và điều chỉnh giảm hóa đơn  
**Đối tượng báo cáo:** Technical Lead / Solution Architect  
**Phán quyết kỹ thuật:** **APPROVED ✅**  
**Tổng số rủi ro phát hiện:** **0 lỗi P0, 0 lỗi P1, 0 lỗi P2, 1 khuyến nghị P3 (Refactor nhỏ)**

---

## 1. PHÂN TÍCH CHUYÊN SÂU CÁC RỦI RO KỸ THUẬT & TOÀN VẸN DỮ LIỆU

### 1.1 Rủi ro Tính toán Tài chính & Doanh thu Thuế (Financial & Tax Compliance)
- **Vấn đề đặt ra:** Khi phát hành hóa đơn điều chỉnh giảm theo phiếu trả hàng, nếu số tiền điều chỉnh hoặc tiền thuế tính sai sẽ làm sai lệch tờ khai thuế VAT và sổ sách doanh thu theo quy định năm 2026.
- **Hiện trạng kiểm tra mã nguồn:**
  - Logic tính toán tại `ReturnTicketServiceImpl.java` phân bổ chiết khấu tương ứng với số lượng trả (`lineDiscount = itemDiscount * reqQty / boughtQty`), tính toán `lineNetTotal` và `lineTaxAmount` theo đúng thuế suất gốc của từng dòng hàng.
  - Hóa đơn điều chỉnh giảm (`EInvoice`) được liên kết cả `originalInvoice` và `returnTicket` theo đúng quy tắc **QTN-20**.
  - Trạng thái HĐ gốc được chuyển sang `ADJUSTED` và ghi nhận lịch sử vào `InvoiceStatusLog`.
- **Đánh giá:** ✅ **AN TOÀN - Không có rủi ro.**

### 1.2 Rủi ro Bất đồng bộ Tồn kho & Concurrency Race Condition (Inventory Integrity)
- **Vấn đề đặt ra:** Khi duyệt hoàn tiền phiếu trả hàng, nếu nhiều thao tác diễn ra đồng thời có thể gây sai lệch số lượng tồn kho hoặc hoàn tiền hai lần cho cùng một phiếu.
- **Hiện trạng kiểm tra mã nguồn:**
  - `approveReturnTicket` kiểm tra điều kiện trạng thái nghiêm ngặt: nếu `ticket.getStatus() != "PENDING"` sẽ quăng ngay `AppException(ErrorCode.RETURN_TICKET_ALREADY_PROCESSED)`.
  - Hàm hoàn tồn kho sử dụng câu truy vấn nguyên tử (Atomic database update):
    ```java
    productRepository.addStock(product.getId(), user.getHousehold().getId(), item.getQuantity());
    ```
    tránh hoàn toàn hiện tượng Lost Update khi ghi đè state trong bộ nhớ JVM.
  - Toàn bộ phương thức bọc trong `@Transactional(rollbackFor = Exception.class)`.
- **Đánh giá:** ✅ **AN TOÀN - Không có rủi ro.**

### 1.3 Rủi ro Thâm nhập Phân quyền (Authorization & Privilege Escalation)
- **Vấn đề đặt ra:** Thu ngân (`VT-02`) hoặc Khách hàng (`VT-06`) có thể tự ý duyệt hoàn tiền hoặc tạo HĐ điều chỉnh giảm trái phép.
- **Hiện trạng kiểm tra mã nguồn:**
  - Tại Controller:
    - `POST /api/v1/return-tickets`: Chỉ `VT-01` (Chủ hộ) & `VT-02` (Nhân viên).
    - `PUT /api/v1/return-tickets/{id}/approve`: Bắt buộc `hasRole('VT-01')`.
    - `PUT /api/v1/return-tickets/{id}/reject`: Bắt buộc `hasRole('VT-01')`.
    - `POST /api/v1/return-tickets/{id}/create-adjustment-invoice`: Bắt buộc `hasAnyRole('VT-01', 'VT-03')`.
    - `GET /api/v1/return-tickets/statistics`: Bắt buộc `hasAnyRole('VT-01', 'VT-03')`.
  - Tại Service: Bổ sung lớp kiểm tra programmatic `validateOwnerRole(user)` và `validateOwnerOrAccountantRole(user)` độc lập.
  - Tại Frontend: Các nút bấm hành động nhạy cảm ẩn/hiện có điều kiện dựa trên `currentRole` kết hợp bảo vệ cấp Router.
- **Đánh giá:** ✅ **AN TOÀN - Đã bọc bảo vệ 3 lớp (3-tier security defense).**

### 1.4 Rủi ro Hiệu năng & N+1 Query (Performance & Memory)
- **Vấn đề đặt ra:** Trang danh sách và thống kê có thể phát sinh N+1 query khi truy xuất các thực thể liên quan (`EInvoice`, `Household`, `User`, `ReturnTicketItem`).
- **Hiện trạng kiểm tra mã nguồn:**
  - `EInvoiceRepository.findByReturnTicketIdAndDeletedAtIsNull` được cấu hình `@EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})`.
  - `getReturnTicketStatistics` sử dụng các JPQL Aggregate Queries (`countTicketsByStatus`, `findByHouseholdIdAndStatusAndPeriod`, `findDailyReturnStatistics`, `findTopReturnedProducts`) và gom nhóm trong một lượt duyệt map trong bộ nhớ thay vì gọi DB lặp đi lặp lại.
- **Đánh giá:** ✅ **AN TOÀN - Đạt chuẩn hiệu năng cao.**

---

## 2. DANH MỤC PHÁT HIỆN THEO PHÂN CẤP ĐỘ (FINDINGS)

### P0 (Critical) - 0 lỗi
*Không có lỗi bảo mật, mất dữ liệu hay lỗi crash production nào.*

### P1 (High) - 0 lỗi
*Không có sai sót logic nghiệp vụ hay thắt nút cổ chai hiệu năng.*

### P2 (Medium) - 0 lỗi
*Không có vi phạm kiến trúc nghiêm trọng.*

### P3 (Low / Nice-to-have) - 1 khuyến nghị
- **Item #1:** Tại `ReturnTicketServiceImpl.java` (dòng 902), hàm `generateTicketNumber` đang dùng `synchronized` cấp phương thức để sinh mã tuần tự dạng `PTH-YYYYMMDD-XXXX`.
  - *Đánh giá:* Đối với mô hình Hộ kinh doanh đơn lẻ chạy trên một instance máy chủ, cơ chế này hoàn toàn ổn định và an toàn. Nếu sau này mở rộng quy mô hệ thống sang cụm phân tán (Multi-instance clustered deployment), có thể cân nhắc chuyển sang Redis Atomic Counter hoặc Database Sequence chuyên dụng.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ (VERIFICATION MATRIX)

```
[TEST SUITE: BACKEND JUNIT 5 & SPRING BOOT TEST]
- com.sales.controller.ReturnTicketControllerTest: 9 tests (PASSED 100%)
- com.sales.service.ReturnTicketServiceImplTest:   31 tests (PASSED 100%)
-> TỔNG: 40/40 Tests PASSED.

[TEST SUITE: FRONTEND VITEST & REACT TESTING LIBRARY]
- ReturnTicket.test.tsx:                          10 tests (PASSED 100%)
- InventoryAudit.test.tsx:                        6 tests (PASSED 100%)
- InventoryWarning.test.tsx:                      7 tests (PASSED 100%)
-> TỔNG: 23/23 Tests PASSED.

[LINTER & CODE STYLE]
- ESLint: 0 errors, 0 warnings.
- TypeScript Compile: 0 errors.
```

---

## 4. QUYẾT ĐỊNH CUỐI CÙNG (FINAL ARCHITECT VERDICT)
- **Trạng thái:** **APPROVED FOR MERGE ✅**
- **Độ tin cậy mã nguồn:** **Cao (Production-Ready)**
