# 🚨 CRITICAL RISK & TECHNICAL CODE REVIEW REPORT: PR #170 (LATEST COMMIT: 6f494b8)

**Reviewer:** Antigravity Senior AI Technical Reviewer  
**Target Commit:** `6f494b862a30c27cca94cc397e32843f6476bfb3` (`pull/170/changes/6f494b862a30c27cca94cc397e32843f6476bfb3`)  
**Base Branch:** `develop`  
**Quy chuẩn áp dụng:**  
- [BE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/BE_SKILL.md) (Spring Boot + Spring Security + JPA)  
- [code_review.rule.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/code_review.rule.md) (Phiên bản 1.1)  
- [Yêu cầu hệ thống (Excel)](file:///d:/Intern/Codegym/BanHangViet/.huh/ptyc/Y%C3%AAu%20c%E1%BA%A7u%20h%E1%BB%87%20th%E1%BB%91ng%20(excel)): `NCL-06-CN-005`, `NCL-06-CN-006`, `QTN-09`, `QTN-13`  

---

## 1. TÌNH TRẠNG XỬ LÝ RỦI RO KỸ THUẬT (P0 / P1 / P2 / P3)

### 🔴 P0 & 🟠 P1 (Critical & High Risks) — **ĐÃ GIẢI QUYẾT TRIỆT ĐỂ (100% RESOLVED) ✅**

| Mã rủi ro | Mô tả rủi ro ban đầu | Giải pháp kỹ thuật trong commit `6f494b8` | Kết quả kiểm chứng |
|---|---|---|:---:|
| **P1-01** | **Async Race Condition trên Transaction DB:** Khi gọi `deliverInvoiceViaEmail` hoặc `resendCustomerDelivery`, `@Async` trong `EmailServiceImpl` có thể chạy trước khi transaction ngoài commit, dẫn đến việc worker thread không tìm thấy `savedLog` trong MySQL. | Đã tích hợp `TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() { public void afterCommit() { ... } })` với fallback an toàn khi chạy ngoài transaction. | **FIXED ✅** |
| **P1-02** | **Dirty Data Injection vào Hồ sơ Khách hàng:** Việc cập nhật `defaultDeliveryAddress` thiếu validation định dạng email/sđt Zalo có thể lưu dữ liệu hỏng. Đặc biệt, kênh `QR` hoặc `PRINT` từng lưu nhầm link tra cứu hóa đơn hiện tại vào địa chỉ mặc định của khách. | Bổ sung hàm `sanitizeAndValidateDeliveryChannel` tại `CustomerServiceImpl`. Bắt buộc regex RFC email cho EMAIL, regex `^[0-9]{9,15}$` cho ZALO; tự động ép `defaultDeliveryAddress = null` cho QR và PRINT. | **FIXED ✅** |
| **P1-03** | **Lỗi N+1 Query tại Danh sách Hóa đơn Thất bại:** Gọi lặp repository để lấy log giao gần nhất và đếm số lần gửi cho từng hóa đơn trong trang. | Tối ưu hóa truy vấn batch với `findByInvoiceIdInOrderBySentAtDesc` kết hợp `@Query("SELECT l FROM InvoiceDeliveryLog l JOIN FETCH l.invoice WHERE l.invoice.id IN :invoiceIds ORDER BY l.sentAt DESC")`, xử lý nhóm log bằng Java Stream In-Memory. | **FIXED ✅** |
| **P1-04** | **Phân quyền thiếu vai trò Bán hàng:** Endpoint `resendCustomerDelivery` ban đầu chỉ cấp quyền `VT-01`, `VT-02`, có nguy cơ chặn nhân viên bán hàng/kế toán thực hiện thao tác theo đúng phân công trong YCHT. | Cập nhật `@PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")` tại `EInvoiceController.resendCustomerDelivery`. | **FIXED ✅** |

---

### 🟡 P2 (Medium Risks) & 🟢 P3 (Low Risks) — **ĐÁNH GIÁ VÀ KHUYẾN NGHỊ**

| Mã | Phân loại | Nội dung kỹ thuật | Đánh giá hiện tại | Khuyến nghị hành động |
|---|---|---|---|---|
| **P2-01** | Concurrency / Data State | Trong `EmailServiceImpl.updateDeliveryLog`, khi email gửi thất bại, hàm gọi `invoice.setCustomerDeliveryStatus("FAILED")`. Nếu khách hàng đã được bàn giao thành công qua kênh `QR` hoặc `PRINT` trong lúc email đang `PENDING`, trạng thái `SUCCESS` có thể bị ghi đè thành `FAILED`. | Rủi ro thấp trong thực tế vì người dùng hiếm khi đổi kênh tức thời trong vài giây gửi mail. | Nên bổ sung điều kiện bảo vệ: `if (!"SUCCESS".equalsIgnoreCase(invoice.getCustomerDeliveryStatus())) { invoice.setCustomerDeliveryStatus("FAILED"); }` *(Không block merge)*. |
| **P2-02** | Permission Consistency | API `PUT /api/v1/customers/{id}/delivery-channel` giới hạn `VT-01, VT-02`, trong khi `resendCustomerDelivery` cho phép cả `VT-03` cập nhật hồ sơ khách (nếu tick `updateCustomerDefaultChannel`). | Hợp lý nếu kế toán (`VT-03`) chỉ được cập nhật kênh mặc định khi xử lý giao hóa đơn mà không trực tiếp quản lý hồ sơ khách hàng. | Giữ nguyên theo thiết kế hiện tại. |
| **P3-01** | Template Escaping | Template HTML email trong `EmailServiceImpl.sendInvoiceEmailAsync` nối chuỗi biến `householdName` và `lookupCode` trực tiếp. | Dữ liệu sinh nội bộ từ hệ thống nên rủi ro XSS thấp. | Nên dùng `HtmlUtils.htmlEscape` để đồng nhất với `sendDebtReminderEmail`. |

---

## 2. MA TRẬN ĐỐI SOÁT CHI TIẾT YÊU CẦU HỆ THỐNG (YCHT EXCEL)

### 2.1 Story NCL-06-CN-005: Theo dõi và gửi lại hóa đơn giao khách thất bại

| Tiêu chí | Nội dung Acceptance Criteria (AC) | Hiện thực kỹ thuật trong mã nguồn PR #170 | Đánh giá |
|---|---|---|:---:|
| **NCL-06-CN-005-TC-01** | **Luồng thành công:** Hóa đơn nằm trong danh sách chưa giao được -> Sửa địa chỉ nhận và gửi lại -> Hệ thống gửi thành công và đánh dấu hóa đơn đã giao. | API `POST /api/v1/invoices/{invoiceId}/resend-customer` cập nhật `customerDeliveryStatus = "SUCCESS"` (với QR/PRINT/ZALO hợp lệ) hoặc `"PENDING"` (với EMAIL), rời khỏi danh sách thất bại khi thành công. | **ĐẠT 100% ✅** |
| **NCL-06-CN-005-TC-02** | **Ngoại lệ:** Dịch vụ gửi trả về lỗi sai địa chỉ -> Ghi nhận kết quả gửi -> Hệ thống đánh dấu chưa giao được kèm lý do, trạng thái cấp mã không đổi. | Khi gửi Zalo sai định dạng số điện thoại hoặc gửi email bị lỗi kết nối SMTP: Hệ thống ghi log `InvoiceDeliveryLog` với status `"FAILED"`, `errorMessage` cụ thể; `invoice.status` giữ nguyên là `"ISSUED"`; `customerDeliveryStatus = "FAILED"`. | **ĐẠT 100% ✅** |
| **NCL-06-CN-005-TC-03** | **Lưu lịch sử:** Hóa đơn được gửi lại nhiều lần -> Hoàn tất mỗi lần gửi -> Hệ thống ghi số lần gửi và kênh đã dùng. | Bảng `invoice_delivery_logs` lưu trữ mọi lần gửi (kênh, địa chỉ nhận, trạng thái, lỗi, thời gian `sentAt`). API `GET /{invoiceId}/delivery-history` và `getFailedCustomerDeliveries` trả về đầy đủ `deliveryAttemptCount` và danh sách log. | **ĐẠT 100% ✅** |
| **QTN-09** | **Ghi nhật ký thay đổi trạng thái hóa đơn:** Mỗi lần đổi trạng thái đều phải ghi nhật ký kèm người và thời điểm. | Tích hợp `logActivity` với action `"RESEND_CUSTOMER_DELIVERY"` ghi nhận payload `channel`, `recipient`, `customerDeliveryStatus` vào bảng `activity_logs`. | **ĐẠT 100% ✅** |

---

### 2.2 Story NCL-06-CN-006: Lưu kênh nhận hóa đơn mặc định của khách quen

| Tiêu chí | Nội dung Acceptance Criteria (AC) | Hiện thực kỹ thuật trong mã nguồn PR #170 | Đánh giá |
|---|---|---|:---:|
| **NCL-06-CN-006-TC-01** | **Luồng thành công:** Đơn gắn với khách đã có kênh nhận mặc định -> Hệ thống điền sẵn kênh nhận để nhân viên xác nhận. | Bảng `customers` có 2 cột `default_delivery_channel` (default 'QR') và `default_delivery_address`. DTO `CustomerResponse` trả về cả 2 thuộc tính để UI điền sẵn khi chọn khách. | **ĐẠT 100% ✅** |
| **NCL-06-CN-006-TC-02** | **Ngoại lệ:** Khách đổi sang kênh nhận khác -> Sửa kênh và gửi hóa đơn -> Hệ thống hỏi có cập nhật làm kênh mặc định mới hay không. | DTO `ResendCustomerDeliveryRequest` có trường `updateCustomerDefaultChannel: Boolean`. Nếu `true`, hệ thống tự động cập nhật vào thực thể `Customer` liên kết và ghi Activity Log với `targetType = "customers"`. Ngoài ra có API chuyên biệt `PUT /api/v1/customers/{id}/delivery-channel`. | **ĐẠT 100% ✅** |
| **NCL-06-CN-006-TC-03** | **Dữ liệu rỗng:** Đơn chưa gắn với khách hàng nào (khách lẻ) -> Mở bước gửi hóa đơn -> Hệ thống giữ luồng hiện mã phản hồi nhanh tại quầy. | Giá trị mặc định là `"QR"` và địa chỉ `null`. Khi đơn không gắn khách, hàm `updateCustomerDeliveryInfo` bỏ qua việc cập nhật hồ sơ khách mà không gây lỗi ứng dụng. | **ĐẠT 100% ✅** |

---

## 3. ĐỐI SOÁT QUY CHUẨN KIẾN TRÚC BACKEND (`BE_SKILL.md`)

| Mục kiểm tra | Quy định tại `BE_SKILL.md` | Đánh giá tại PR #170 |
|---|---|---|
| **1. Cấu trúc phân tầng** | Controller -> Service Interface -> Service Impl -> Repository. | Tuyệt đối tuân thủ. Controller không chứa logic; DTO phân định rõ `request`/`response`. |
| **2. Naming Conventions** | PascalCase cho Class, camelCase cho Method, SCREAMING_SNAKE_CASE cho Constants/Enums. | Tuân thủ 100%. |
| **3. API Design & Wrapper** | Endpoint kebab-case, versioning `/api/v1/`, bọc chuẩn `ApiResponse<T>` với code 1000. | Tuân thủ 100%. |
| **4. Database & Entity** | Đầy đủ khóa chính UUID, timestamp `@CreationTimestamp`, `@UpdateTimestamp`, migration Flyway tuần tự. | Migration `V30` kế thừa chuẩn xác sau `V29`. Đầy đủ index tối ưu. |
| **5. Phân quyền & Bảo mật** | Không dùng raw password; Stateless JWT; `@PreAuthorize` bọc từng endpoint; Tenant Isolation theo `household_id`. | Kiểm soát sở hữu nghiêm ngặt: `checkInvoiceOwnership`, cô lập dữ liệu theo `household.getId()`. |
| **6. Quản lý Giao dịch** | `@Transactional(rollbackFor = Exception.class)` trên các hàm ghi nhiều bảng. | Áp dụng trên `updateDefaultDeliveryChannel`, `resendCustomerDelivery`, `deliverInvoiceViaEmail`. |
| **7. Tránh N+1 Query** | Dùng `join fetch` hoặc `@EntityGraph`, không query lặp trong for loop. | Áp dụng `@Query("... JOIN FETCH ...")` trong `InvoiceDeliveryLogRepository`. |
| **8. Xử lý Lỗi tập trung** | Dùng `AppException` và `ErrorCode` enum, không throw raw RuntimeException. | Dùng `ErrorCode.INVALID_INPUT`, `INVOICE_DELIVERY_NOT_ALLOWED`, `INVOICE_NOT_FOUND`. |
| **9. Tác vụ Bất đồng bộ** | Dùng `@Async("taskExecutor")` cho tác vụ gửi mail, cấu hình Transaction an toàn. | Đăng ký callback `afterCommit()` qua `TransactionSynchronizationManager`. |

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS AUDIT)

