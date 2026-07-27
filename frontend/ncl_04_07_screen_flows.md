# 🖥️ Đặc Tả Luồng Đi Màn Hình Chi Tiết Cho Từng Phân Hệ & Vai Trò (NCL 04-07)

Tài liệu này chi tiết hóa luồng đi màn hình cho từng Phân hệ nghiệp vụ (**NCL-04, NCL-05, NCL-06, NCL-07**) tương ứng với vai trò của từng tác nhân (**Chủ hộ VT-01, Thu ngân VT-02, Kế toán VT-03, và Cơ quan thuế VT-05**).

---

## 1. NCL-04: PHÁT HÀNH HÓA ĐƠN & ĐỒNG BỘ THUẾ MÔ PHỎNG

Phân hệ này xử lý việc tạo hóa đơn nháp từ đơn hàng hoàn thành và quy trình duyệt cấp mã từ cơ quan thuế.

```
Luồng tổng quát:
Đơn Completed ──► [Tạo HĐ nháp DRAFT] ──► [Đẩy hàng đợi WAITING_TAX_CODE] ──► [CQT phê duyệt ISSUED / lỗi SEND_ERROR]
```

### Chi tiết luồng màn hình theo vai trò:

#### 1. Chủ hộ (VT-01) & Thu ngân (VT-02)
*   **Màn hình 1: Lịch sử đơn hàng ([OrderHistoryPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/order/pages/OrderHistoryPage.tsx))**
    *   Người dùng chọn một đơn hàng có trạng thái `Đã thanh toán (PAID)` và `Hoàn thành (COMPLETED)`.
    *   Trong bảng chi tiết đơn hàng ([OrderHistoryTable.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/order/components/OrderHistoryTable.tsx)), người dùng nhấn nút **"Phát hành hóa đơn"**.
    *   *Kết quả:* Gọi API backend sinh ra HĐĐT ở trạng thái nháp (`DRAFT`). Nút "Phát hành hóa đơn" biến đổi thành nút "Xem hóa đơn nháp".
*   **Màn hình 2: Quản lý hóa đơn (`InvoiceManagementPage.tsx`)**
    *   Người dùng truy cập màn hình qua menu "Hóa đơn". Tìm hóa đơn vừa tạo ở danh sách `Nháp (DRAFT)`.
    *   Nhấn nút **"Gửi Cơ quan Thuế"** tại cột hành động hoặc trong Drawer chi tiết hóa đơn.
    *   *Kết quả:* Hóa đơn chuyển trạng thái sang `Chờ cấp mã (WAITING_TAX_CODE)`.
*   **Màn hình 3: Gửi lại hóa đơn lỗi (`InvoiceManagementPage.tsx`)**
    *   Nếu hóa đơn bị từ chối cấp mã (`SEND_ERROR`), người dùng click nút **"Sửa thông tin"** trên Drawer để sửa lại tên/MST người mua bị sai.
    *   Nhấn nút **"Gửi lại thuế"**.
    *   *Kết quả:* Hóa đơn quay lại trạng thái `WAITING_TAX_CODE` để đưa vào hàng đợi gửi lại.

#### 2. Kế toán (VT-03)
*   Không tham gia luồng bán hàng ở POS, nhưng được quyền truy cập màn hình `InvoiceManagementPage.tsx` để xem danh sách hóa đơn `DRAFT` và thực hiện nhấn nút **"Gửi Cơ quan Thuế"** hoặc xử lý các hóa đơn gửi lỗi (`SEND_ERROR`).

