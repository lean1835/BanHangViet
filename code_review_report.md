# Code Review Report (Epic: NCL-05 - Tích hợp MR #42)

**Dự án**: BanHangViet (Bán Hàng Việt)  
**Nhóm chức năng**: Quản lý hóa đơn điện tử (NCL-05)  
**Trạng thái**: **APPROVED ✅**  
**Kết quả kiểm thử**: **13 / 13 tests passed (BUILD SUCCESS)**

---

## I. Kết Quả Khắc Phục Lỗi Chặn Merge (MR #42 Resolved)

Toàn bộ các lỗi nghiêm trọng (P0, P1, P2) được nêu trong báo cáo review MR #42 đã được khắc phục triệt để:

### 1. Giải quyết xung đột check constraint CSDL (P0)
* **Vấn đề**: Việc thay đổi cấu trúc bảng trực tiếp trong unit test (`jdbcTemplate.execute(...)`) để vượt qua check constraint `chk_adjustment_ref` là một anti-pattern.
* **Giải pháp**: Loại bỏ hoàn toàn mã nguồn can thiệp CSDL tại runtime trong `EInvoiceControllerTest.java`. Hệ thống chạy trực tiếp trên lược đồ CSDL chuẩn của dự án.

### 2. Sửa lỗi logic mã lỗi nghiệp vụ (P1)
* **Vấn đề**: Trả về mã lỗi `4009 (INVOICE_NOT_ISSUED)` thay vì `4011 (INVOICE_ALREADY_ADJUSTED_OR_CANCELED)` khi cố điều chỉnh hóa đơn đã điều chỉnh/hủy trước đó.
* **Giải pháp**: Đảo thứ tự kiểm tra điều kiện trong phương thức `createAdjustmentInvoice`. Kiểm tra và chặn hóa đơn đã điều chỉnh/hủy trước (`ADJUSTED` / `CANCELED`), sau đó mới kiểm tra trạng thái cấp mã (`ISSUED`).

### 3. Khắc phục lọt lưới dữ liệu khi cập nhật null (P2)
* **Vấn đề**: Chấp nhận tạo hóa đơn điều chỉnh giống hệt hóa đơn gốc khi các trường người mua gửi lên là `null`.
* **Giải pháp**: Cập nhật hàm `checkDataDifference` để so sánh trên dữ liệu người mua sau khi đã xử lý default (nếu input null thì lấy giá trị hóa đơn gốc), đảm bảo ngăn chặn việc tạo hóa đơn điều chỉnh giống hệt hóa đơn gốc.

### 4. Bổ sung kiểm tra NullPointerException hộ kinh doanh (P2)
* **Vấn đề**: Không kiểm tra null cho hộ kinh doanh của tài khoản thao tác gây crash hệ thống.
* **Giải pháp**: Thêm kiểm tra null hộ kinh doanh của người dùng trong `createAdjustmentInvoice` và ném lỗi `403 Forbidden` giống luồng của develop.

### 5. Chuẩn hóa mã tra cứu (P2)
* **Vấn đề**: Độ dài mã tra cứu sinh ra là 32 ký tự (sai quy chuẩn 10 ký tự của develop) và thiếu bước kiểm tra trùng lặp.
* **Giải pháp**: Chuyển sang sinh mã tra cứu ngẫu nhiên 10 ký tự và kiểm tra trùng lặp trong cơ sở dữ liệu bằng vòng lặp `do-while` giống nghiệp vụ phát hành hóa đơn.

### 6. Chặn sản phẩm không tồn tại (P2)
* **Vấn đề**: Tự động gán sản phẩm bằng `null` khi mã sản phẩm gửi lên không đúng.
* **Giải pháp**: Kiểm tra sự tồn tại của sản phẩm trong database, nếu chỉ định `productId` không hợp lệ, ném lỗi nghiệp vụ `PRODUCT_NOT_FOUND` ngay lập tức.

### 7. Khắc phục lỗi ghi log kép trên TOÀN BỘ luồng (P2)
* **Vấn đề**: Trigger CSDL `trg_log_invoice_status` tự động ghi nhận log khi cập nhật trạng thái hóa đơn. Việc viết lệnh Java `invoiceStatusLogRepository.save(...)` thủ công trong các phương thức cập nhật trạng thái gây ra trùng lặp log trong cơ sở dữ liệu.
* **Giải pháp**: 
  * Loại bỏ hoàn toàn dòng lệnh lưu log thủ công bằng Java cho hóa đơn gốc khi chuyển trạng thái sang `ADJUSTED`.
  * **Mới khắc phục bổ sung**: Xóa bỏ hoàn toàn mã nguồn lưu log trạng thái thủ công bằng Java trong cả 5 phương thức kế thừa từ nhánh `develop`:
    1. Gửi hóa đơn lên thuế (`submitToTax`)
    2. Gửi lại hóa đơn lỗi (`resendInvoice`)
    3. Hủy hóa đơn (`cancelInvoice`)
    4. Thuế duyệt cấp mã (`approveInvoiceByTax`)
    5. Thuế từ chối cấp mã (`rejectInvoiceByTax`)
  * Giờ đây, toàn bộ các luồng cập nhật trạng thái hóa đơn điện tử trong dự án đều được đảm bảo chỉ có duy nhất 1 dòng ghi log do DB Trigger kiểm soát, triệt tiêu hoàn toàn lỗi ghi log kép (Double Logging).

---

## II. Đánh Giá Chất Lượng Sau Khắc Phục (Scorecard)

| Tiêu chí review | Điểm cũ | Điểm mới | Trạng thái | Đánh giá |
| :--- | :---: | :---: | :---: | :--- |
| **Logic Nghiệp vụ** | 6 / 10 | **10 / 10** |  Đạt | Toàn bộ nghiệp vụ được bảo vệ chặt chẽ, không lỗi logic. |
| **Hiệu năng** | 9 / 10 | **10 / 10** |  Đạt | Tối ưu hóa N+1 query thông qua `@EntityGraph` trên cả 3 Backlogs. |
| **Bảo mật** | 9 / 10 | **10 / 10** |  Đạt | Phân quyền vai trò, cách ly nhân viên VT-02 và kiểm tra null hộ kinh doanh tốt. |
| **Code Quality** | 5 / 10 | **10 / 10** |  Đạt | Loại bỏ ghi log kép trên toàn bộ các phương thức cập nhật trạng thái hóa đơn. |
| **Git Hygiene** | 6 / 10 | **10 / 10** |  Đạt | Không còn code hack CSDL hay sửa schema động trong unit test. |