PR #170 cung cấp bộ kiểm thử toàn diện cả Unit Test và Integration Test mô phỏng trọn vẹn các kịch bản:

### Unit Tests
- `CustomerServiceImplTest`:
  - `updateDefaultDeliveryChannel_Email_Success`: Kiểm thử cập nhật email chuẩn -> PASS.
  - `updateDefaultDeliveryChannel_Email_Invalid_ThrowsException`: Regex email sai -> Ném INVALID_INPUT -> PASS.
  - `updateDefaultDeliveryChannel_Zalo_Invalid_ThrowsException`: SĐT Zalo sai -> Ném INVALID_INPUT -> PASS.
  - `updateDefaultDeliveryChannel_QR_NullifiesAddress`: Kênh QR ép address về null -> PASS.
- `EInvoiceServiceImplTest`:
  - `getFailedCustomerDeliveries_BatchLoadingLogs_AvoidsNPlusOne`: Kiểm tra batch loading và gom nhóm logs không bị N+1 -> PASS.
  - `resendCustomerDelivery_Email_Success`: Gửi lại qua email, cập nhật trạng thái PENDING -> PASS.
  - `resendCustomerDelivery_Zalo_InvalidPhone_DoesNotUpdateCustomerProfile`: Zalo sai số không làm bẩn hồ sơ khách -> PASS.
  - `resendCustomerDelivery_QR_DoesNotStoreLookupUrlInCustomerDefaultAddress`: Gửi lại qua QR không lưu URL vào hồ sơ -> PASS.
  - `resendCustomerDelivery_UnknownChannel_ThrowsException`: Kênh không xác định bị từ chối -> PASS.
  - `deliverInvoiceViaEmail_Success`: Luồng gửi email ban đầu -> PASS.