#### 3. Cơ quan Thuế mô phỏng (VT-05)
*   **Màn hình: Cổng thông tin Thuế ([TaxInvoiceApprovalPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/tax_authority/pages/TaxInvoiceApprovalPage.tsx))**
    *   Cán bộ thuế đăng nhập, xem danh sách hóa đơn đang ở trạng thái `WAITING_TAX_CODE`.
    *   **Hành động duyệt:** Nhấn **"Duyệt cấp mã"** -> Nhập mã CQT hoặc sinh tự động -> Hệ thống chuyển trạng thái hóa đơn sang `Đã phát hành (ISSUED)` và cấp số hóa đơn tăng dần.
    *   **Hành động từ chối:** Nhấn **"Từ chối"** -> Nhập thông báo lỗi -> Hệ thống chuyển trạng thái hóa đơn sang `Lỗi gửi thuế (SEND_ERROR)`.

---

## 2. NCL-05: ĐIỀU CHỈNH, HỦY & TRA CỨU HÓA ĐƠN

Phân hệ này cho phép xử lý sai sót đối với các hóa đơn đã được cấp mã (`ISSUED`) hợp lệ, đảm bảo không xóa cứng dữ liệu.

### Chi tiết luồng màn hình theo vai trò:

#### 1. Chủ hộ (VT-01) & Kế toán (VT-03)
*   **Màn hình 1: Tra cứu hóa đơn (`InvoiceManagementPage.tsx`)**
    *   Tìm kiếm hóa đơn đã cấp mã (`ISSUED`) theo các bộ lọc: Từ ngày - Đến ngày, Mã tra cứu (`lookupCode`), Tên khách hàng.
    *   Click vào hóa đơn để mở **Drawer xem chi tiết hóa đơn**.
*   **Màn hình 2: Hủy hóa đơn (Cancel Invoice Dialog)**
    *   Trong Drawer chi tiết hóa đơn `ISSUED`, click nút **"Hủy hóa đơn"**.
    *   Hệ thống hiển thị hộp thoại popup, yêu cầu nhập bắt buộc **"Lý do hủy hóa đơn"** (Tối thiểu 10 ký tự).
    *   Click **"Xác nhận hủy"** -> Gọi API hủy -> Trạng thái hóa đơn chuyển sang `CANCELED`, cập nhật thông tin timeline hủy.
*   **Màn hình 3: Lập hóa đơn điều chỉnh (`AdjustInvoicePage.tsx` - Màn hình mới)**
    *   Trong Drawer chi tiết hóa đơn `ISSUED`, click nút **"Lập hóa đơn điều chỉnh"**.
    *   Hệ thống chuyển tới form điền thông tin điều chỉnh (cho phép sửa dòng hàng, tiền thuế...). Form có dòng chữ: *"Điều chỉnh cho hóa đơn gốc số: [Số HĐ gốc]"*.
    *   Click **"Phát hành hóa đơn điều chỉnh"** -> Hệ thống tạo một hóa đơn mới lưu `original_invoice_id` trỏ về hóa đơn cũ, chuyển hóa đơn cũ sang trạng thái `ADJUSTED`.

#### 2. Thu ngân / Nhân viên bán hàng (VT-02)
*   Được quyền vào màn hình `InvoiceManagementPage.tsx` để **Tra cứu và xem chi tiết hóa đơn** phục vụ cho việc giải đáp thắc mắc của khách hàng.
*   ❌ **Bị chặn hoàn toàn quyền Hủy và Điều chỉnh**: Các nút "Hủy hóa đơn" và "Lập hóa đơn điều chỉnh" sẽ bị ẩn trên giao diện Drawer chi tiết hóa đơn. Nếu cố tình gọi API qua công cụ ngoài sẽ bị backend chặn và trả về mã lỗi `403 FORBIDDEN` (`FORBIDDEN`).

---

## 3. NCL-06: KÊNH GỬI HÓA ĐƠN QUA QR/ZALO/EMAIL/IN

Phân hệ này chịu trách nhiệm đưa hóa đơn tới tay khách hàng cuối bằng nhiều hình thức khác nhau.

### Chi tiết luồng màn hình theo vai trò:

