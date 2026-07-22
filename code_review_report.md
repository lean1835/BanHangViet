# Code Review Report (Epic: NCL-05)

**Dự án**: BanHangViet (Bán Hàng Việt)  
**Nhóm chức năng**: Quản lý hóa đơn điện tử (NCL-05)  
**Trạng thái**: **APPROVED ✅**  
**Kết quả kiểm thử**: **13 / 13 tests passed (BUILD SUCCESS)**

---

## I. Tóm Tắt Tác Động & Xử Lý Xung Đột (Merge & Conflict Resolution)

Khi thực hiện pull code mới nhất từ nhánh `develop` về, hệ thống đã phát hiện xung đột tại **11 file**. Toàn bộ xung đột đã được giải quyết triệt để nhằm gộp cả 2 luồng tính năng: **Điều chỉnh hóa đơn (local)** và **Phát hành hóa đơn gốc (develop)**.

1. **Định danh mã lỗi (`ErrorCode.java`)**: 
   * Dịch chuyển dải mã lỗi điều chỉnh hóa đơn của local sang dải từ `4009` đến `4011` để tránh đè đúp lên dải `4001`-`4008` của develop.
   * `INVOICE_NOT_ISSUED`: `4002` ➔ `4009`
   * `INVOICE_ADJUSTMENT_NO_CHANGE`: `4003` ➔ `4010`
   * `INVOICE_ALREADY_ADJUSTED_OR_CANCELED`: `4004` ➔ `4011`
   * Sử dụng chung mã `INVOICE_NOT_FOUND` (`4004`) của develop.

2. **Hợp nhất API Endpoint (`EInvoiceController.java`)**:
   * **Danh sách (`GET /api/v1/invoices`)**: Hợp nhất thành 1 API duy nhất nhận các tham số lọc động (`status`, `fromDate`, `toDate`, `search`, `page`, `size`) và trả về `InvoiceResponse` để tương thích giao diện của cả hai bên.
   * **Chi tiết (`GET /{id}`)**: Hợp nhất thành 1 API duy nhất gọi `getInvoice(...)` trả về `InvoiceResponse`.

3. **Tối ưu hóa JPA Eager Loading (`EInvoiceRepository.java`)**:
   * Hợp nhất cấu hình `@EntityGraph` cho các phương thức tìm kiếm giúp nạp trước toàn bộ mối quan hệ liên quan (`items`, `items.product`, `createdByUser`, `canceledByUser`, `household`, `order`, `originalInvoice`) trong **chỉ 1 câu truy vấn SQL JOIN duy nhất**.

---

## II. Đánh Giá Chi Tiết Theo Quy Chuẩn Kỹ Thuật (Spring Boot Backend)

### 1. Tránh Lỗi N+1 Query (N+1 Query Avoidance)
* **Trạng thái**: **ĐÃ ĐẠT (Độ ưu tiên: P1)**
* **Chi tiết**:
  * Tại API tra cứu danh sách hóa đơn điện tử phân trang (`getInvoices`), việc chuyển đổi DTO có thể gây ra lazy loading nạp danh sách `items` của từng hóa đơn. Đã giải quyết bằng cấu hình `@EntityGraph` ghi đè phương thức `findAll()` ở repository.
  * Tại API xem lịch sử log trạng thái (`getInvoiceLogs`), đã bổ sung cấu hình `@EntityGraph(attributePaths = {"changedByUser"})` cho phương thức truy vấn logs để tránh nạp thông tin User thực hiện đổi trạng thái trong vòng lặp chuyển đổi DTO.

### 2. Quản Giao Dịch (Transaction Management)
* **Trạng thái**: **ĐÃ ĐẠT (Độ ưu tiên: P1)**
* **Chi tiết**:
  * Phương thức xử lý nghiệp vụ ghi (`createAdjustmentInvoice` và các luồng phát hành nháp/hủy hóa đơn của develop) đều được cấu hình annotation `@Transactional(rollbackFor = Exception.class)` đảm bảo tự động rollback dữ liệu khi phát sinh bất kỳ checked/unchecked exception nào.
  * Các phương thức chỉ đọc (`getInvoices`, `getInvoiceLogs`, `getInvoice`) được gắn `@Transactional(readOnly = true)` để tối ưu bộ đệm Hibernate.

### 3. Xác Thực & Phân Quyền Cách Ly Dữ Liệu (Security & Data Isolation)
* **Trạng thái**: **ĐÃ ĐẠT (Độ ưu tiên: P0)**
* **Chi tiết**:
  * **SQL Injection**: Chặn hoàn toàn do toàn bộ bộ lọc động được cài đặt thông qua Criteria API (`Specification`) giúp bind tham số an toàn.
  * **Cách ly dữ liệu lớp Service**:
    * Đối với role `VT-02` (Nhân viên bán hàng): Hệ thống áp dụng bộ lọc `created_by_user_id = currentUser.id` khi tra cứu danh sách. Cố tình truy xuất ID hóa đơn của nhân viên khác hoặc của hộ kinh doanh khác sẽ bị hệ thống ném lỗi `403 Forbidden` trực tiếp từ tầng Service.
    * Đối với role `VT-01` (Chủ hộ) & `VT-03` (Kế toán): Cho phép xem toàn bộ hóa đơn thuộc hộ kinh doanh của mình.

### 4. Ràng Buộc Xác Thực Đầu Vào (Nested Request Validation)
* **Trạng thái**: **ĐÃ ĐẠT (Độ ưu tiên: P1)**
* **Chi tiết**:
  * Phát hiện và xử lý lỗi thiếu kiểm tra lồng nhau (nested validation) trong DTO `CreateAdjustmentInvoiceRequest`: Bổ sung annotation **`@Valid`** trước thuộc tính `List<CreateAdjustmentInvoiceItemRequest> items` để kích hoạt việc xác thực từng phần tử trong danh sách gửi lên (ví dụ: chặn số lượng âm, đơn giá âm, hoặc tên hàng trống).

---

## III. Điểm Lưu Ý Khi Triển Khai (Deployment Checklist)

* **SQL Migration**: File thiết kế database `database_design.sql` cập nhật ràng buộc constraint `chk_adjustment_ref` để cho phép trạng thái `ADJUSTED` trên hóa đơn gốc. Cần chạy lệnh SQL Migration này trên môi trường staging/production trước khi deploy code mới:
  ```sql
  ALTER TABLE e_invoices DROP CHECK chk_adjustment_ref;
  ALTER TABLE e_invoices ADD CONSTRAINT chk_adjustment_ref CHECK (
      (original_invoice_id IS NULL) OR 
      (original_invoice_id IS NOT NULL AND status <> 'ADJUSTED')
  );
  ```

---

## IV. Bảng Đánh Giá Chất Lượng (Scorecard)

| Tiêu chí review | Đánh giá | Trạng thái |
| :--- | :---: | :--- |
| **Logic Nghiệp vụ** | 10 / 10 | Đầy đủ và chuẩn xác theo PTYC. |
| **Hiệu năng (N+1 Query)** | 10 / 10 | Không phát hiện query thừa, tối ưu hóa qua EntityGraph. |
| **Bảo mật (Cách ly dữ liệu)** | 10 / 10 | Bảo vệ đa lớp và cách ly chặt chẽ vai trò VT-02. |
| **Độ bao phủ kiểm thử** | 10 / 10 | 13 integration tests bao quát toàn bộ vòng đời hóa đơn và điều chỉnh. |