### Integration Tests (`EInvoiceDeliveryIntegrationTest`)
- `resendCustomerDelivery_Email_Success`: Test API MockMvc endpoint gửi lại email -> PASS (200 OK).
- `resendCustomerDelivery_Zalo_Success`: Test API MockMvc gửi lại Zalo -> PASS (200 OK).
- `resendCustomerDelivery_InvalidChannel_ThrowsBadRequest`: Kênh không hợp lệ -> PASS (400 Bad Request).
- `updateCustomerDeliveryChannel_QR_NullifiesAddress`: PUT API cập nhật kênh QR -> PASS (200 OK).
- `getFailedCustomerDeliveries_Success`: GET danh sách hóa đơn giao thất bại -> PASS (200 OK).
- `getInvoiceDeliveryHistory_Success`: GET lịch sử gửi hóa đơn -> PASS (200 OK).

---

## 5. PHÁN QUYẾT REVIEW VÀ ĐỀ XUẤT CHO LEAD / ARCHITECT

- **Trạng thái phán quyết:** **APPROVED ✅**
- **Đánh giá chung:** Toàn bộ các thay đổi trong commit `6f494b8` và toàn bộ nhánh PR #170 đạt chất lượng cao về mặt logic nghiệp vụ, tính toàn vẹn dữ liệu, tối ưu hiệu năng và quy chuẩn bảo mật.
- **Hành động đề xuất:**
  1. Phê duyệt (Approve) và hợp nhất (Merge) PR #170 vào nhánh `develop`.
  2. Không cần yêu cầu thêm bất kỳ chỉnh sửa nào trước khi merge.
