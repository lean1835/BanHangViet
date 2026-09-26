# Bộ Dữ Liệu Mẫu 10.000 Bản Ghi (Import Data) - Bán Hàng Việt

Thư mục này chứa các tệp dữ liệu mẫu chuẩn gồm **10.000 bản ghi** cho 3 phân hệ cốt lõi: **Hàng hóa**, **Nhà cung cấp**, và **Khách hàng**, phục vụ cho việc kiểm thử hiệu năng (Stress Test), kiểm thử chức năng import Excel, cũng như demo tính năng phần mềm.

---

## 1. Danh sách tệp dữ liệu mẫu

| Phân hệ | Định dạng Excel (.xlsx) | Định dạng CSV (.csv) | Số bản ghi | Dung lượng (.xlsx) | Dung lượng (.csv) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Hàng hóa** | `import_10k_hang_hoa.xlsx` | `import_10k_hang_hoa.csv` | **10.000** | ~373 KB | ~1.0 MB |
| **Nhà cung cấp** | `import_10k_nha_cung_cap.xlsx` | `import_10k_nha_cung_cap.csv` | **10.000** | ~448 KB | ~1.9 MB |
| **Khách hàng** | `import_10k_khach_hang.xlsx` | `import_10k_khach_hang.csv` | **10.000** | ~466 KB | ~1.1 MB |

---

## 2. Đặc tả cấu trúc cột & Tiêu chuẩn dữ liệu

### 2.1. Hàng hóa (`Danh_Muc_Hang_Hoa`)
Khớp chính xác 100% với hàm `ExcelParserUtils.generateProductImportTemplate()` và `ProductImportServiceImpl`:
1. **Mã SKU**: Mã duy nhất từ `SP000001` đến `SP010000`.
2. **Tên hàng hóa**: Tên sản phẩm thực tế theo các ngành hàng (Đồ uống, Bánh kẹo, Gia vị, Thực phẩm khô, Hóa mỹ phẩm, Đồ gia dụng).
3. **Đơn vị tính**: Lon, Chai, Gói, Hộp, Túi, Cái, Can, Lốc, Vỉ, Tuýp.
4. **Giá bán**: Đơn giá bán lẻ từ 4.500 đến 189.000 VNĐ.
5. **% Thuế suất**: Thuế suất GTGT hợp lệ theo quy định (8%, 10%, 0%).
6. **Tên nhóm hàng**: Tự động liên kết hoặc tạo mới nhóm hàng trên hệ thống.
7. **Tồn ban đầu**: Số lượng tồn đầu kỳ (từ 50 đến 500).

### 2.2. Nhà cung cấp (`Danh_Muc_Nha_Cung_Cap`)
Khớp chính xác với `SupplierImportServiceImpl`:
1. **Tên nhà cung cấp (*)**: Doanh nghiệp phân phối, đại lý cấp 1 tại các tỉnh thành Việt Nam.
2. **Số điện thoại (*)**: 10 chữ số chuẩn Việt Nam (`082xxxxxxx`, không trùng lặp).
3. **Mã số thuế**: 10 chữ số hợp lệ theo định dạng doanh nghiệp Việt Nam.
4. **Email**: Email liên hệ đại diện.
5. **Địa chỉ**: Địa chỉ chi tiết kèm số nhà, tên đường, tỉnh/thành phố.
6. **Số dư nợ đầu kỳ (VNĐ)**: Số dư nợ phải trả ban đầu (0 hoặc từ 5.000.000 đến 50.000.000 VNĐ).
7. **Ghi chú**: Thông tin ghi chú đối tác.

### 2.3. Khách hàng (`Danh_Muc_Khach_Hang`)
Khớp chính xác với `CustomerImportServiceImpl`:
1. **Tên khách hàng (*)**: Họ tên khách hàng tiếng Việt đầy đủ.
2. **Số điện thoại (*)**: 10 chữ số chuẩn Việt Nam (`091xxxxxxx`, không trùng lặp).
3. **Mã số thuế**: Mã số thuế cá nhân / hộ kinh doanh (nếu có).
4. **Email**: Email liên hệ khách hàng.
5. **Địa chỉ**: Địa chỉ cư trú/giao hàng thực tế.
6. **Hạn mức nợ (VNĐ)**: Hạn mức mua nợ cho phép (từ 5.000.000 đến 18.500.000 VNĐ).
7. **Số dư nợ đầu kỳ (VNĐ)**: Nợ cũ cần thu (0 hoặc từ 500.000 đến 3.500.000 VNĐ).
8. **Kênh nhận HĐ (QR/EMAIL/ZALO)**: Kênh gửi hóa đơn điện tử ưu tiên.

---

## 3. Cách tạo lại dữ liệu mẫu với số lượng tùy ý

Bạn có thể chạy lại script sinh dữ liệu bất cứ lúc nào bằng lệnh:

```powershell
py scripts/generate_sample_import_data.py
```