#### 1. Thu ngân (VT-02) & Chủ hộ (VT-01)
*   **Màn hình: Popup gửi hóa đơn nhanh tại quầy (Drawer Chi tiết hóa đơn)**
    *   Người dùng xem chi tiết một hóa đơn ở trạng thái `ISSUED` hoặc `ADJUSTED`.
    *   Hệ thống hiển thị danh sách các nút hành động:
        *   **"In hóa đơn"**: Mở hộp thoại Print của trình duyệt để in ra máy in nhiệt (khổ 80mm).
        *   **"Gửi Email"**: Mở popup nhập địa chỉ email -> Nhấn gửi -> Gọi dịch vụ SMTP gửi file hóa đơn PDF.
        *   **"Gửi Zalo"**: Mở popup nhập số điện thoại -> Hệ thống mô phỏng/gửi tin nhắn thông báo link hóa đơn.
        *   **"Hiện mã QR"**: Hiển thị popup chứa mã QR. Khách hàng quét mã này để dẫn tới trang tra cứu hóa đơn công khai.

#### 2. Khách hàng (Không cần đăng nhập)
*   **Màn hình: Cổng tra cứu hóa đơn công khai (`/public-lookup` hoặc `/tra-cuu`)**
    *   Khách hàng quét mã QR trên phiếu tính tiền hoặc truy cập địa chỉ website của cửa hàng.
    *   Nhập **Mã tra cứu hóa đơn (lookupCode)** in trên hóa đơn.
    *   *Kết quả:* Hệ thống hiển thị bản xem trước chi tiết của tờ hóa đơn điện tử (định dạng chuẩn A4 có đầy đủ Mẫu số, Ký hiệu, Tên người bán, thông tin thuế suất và mã Cơ quan Thuế).

---

## 4. NCL-07: BÁO CÁO DOANH THU & NHẬT KÝ HOẠT ĐỘNG

Thống kê tài chính cửa hàng và giám sát các hoạt động hệ thống.

### Chi tiết luồng màn hình theo vai trò:

#### 1. Chủ hộ (VT-01) & Kế toán (VT-03)
*   **Màn hình 1: Báo cáo Doanh thu ([RevenueReportPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueReportPage.tsx))**
    *   Người dùng chọn mốc thời gian (Tháng này, Quý này, Tùy chỉnh).
    *   Giao diện hiển thị các chỉ số: Tổng doanh số, tổng tiền hàng chưa thuế, tổng tiền thuế GTGT thu hộ, biểu đồ cột tăng trưởng doanh thu.
*   **Màn hình 2: Báo cáo So sánh doanh thu ([RevenueComparisonPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueComparisonPage.tsx))**
    *   Giao diện so sánh doanh thu trực quan giữa kỳ này với kỳ trước (tháng này so với tháng trước).
*   **Màn hình 3: Nhật ký hoạt động ([ActivityLogPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/ActivityLogPage.tsx))**
    *   Xem danh sách log hệ thống: Ai đã sửa giá sản phẩm, ai đã thực hiện hủy hóa đơn, chi tiết IP và trình duyệt của người dùng thao tác.

#### 2. Thu ngân / Nhân viên bán hàng (VT-02)
*   ❌ **Bị chặn quyền xem báo cáo**: Menu "Báo cáo" hoàn toàn bị ẩn trên Sidebar theo quy tắc ẩn trong [navigation.ts](file:///d:/Intern/Codegym/BanHangViet/frontend/src/constants/navigation.ts).
*   **Màn hình: Đối soát chốt ca bán hàng ([ShiftHistoryPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/shift/pages/ShiftHistoryPage.tsx))**
    *   Vào cuối ca, thu ngân thực hiện nhấn nút **"Đóng ca bán hàng"**.
    *   Nhập số tiền mặt thực tế kiểm đếm tại két -> Hệ thống đối chiếu tự động với tiền lý thuyết trên phần mềm (Doanh thu bán hàng từ hóa đơn phát hành trong ca) để chỉ ra chênh lệch (nếu có).
