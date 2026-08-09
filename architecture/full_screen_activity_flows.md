# 🖥️ ĐẶC TẢ SƠ ĐỒ LUỒNG HOẠT ĐỘNG TOÀN BỘ MÀN HÌNH (FULL SCREEN ACTIVITY FLOWS)

Tài liệu này tổng hợp **toàn bộ sơ đồ luồng hoạt động (Mermaid Diagrams)** và quy trình tương tác chi tiết từng bước cho **100% các màn hình, popup modal, drawer và luồng nghiệp vụ** trong hệ thống **Bán Hàng Việt**, được ánh xạ chính xác theo mã User Stories và Backlog NCL (`NCL-01-CN-001` đến `NCL-10-CN-003` tại `.huh/ptyc/Yêu cầu hệ thống (excel)`), đồng thời tuân thủ 100% các Quy tắc Nghiệp vụ (`QTN-01` đến `QTN-17`) và kết cấu mã nguồn Backend/Frontend thực tế.

---

## 📋 MỤC LỤC BẢN ĐỒ MÀN HÌNH

1. [Phân Hệ 1: Xác Thực & Quản Lý Tài Khoản (NCL-01)](#1-phân-hệ-1-xác-thực--quản-lý-tài-khoản-ncl-01)
   - [1.1 Màn hình Đăng Nhập (`/auth/login`)](#11-màn-hình-đăng-nhập-authlogin)
   - [1.2 Màn hình Đăng Ký Hộ Kinh Doanh (`/auth/register`)](#12-màn-hình-đăng-ký-hộ-kinh-doanh-authregister)
   - [1.3 Màn hình Quản Lý Nhân Viên & Phân Quyền (`/employees`)](#13-màn-hình-quản-lý-nhân-viên--phân-quyền-employees)
   - [1.4 Luồng Quản Lý Phiên Đăng Nhập & Hết Hạn Token (`/auth/*`)](#14-luồng-quản-lý-phiên-đăng-nhập--hết-hạn-token-auth)
2. [Phân Hệ 2: Quản Lý Hàng Hóa & Tồn Kho (NCL-02, NCL-09)](#2-phân-hệ-2-quản-lý-hàng-hóa--tồn-kho-ncl-02-ncl-09)
   - [2.1 Màn hình Danh Mục Hàng Hóa & Nhập từ Excel (`/products`)](#21-màn-hình-danh-mục-hàng-hóa--nhập-từ-excel-products)
   - [2.2 Màn hình & Modal Quản Lý Nhóm Hàng (`/products`)](#22-màn-hình--modal-quản-lý-nhóm-hàng-products)
   - [2.3 Màn hình Phiếu Nhập Kho (`/products/stock-entry`)](#23-màn-hình-phiếu-nhập-kho-productsstock-entry)
3. [Phân Hệ 3: Bán Hàng POS, Ca Làm Việc & Đồng Bộ Offline (NCL-03, NCL-07, NCL-08)](#3-phân-hệ-3-bán-hàng-pos-ca-làm-việc--đồng-bộ-offline-ncl-03-ncl-07-ncl-08)
   - [3.1 Màn hình Bán Hàng Tại Quầy POS (`/pos`)](#31-màn-hình-bán-hàng-tại-quầy-pos-pos)
   - [3.2 Màn hình Mở/Đóng Ca & Lịch Sử Ca Làm Việc (`/shifts`)](#32-màn-hình-mởđóng-ca--lịch-sử-ca-làm-việc-shifts)
   - [3.3 Màn hình & Sơ đồ Bán Hàng Offline & Đồng Bộ Dữ Liệu (`/pos`, `/sync`)](#33-màn-hình--sơ-đồ-bán-hàng-offline--đồng-bộ-dữ-liệu-pos-sync)
   - [3.4 Luồng Bán Hàng trên Máy Tính Bảng & Điện Thoại (`/pos`)](#34-luồng-bán-hàng-trên-máy-tính-bảng--điện-thoại-pos)
4. [Phân Hệ 4: Quản Lý Đơn Hàng Bán Lẻ (NCL-03, NCL-04)](#4-phân-hệ-4-quản-lý-đơn-hàng-bán-lẻ-ncl-03-ncl-04)
   - [4.1 Màn hình Lịch Sử Đơn Hàng (`/orders`)](#41-màn-hình-lịch-sử-đơn-hàng-orders)
5. [Phân Hệ 5: Hóa Đơn Điện Tử & Thuế (NCL-04, NCL-05)](#5-phân-hệ-5-hóa-đơn-điện-tử--thuế-ncl-04-ncl-05)
   - [5.1 Màn hình Quản Lý Hóa Đơn Điện Tử (`/e-invoices`)](#51-màn-hình-quản-lý-hóa-đơn-điện-tử-e-invoices)
   - [5.2 Màn hình Lập Hóa Đơn Điều Chỉnh (`/e-invoices/:id/adjust`)](#52-màn-hình-lập-hóa-đơn-điều-chỉnh-e-invoicesidadjust)
6. [Phân Hệ 6: Kênh Gửi & Tra Cứu Hóa Đơn (NCL-06)](#6-phân-hệ-6-kênh-gửi--tra-cứu-hóa-đơn-ncl-06)
   - [6.1 Popup Gửi Hóa Đơn Đa Kênh & Tra Cứu Công Khai (`/lookup-invoice`)](#61-popup-gửi-hóa-đơn-đa-kênh--tra-cứu-công-khai-lookup-invoice)
7. [Phân Hệ 7: Báo Cáo, Nhật Ký & Dashboard (NCL-07)](#7-phân-hệ-7-báo-cáo-nhật-ký--dashboard-ncl-07)
   - [7.1 Màn hình Báo Cáo Doanh Thu Theo Ngày & Mặt Hàng (`/reports/revenue`)](#71-màn-hình-báo-cáo-doanh-thu-theo-ngày--mặt-hàng-reportsrevenue)
   - [7.2 Màn hình Báo Cáo So Sánh Doanh Thu Giữa Các Kỳ (`/reports/comparison`)](#72-màn-hình-báo-cáo-so-sánh-doanh-thu-giữa-các-kỳ-reportscomparison)
   - [7.3 Màn hình Báo Cáo Đối Chiếu Tiền & Doanh Thu Cuối Ngày (`/reports/reconciliation`)](#73-màn-hình-báo-cáo-đối-chiếu-tiền--doanh-thu-cuối-ngày-reportsreconciliation)
   - [7.4 Màn hình Thống Kê Mặt Hàng Bán Chạy (`/reports/top-selling`)](#74-màn-hình-thống-kê-mặt-hàng-bán-chạy-reportstop-selling)
   - [7.5 Màn hình Nhật Ký Hoạt Động (`/reports/activity-logs`)](#75-màn-hình-nhật-ký-hoạt-động-reportsactivity-logs)
   - [7.6 Màn hình Bảng Điều Khiển Doanh Thu Tổng Quan Dashboard (`/dashboard`)](#76-màn-hình-bảng-điều-khiển-doanh-thu-tổng-quan-dashboard-dashboard)
8. [Phân Hệ 8: Quản Lý Khách Hàng & Công Nợ (NCL-10)](#8-phân-hệ-8-quản-lý-khách-hàng--công-nợ-ncl-10)
   - [8.1 Màn hình Quản Lý Khách Hàng (`/customers`)](#81-màn-hình-quản-lý-khách-hàng-customers)
   - [8.2 Màn hình Thu Nợ & Nhắc Nợ Khách Hàng (`/customers`, `/debts`)](#82-màn-hình-thu-nợ--nhắc-nợ-khách-hàng-customers-debts)
9. [Phân Hệ 9: Cấu Hình Cửa Hàng & Dữ Liệu (NCL-09)](#9-phân-hệ-9-cấu-hình-cửa-hàng--dữ-liệu-ncl-09)
   - [9.1 Màn hình Thông Tin Hộ Kinh Doanh (`/settings/business-info`)](#91-màn-hình-thông-tin-hộ-kinh-doanh-settingsbusiness-info)
   - [9.2 Màn hình Cấu Hình Mẫu Hóa Đơn & Chữ Ký Số (`/settings/invoice-template`)](#92-màn-hình-cấu-hình-mẫu-hóa-đơn--chữ-ký-số-settingsinvoice-template)
   - [9.3 Màn hình Thuế Suất Đang Hiệu Lực (`/settings/tax-rates`)](#93-màn-hình-thuế-suất-đang-hiệu-lực-settingstax-rates)
   - [9.4 Màn hình Sao Lưu & Xuất Dữ Liệu Danh Mục (`/settings/backup-export`)](#94-màn-hình-sao-lưu--xuất-dữ-liệu-danh-mục-settingsbackup-export)
   - [9.5 Màn hình Cấu Hình Máy In Hóa Đơn (`/settings/printer`)](#95-màn-hình-cấu-hình-máy-in-hóa-đơn-settingsprinter)
10. [Phân Hệ 10: Workspace Platform Admin (Admin Nền Tảng)](#10-phân-hệ-10-workspace-platform-admin-admin-nền-tảng)
    - [10.1 Màn hình Bảng Điều Khiển Tổng Quan Admin (`/admin/overview`)](#101-màn-hình-bảng-điều-khiển-tổng-quan-admin-adminoverview)
    - [10.2 Màn hình Quản Lý Hộ Kinh Doanh (`/admin/households`)](#102-màn-hình-quản-lý-hộ-kinh-doanh-adminhouseholds)
    - [10.3 Màn hình Nhật Ký Hệ Thống Admin (`/admin/logs`)](#103-màn-hình-nhật-ký-hệ-thống-admin-adminlogs)
11. [Phân Hệ 11: Workspace Cơ Quan Thuế Mô Phỏng (Tax Authority)](#11-phân-hệ-11-workspace-cơ-quan-thuế-mô-phỏng-tax-authority)
    - [11.1 Cổng Duyệt Cấp Mã Hóa Đơn Điện Tử Cục Thuế (`/tax-authority/invoices`)](#111-cổng-duyệt-cấp-mã-hóa-đơn-điện-tử-cục-thuế-tax-authorityinvoices)
12. [📌 Tổng Kết Bảng Ánh Xạ Màn Hình & Backlog (Summary Matrix)](#-tổng-kết-bảng-ánh-xạ-màn-hình--backlog-summary-matrix)

---

## 1. PHÂN HỆ 1: XÁC THỰC & QUẢN LÝ TÀI KHOẢN (NCL-01)

### 1.1 Màn hình Đăng Nhập (`/auth/login`)
- **Route**: `/auth/login` | **Component**: [LoginPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/auth/pages/LoginPage.tsx)
- **Vai trò**: Tất cả người dùng (Chủ hộ, Thu ngân, Kế toán, Admin, Cán bộ Thuế).
- **Mã Backlog**: `NCL-01-CN-002`

```mermaid
flowchart TD
    Start[User truy cập /auth/login] --> InputForm[Nhập Username & Password]
    InputForm --> ClickLogin[Bấm nút 'Đăng nhập']
    ClickLogin --> ValidateInput{Validate Form Client?}
    ValidateInput -- Không hợp lệ --> ShowClientErr[Hiển thị lỗi Validation đỏ]
    ValidateInput -- Hợp lệ --> CallAPI[POST /api/v1/auth/login]
    CallAPI --> CheckAPI{Response Backend?}
    CheckAPI -- 401 Unauthorized --> ShowToastErr[Hiển thị Toast lỗi Sai mật khẩu / Tài khoản bị khóa]
    CheckAPI -- 200 OK --> SaveToken[Lưu AccessToken & UserInfo vào LocalStorage + Redux authSlice]
    SaveToken --> CheckRole{Kiểm tra Vai trò RoleCode}
    CheckRole -- normal_management / owner --> GoDashboard[Chuyển hướng /dashboard]
    CheckRole -- point_of_sale --> GoPOS[Chuyển hướng /pos]
    CheckRole -- platform_admin --> GoAdmin[Chuyển hướng /admin/overview]
    CheckRole -- tax_authority --> GoTax[Chuyển hướng /tax-authority/invoices]
```

---

### 1.2 Màn hình Đăng Ký Hộ Kinh Doanh (`/auth/register`)
- **Route**: `/auth/register` | **Component**: [RegisterPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/auth/pages/RegisterPage.tsx)
- **Vai trò**: Chủ hộ kinh doanh mới.
- **Mã Backlog**: `NCL-01-CN-001`, `QTN-01`

```mermaid
sequenceDiagram
    autonumber
    actor User as Chủ hộ mới
    participant UI as RegisterPage.tsx
    participant AuthAPI as POST /api/v1/auth/register
    participant DB as Database

    User->>UI: Điền Tên Hộ, MST (10/13 số), Tên chủ hộ, Số điện thoại, Username, Password
    UI->>UI: Validate Client (Zod Schema)
    alt Lỗi định dạng MST / Mật khẩu yếu
        UI-->>User: Hiển thị dòng thông báo đỏ dưới input
    else Thông tin hợp lệ
        UI->>AuthAPI: Call API tạo Hộ Kinh Doanh mới
        AuthAPI->>DB: Kiểm tra trùng MST / Username -> Tạo Hộ & Tài khoản Admin Hộ (QTN-01)
        alt MST hoặc Username đã tồn tại
            DB-->>AuthAPI: Duplicate Key Exception
            AuthAPI-->>UI: 400 Bad Request (ApiResponse.error)
            UI-->>User: Toast: Mã số thuế hoặc Username đã đăng ký
        else Đăng ký thành công
            DB-->>AuthAPI: Created Household Record
            AuthAPI-->>UI: 201 Created (Token + AuthResponse)
            UI-->>User: Toast thành công + Chuyển hướng sang /dashboard
        end
    end
```

---

### 1.3 Màn hình Quản Lý Nhân Viên & Phân Quyền (`/employees`)
- **Route**: `/employees` | **Component**: [EmployeePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/employee/pages/EmployeePage.tsx)
- **Vai trò**: Chủ hộ kinh doanh (`normal_management`).
- **Mã Backlog**: `NCL-01-CN-003`, `NCL-01-CN-004`

```mermaid
flowchart TD
    Start[Vào trang /employees] --> LoadList[GET /api/v1/employees]
    LoadList --> RenderTable[Render Bảng Nhân Viên & Vai Trò]
    
    RenderTable --> ClickAdd[Bấm '+ Thêm Nhân Viên']
    ClickAdd --> OpenAddModal[Mở EmployeeFormModal]
    OpenAddModal --> SubmitAdd[Điền Họ tên, Username, Role: Thu ngân / Kế toán -> Click Lưu]
    SubmitAdd --> CallAPIAdd[POST /api/v1/employees]
    CallAPIAdd --> RefreshAdd[RTK Query invalidateTags -> Tự động nạp lại danh sách]

    RenderTable --> ClickStatus[Bấm công tắc Khóa/Mở Khóa]
    ClickStatus --> CallAPIStatus[DELETE/PUT /api/v1/employees/{id}]
    CallAPIStatus --> ToastStatus[Toast: Đã đổi trạng thái tài khoản thành công]
```

---

### 1.4 Luồng Quản Lý Phiên Đăng Nhập & Hết Hạn Token (`/auth/*`)
- **Route**: Tất cả private routes | **Component**: [PrivateRoute.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/routers/guards/PrivateRoute.tsx), `apiClient` Interceptor
- **Vai trò**: Tất cả người dùng đã đăng nhập.
- **Mã Backlog**: `NCL-01-CN-002`

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Frontend App (RTK Query / Axios Interceptor)
    participant AuthAPI as POST /api/v1/auth/refresh-token
    participant DB as Database

    User->>UI: Thao tác trên giao diện (ví dụ: Tạo đơn / Xóa nhân viên)
    UI->>UI: Đính kèm Header Authorization: Bearer <AccessToken>
    alt AccessToken còn hiệu lực (chưa hết hạn)
        UI->>DB: Thực thi Request thành công (200 OK)
    else AccessToken hết hạn (HTTP 401 Unauthorized)
        UI->>AuthAPI: Gọi API Refresh Token tự động (gửi RefreshToken)
        alt RefreshToken còn hạn
            AuthAPI->>DB: Kiểm tra RefreshToken hợp lệ
            AuthAPI-->>UI: 200 OK (AccessToken mới + RefreshToken mới)
            UI->>UI: Lưu AccessToken mới & Retry lại API request ban đầu
            UI-->>User: Giao diện cập nhật mượt mà không bị ngắt kết nối
        else RefreshToken hết hạn / Không hợp lệ
            AuthAPI-->>UI: 401 Unauthorized / 403 Forbidden
            UI->>UI: Xóa Token trong LocalStorage + Dispatch authSlice.logout()
            UI-->>User: Hiển thị Toast "Phiên đăng nhập hết hạn" & Chuyển hướng về /auth/login
        end
    end
```

---

## 2. PHÂN HỆ 2: QUẢN LÝ HÀNG HÓA & TỒN KHO (NCL-02, NCL-09)

### 2.1 Màn hình Danh Mục Hàng Hóa & Nhập từ Excel (`/products`)
- **Route**: `/products` | **Component**: [ProductListPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/pages/ProductListPage.tsx)
- **Mã Backlog**: `NCL-02-CN-001`, `NCL-02-CN-002`, `NCL-02-CN-004`, `NCL-09-CN-005`

```mermaid
flowchart TD
    Start[Truy cập /products] --> FetchProducts[GET /api/v1/products kèm filter & search]
    FetchProducts --> ShowGrid[Hiển thị Bảng Hàng hóa: SKU, Tên, ĐVT, Giá bán, Tồn kho, Thuế]
    
    ShowGrid --> ActionAdd[Bấm '+ Thêm sản phẩm']
    ActionAdd --> OpenModal[Mở ProductFormModal]
    OpenModal --> FillData[Nhập Mã vạch SKU, Tên, Nhóm hàng, Giá bán, Giá vốn, Thuế suất VAT0-10%]
    FillData --> SaveProd[POST /api/v1/products]
    SaveProd --> ToastSuccess[Toast: Đã thêm sản phẩm thành công!]

    ShowGrid --> ActionImport[Bấm 'Nhập từ Excel']
    ActionImport --> OpenImportModal[Mở ImportProductsModal]
    OpenImportModal --> DownloadTemplate[GET /api/v1/products/import-template -> Tải file mẫu .xlsx]
    OpenImportModal --> UploadFile[Tải file Excel lên]
    UploadFile --> ValidateExcel{Backend parse & validate file?}
    ValidateExcel -- Lỗi dòng data --> ShowErrorList[Hiển thị danh sách các dòng bị lỗi chi tiết]
    ValidateExcel -- Thành công --> ImportSuccess[POST /api/v1/products/import -> Đã nhập N sản phẩm]
```

---

### 2.2 Màn hình & Modal Quản Lý Nhóm Hàng (`/products`)
- **Route**: `/products` | **Component**: [ProductGroupManagerModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/components/ProductGroupManagerModal.tsx), [ProductGroupController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/ProductGroupController.java)
- **Mã Backlog**: `NCL-02-CN-003`

```mermaid
flowchart TD
    Start[Bấm 'Quản lý Nhóm Hàng' tại ProductListPage] --> OpenGroupModal[Mở Modal ProductGroupManagerModal]
    OpenGroupModal --> FetchGroups[GET /api/v1/product-groups]
    FetchGroups --> RenderGroupList[Hiển thị Danh sách Nhóm hàng: Tên nhóm, Mô tả]
    
    RenderGroupList --> AddGroup[Nhập Tên Nhóm mới -> Bấm 'Thêm Nhóm']
    AddGroup --> CallAddAPI[POST /api/v1/product-groups]
    CallAddAPI --> RefreshAdd[Tự động nạp lại danh sách Nhóm]

    RenderGroupList --> EditGroup[Sửa Tên/Mô tả Nhóm -> Click 'Lưu']
    EditGroup --> CallUpdateAPI[PUT /api/v1/product-groups/{id}]

    RenderGroupList --> DeleteGroup[Bấm 'Xóa Nhóm']
    DeleteGroup --> CallDeleteAPI[DELETE /api/v1/product-groups/{id}]
    CallDeleteAPI --> ToastGroup[Toast: Đã cập nhật danh mục nhóm hàng thành công]
```

---

### 2.3 Màn hình Phiếu Nhập Kho (`/products/stock-entry`)
- **Route**: `/products/stock-entry` | **Components**: [StockEntryPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/product/pages/StockEntryPage.tsx), [GoodsReceiptController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/GoodsReceiptController.java)
- **Mã Backlog**: `NCL-02-CN-005`

```mermaid
sequenceDiagram
    autonumber
    actor User as Chủ hộ / Quản lý kho
    participant UI as StockEntryPage / GoodsReceiptModal
    participant API as POST /api/v1/goods-receipts
    participant DB as Database (Products & StockLogs)

    User->>UI: Bấm "Tạo Phiếu Nhập Kho"
    User->>UI: Chọn Nhà cung cấp + Chọn danh sách Sản phẩm & Nhập số lượng + Đơn giá nhập
    UI->>UI: Tự động tính Tổng tiền nhập kho
    User->>UI: Bấm "Hoàn tất Nhập Kho"
    UI->>API: Send GoodsReceipt Request Payload
    API->>DB: @Transactional: Lưu Phiếu nhập + Cộng tăng Tồn kho + Tính giá vốn
    DB-->>API: Success Response
    API-->>UI: ApiResponse(GoodsReceiptResponse)
    UI-->>User: Toast thành công + Cập nhật số lượng tồn kho tức thời
```

---

## 3. PHÂN HỆ 3: BÁN HÀNG POS, CA LÀM VIỆC & ĐỒNG BỘ OFFLINE (NCL-03, NCL-07, NCL-08)

### 3.1 Màn hình Bán Hàng Tại Quầy POS (`/pos`)
- **Route**: `/pos` | **Component**: [PosPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/pos/pages/PosPage.tsx)
- **Vai trò**: Thu ngân (`point_of_sale`), Chủ hộ (`normal_management`).
- **Mã Backlog**: `NCL-03-CN-001`, `NCL-03-CN-002`, `NCL-03-CN-003`, `NCL-03-CN-004`, `NCL-03-CN-005`, `QTN-07`, `QTN-08`

```mermaid
flowchart TD
    Start[Truy cập /pos] --> CheckShift{Kiểm tra Ca bán hàng hiện tại?}
    CheckShift -- Chưa có Ca Mở --> ForceOpenShift[Mở Modal StartShiftModal: Bắt buộc nhập tiền đầu ca - QTN-15]
    ForceOpenShift --> ShiftOpened[Mở Ca thành công -> Vào Màn hình POS]
    CheckShift -- Đã có Ca Mở --> IntoPOS[Vào Màn hình POS Split-View]
    
    IntoPOS --> SearchProduct[Gõ tên / Quét mã vạch Barcode F1 - NCL-03-CN-001]
    SearchProduct --> AddToCart[Thêm sản phẩm vào Giỏ hàng - NCL-03-CN-002]
    AddToCart --> EditQty[Tăng/giảm số lượng / Nhập giảm giá đơn hàng - NCL-03-CN-003]
    
    AddToCart --> CheckStock{Số lượng vượt số tồn kho? - QTN-08}
    CheckStock -- Đúng vượt tồn --> ShowStockWarning[Cảnh báo Vượt tồn kho -> Hỏi ý kiến cho phép bán tiếp]
    CheckStock -- Bình thường / Cho phép bán tiếp --> SelectCustomer[Chọn Khách hàng / Thêm khách mới F3]
    
    SelectCustomer --> ClickPay[Bấm Nút 'F2 - THANH TOÁN' màu cam]
    
    ClickPay --> OpenPayModal[Mở PosPaymentModal - NCL-03-CN-004]
    OpenPayModal --> ChooseMethod{Phương thức Thanh toán F4}
    ChooseMethod -- Tiền mặt --> CashPay[Nhập Tiền khách đưa -> Tự động tính Tiền thừa trả khách]
    ChooseMethod -- Chuyển khoản QR --> QRPay[Hiển thị Mã VietQR động -> Đợi khách quét chuyển khoản]
    
    CashPay & QRPay --> ConfirmOrder[POST /api/v1/orders - NCL-03-CN-005, QTN-07]
    ConfirmOrder --> PrintReceipt[Mở Modal In Phiếu Tính Tiền / In Nhiệt 80mm]
    PrintReceipt --> ResetPos[Làm sạch Giỏ hàng -> Sẵn sàng cho đơn mới]
```

---

### 3.2 Màn hình Mở/Đóng Ca & Lịch Sử Ca Làm Việc (`/shifts`)
- **Route**: `/shifts` | **Components**: [ShiftHistoryPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/shift/pages/ShiftHistoryPage.tsx), [ShiftController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/ShiftController.java)
- **Mã Backlog**: `NCL-03-CN-006`, `NCL-03-CN-007`, `QTN-15`, `QTN-16`

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as Thu ngân (VT-02)
    participant UI as ShiftHistoryPage / CloseShiftModal
    participant ShiftAPI as POST /api/v1/shifts/{id}/close
    participant DB as Database

    Cashier->>UI: Bấm nút "Đóng ca làm việc" cuối ca
    UI->>UI: Hiển thị Tổng doanh thu tiền mặt lý thuyết trên máy
    Cashier->>UI: Nhập Số tiền mặt thực tế kiểm đếm tại két
    UI->>UI: Tính toán Tự động: Chênh lệch = Thực tế - Lý thuyết
    alt Có chênh lệch (Thực tế != Lý thuyết)
        UI-->>Cashier: Yêu cầu nhập Ghi chú giải trình chênh lệch (QTN-16)
    end
    Cashier->>UI: Bấm "Xác nhận Đóng ca"
    UI->>ShiftAPI: Call CloseShiftRequest
    ShiftAPI->>DB: Cập nhật Trạng thái Ca = CLOSED, Lưu thời gian kết thúc & Chênh lệch (QTN-16)
    DB-->>ShiftAPI: Shift Closed Record
    ShiftAPI-->>UI: ApiResponse(ShiftResponse)
    UI-->>Cashier: In Phiếu Báo Cáo Chốt Ca & Đăng xuất / Khóa POS
```

---

### 3.3 Màn hình & Sơ đồ Bán Hàng Offline & Đồng Bộ Dữ Liệu (`/pos`, `/sync`)
- **Route**: `/pos` | **Components**: [PosPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/pos/pages/PosPage.tsx), [ConflictResolutionModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/sync/components/ConflictResolutionModal.tsx), [SyncController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/SyncController.java)
- **Vai trò**: Thu ngân (`point_of_sale`), Chủ hộ (`normal_management`).
- **Mã Backlog**: `NCL-08-CN-001`, `NCL-08-CN-002`, `NCL-08-CN-003`, `QTN-11`

#### 3.3.1 Luồng Bán Hàng Khi Mất Mạng (Offline POS Mode - NCL-08-CN-001)
```mermaid
sequenceDiagram
    autonumber
    actor Cashier as Thu ngân (VT-02)
    participant UI as PosPage.tsx (Offline State)
    participant IDB as Browser IndexedDB Queue
    
    Note over Cashier, UI: Hệ thống mất kết nối Internet (navigator.onLine = false)
    Cashier->>UI: Chọn mặt hàng vào giỏ + Bấm "F2 - THANH TOÁN"
    UI->>UI: Kiểm tra Trạng thái Mạng -> Phát hiện MẤT MẠNG
    UI->>IDB: Sinh UUID tạm + Lưu Đơn hàng vào Hàng đợi IndexedDB (`sync_status = PENDING`)
    IDB-->>UI: Đã lưu đơn hàng cục bộ
    UI-->>Cashier: Toast: Đã lưu đơn bán Offline! Đơn sẽ tự động đồng bộ khi có mạng lại.
    UI->>UI: In Phiếu Tính Tiền tạm + Làm sạch giỏ hàng sẵn sàng bán đơn mới
```

#### 3.3.2 Luồng Phục Hồi Kết Nối & Đồng Bộ Dữ Liệu (Data Sync & Conflict Resolution - NCL-08-CN-002, NCL-08-CN-003)
```mermaid
flowchart TD
    Start[Thiết bị có kết nối Mạng trở lại] --> HealthCheck[GET /api/v1/sync/health]
    HealthCheck --> CheckPending{Kiểm tra IndexedDB có đơn PENDING?}
    CheckPending -- Không --> NormalOnline[Bán hàng Online bình thường]
    CheckPending -- Có --> CallCheckAPI[POST /api/v1/sync/check: Kiểm tra xung đột tồn kho & giá]
    
    CallCheckAPI --> ConflictCheck{Backend trả về Xung đột?}
    ConflictCheck -- Không có xung đột --> BulkUpload[POST /api/v1/sync/bulk-upload]
    BulkUpload --> SaveDB[Tạo các Đơn hàng chính thức + Trừ Tồn kho + Sinh Hóa đơn DRAFT]
    SaveDB --> ClearIDB[Xóa các đơn đã đồng bộ khỏi IndexedDB]
    ClearIDB --> ToastSyncSuccess[Toast: Đồng bộ thành công N đơn bán hàng Offline!]

    ConflictCheck -- Có đơn bị xung đột --> OpenConflictModal[Mở Modal Giải Quyết Xung Đột ConflictResolutionModal]
    OpenConflictModal --> ChooseResolve[Chủ hộ chọn: Đè dữ liệu Offline hay Hủy đơn Offline]
    ChooseResolve --> CallResolveAPI[POST /api/v1/sync/resolve]
    CallResolveAPI --> RefreshSync[Hoàn tất đồng bộ đơn xung đột -> Cập nhật bảng kê]
```

---

### 3.4 Luồng Bán Hàng trên Máy Tính Bảng & Điện Thoại (`/pos`)
- **Route**: `/pos` | **Component**: [PosPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/pos/pages/PosPage.tsx) (Mobile Responsive View)
- **Vai trò**: Thu ngân di động (`point_of_sale`).
- **Mã Backlog**: `NCL-03-CN-008`

```mermaid
flowchart TD
    Start[Thu ngân truy cập /pos trên Điện thoại / Tablet] --> CheckDevice{Kiểm tra Kích thước Màn hình}
    CheckDevice --> AdaptLayout[Tự động chuyển Bố cục Touch-Optimized Layout: Nút bấm phóng to, Giỏ hàng dạng Drawer trượt]
    
    AdaptLayout --> TouchSearch[Chạm ô Tìm nhanh / Bật Camera quét mã vạch Barcode]
    TouchSearch --> AddItem[Thêm Sản phẩm vào Giỏ hàng di động]
    AddItem --> OpenCartDrawer[Vuốt lên để xem Chi tiết Giỏ hàng & Điền giảm giá]
    
    OpenCartDrawer --> ClickPayMobile[Bấm Nút 'THANH TOÁN' cố định chân màn hình Sticky Footer]
    ClickPayMobile --> MobilePayModal[Mở Modal Thanh toán di động]
    MobilePayModal --> ConfirmPay[Chọn Tiền mặt / VietQR -> POST /api/v1/orders]
    ConfirmPay --> SuccessPrint[Hiển thị OrderSuccessModal + Gửi HĐ qua Zalo / In Bluetooth POS Printer]
```

---

## 4. PHÂN HỆ 4: QUẢN LÝ ĐƠN HÀNG BÁN LẺ (NCL-03, NCL-04)

### 4.1 Màn hình Lịch Sử Đơn Hàng (`/orders`)
- **Route**: `/orders` | **Component**: [OrderHistoryPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/order/pages/OrderHistoryPage.tsx)
- **Mã Backlog**: `NCL-03-CN-005`, `NCL-04-CN-001`, `QTN-03`

```mermaid
flowchart TD
    Start[Truy cập /orders] --> FetchOrders[GET /api/v1/orders]
    FetchOrders --> RenderTable[Hiển thị Bảng Lịch sử Đơn hàng]
    
    RenderTable --> ViewDetail[Click Dòng đơn hàng]
    ViewDetail --> OpenDrawer[Mở OrderDetailDrawer: Xem danh sách sản phẩm, Thuế GTGT, Khách hàng]
    
    RenderTable --> ClickIssue[Bấm nút 'Phát hành Hóa đơn']
    ClickIssue --> CheckStatus{Đơn trạng thái COMPLETED & PAID? - QTN-03}
    CheckStatus -- Sai --> BlockIssue[Hiển thị lỗi: Đơn chưa thanh toán đủ không được xuất HĐ - QTN-03]
    CheckStatus -- Đúng --> CallIssueAPI[POST /api/v1/invoices/draft]
    CallIssueAPI --> CreatedDraft[Tạo Hóa đơn điện tử Nháp DRAFT thành công]
    CreatedDraft --> ToastIssued[Toast: Đã sinh HĐĐT Nháp -> Nút đổi thành 'Xem Hóa Đơn']
```

---

## 5. PHÂN HỆ 5: HÓA ĐƠN ĐIỆN TỬ & THUẾ (NCL-04, NCL-05)

### 5.1 Màn hình Quản Lý Hóa Đơn Điện Tử (`/e-invoices`)
- **Route**: `/e-invoices` | **Component**: [InvoiceManagementPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/pages/InvoiceManagementPage.tsx)
- **Mã Backlog**: `NCL-04-CN-002` đến `NCL-04-CN-005`, `NCL-05-CN-001`, `NCL-05-CN-003`, `NCL-05-CN-004`, `QTN-05`, `QTN-06`, `QTN-09`

```mermaid
flowchart TD
    Start[Truy cập /e-invoices] --> FetchInvoices[GET /api/v1/invoices]
    FetchInvoices --> RenderTabs[Tabs: Tất cả | Nháp DRAFT | Chờ cấp mã WAITING | Đã phát hành ISSUED | Lỗi SEND_ERROR | Hủy CANCELED]
    
    RenderTabs --> ActionSendTax[Bấm 'Gửi Cơ quan Thuế' ở HĐ DRAFT]
    ActionSendTax --> CallSendAPI[POST /api/v1/invoices/{id}/submit]
    CallSendAPI --> StatusWaiting[Hóa đơn chuyển trạng thái WAITING_TAX_CODE -> Đẩy vào Hàng đợi đồng bộ]

    RenderTabs --> ActionResend[Bấm 'Gửi Lại' ở HĐ SEND_ERROR - QTN-06]
    ActionResend --> CallResendAPI[POST /api/v1/invoices/{id}/resend]
    CallResendAPI --> StatusWaiting2[Hóa đơn gửi lại thành công -> Chuyển về WAITING_TAX_CODE - QTN-06]

    RenderTabs --> ActionCancel[Bấm 'Hủy Hóa đơn' ở HĐ ISSUED]
    ActionCancel --> OpenCancelDialog[Mở CancelInvoiceModal: Yêu cầu bắt buộc nhập Lý do hủy >= 10 ký tự - QTN-05]
    OpenCancelDialog --> SubmitCancel[POST /api/v1/invoices/{id}/cancel]
    SubmitCancel --> StatusCanceled[Hóa đơn chuyển trạng thái CANCELED -> Lưu vết lý do & thời gian - QTN-09]

    RenderTabs --> ActionView[Click Dòng Hóa đơn]
    ActionView --> OpenInvoiceView[Mở InvoiceDetailModal: Xem Tờ Hóa Đơn A4 có Mẫu số, Ký hiệu, Mã CQT, QR Tra cứu]
```

---

### 5.2 Màn hình Lập Hóa Đơn Điều Chỉnh (`/e-invoices/:id/adjust`)
- **Route**: `/e-invoices/:id/adjust` | **Component**: [AdjustInvoicePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/pages/AdjustInvoicePage.tsx)
- **Mã Backlog**: `NCL-05-CN-002`, `QTN-04`, `QTN-12`

```mermaid
sequenceDiagram
    autonumber
    actor User as Chủ hộ / Kế toán
    participant UI as AdjustInvoicePage.tsx
    participant API as POST /api/v1/invoices/{id}/adjust
    participant DB as Database

    User->>UI: Truy cập từ nút "Điều chỉnh Hóa đơn" trên Hóa đơn ISSUED gốc (QTN-04)
    UI->>UI: Nạp thông tin Hóa đơn gốc (Hiển thị tiêu đề: Điều chỉnh cho HĐ số X)
    User->>UI: Sửa lại số lượng / Tiền thuế GTGT / Nội dung ghi chú điều chỉnh
    User->>UI: Bấm "Phát hành Hóa đơn Điều chỉnh"
    UI->>API: Send AdjustInvoiceRequest
    API->>DB: @Transactional: Tạo HĐ mới lưu original_invoice_id (QTN-12) -> Chuyển HĐ gốc sang ADJUSTED
    DB-->>API: Created Adjusted Invoice
    API-->>UI: ApiResponse(InvoiceResponse)
    UI-->>User: Toast thành công + Điều hướng về /e-invoices
```

---

## 6. PHÂN HỆ 6: KÊNH GỬI & TRA CỨU HÓA ĐƠN (NCL-06)

### 6.1 Popup Gửi Hóa Đơn Đa Kênh & Tra Cứu Công Khai (`/lookup-invoice`)
- **Route**: `/lookup-invoice` | **Components**: [LookupInvoicePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/pages/LookupInvoicePage.tsx), [SendInvoiceModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/e_invoice/components/SendInvoiceModal.tsx)
- **Mã Backlog**: `NCL-06-CN-001` đến `NCL-06-CN-004`

```mermaid
flowchart TD
    subgraph Kênh Gửi Tại Quầy
        Action[Xem Chi Tiết Hóa Đơn ISSUED] --> MultiChannel[Mở Popup SendInvoiceModal]
        MultiChannel --> BtnPrint[Nút 'In Hóa đơn' -> Mở PrintInvoiceModal - NCL-06-CN-003]
        MultiChannel --> BtnEmail[Nút 'Gửi Email' -> Nhập Email -> POST /api/v1/invoices/{id}/deliver/email - NCL-06-CN-002]
        MultiChannel --> BtnZalo[Nút 'Gửi Zalo' -> Nhập SĐT -> Gửi link qua Zalo OA - NCL-06-CN-002]
        MultiChannel --> BtnQR[Nút 'Mã QR' -> GET /api/v1/invoices/{id}/qr - NCL-06-CN-001]
    end

    subgraph Cổng Tra Cứu Công Khai
        Customer[Khách hàng Quét Mã QR / Truy cập /lookup-invoice] --> PublicPage[Màn hình Tra Cứu Hóa Đơn - NCL-06-CN-004]
        PublicPage --> InputCode[Nhập Mã Tra Cứu lookupCode]
        InputCode --> SearchAPI[GET /api/v1/public/invoices/lookup?code=XXX]
        SearchAPI --> RenderPDF[Render Chi tiết Tờ Hóa Đơn Điện Tử A4 + Nút Tải PDF/XML]
    end
```

---

## 7. PHÂN HỆ 7: BÁO CÁO, NHẬT KÝ & DASHBOARD (NCL-07)

### 7.1 Màn hình Báo Cáo Doanh Thu Theo Ngày & Mặt Hàng (`/reports/revenue`)
- **Route**: `/reports/revenue` | **Components**: [RevenueReportPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueReportPage.tsx), [ReportController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/ReportController.java)
- **Mã Backlog**: `NCL-07-CN-001`, `NCL-07-CN-002`, `QTN-10`

```mermaid
flowchart TD
    Start[Truy cập /reports/revenue] --> SelectFilter[Chọn Bộ Lọc Thời Gian: Hôm nay | Tháng này | Quý này | Tùy chỉnh]
    SelectFilter --> FetchReport[Gọi API: GET /api/v1/reports/daily & GET /api/v1/reports/products]
    FetchReport --> RenderKpi[Hiển thị Cards KPI: Tổng Doanh Thu, Tiền Hàng Chưa Thuế, Tiền Thuế GTGT Thu Hộ]
    RenderKpi --> RenderChart[Hiển thị Biểu đồ Cột Doanh Thu Tăng Trưởng]
    
    RenderChart --> ClickExport[Bấm 'Xuất Báo Cáo Excel']
    ClickExport --> CallExportAPI[Tải file Bieu_Mau_Bao_Cao_Doanh_Thu.xlsx]
```

---

### 7.2 Màn hình Báo Cáo So Sánh Doanh Thu Giữa Các Kỳ (`/reports/comparison`)
- **Route**: `/reports/comparison` | **Component**: [RevenueComparisonPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueComparisonPage.tsx)
- **Mã Backlog**: `NCL-07-CN-006`

```mermaid
flowchart TD
    Start[Truy cập /reports/comparison] --> SelectPeriods[Chọn 2 Khoảng thời gian: Kỳ 1 vs Kỳ 2]
    SelectPeriods --> FetchComparison[GET /api/v1/reports/comparison?kỳ1=X&kỳ2=Y]
    FetchComparison --> RenderComparisonChart[Biểu đồ Cột Kép So Sánh Doanh Thu]
    RenderComparisonChart --> RenderDiffTable[Bảng chênh lệch: Tăng/Giảm % doanh thu & Số đơn]
```

---

### 7.3 Màn hình Báo Cáo Đối Chiếu Tiền & Doanh Thu Cuối Ngày (`/reports/reconciliation`)
- **Route**: `/reports/revenue` | **Component**: [RevenueReportPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueReportPage.tsx), [ReportController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/ReportController.java)
- **Mã Backlog**: `NCL-07-CN-003`, `QTN-16`

```mermaid
flowchart TD
    Start[Truy cập Báo cáo Đối chiếu Tiền] --> FetchReconcile[GET /api/v1/reports/reconciliation?date=YYYY-MM-DD]
    FetchReconcile --> RenderTables[Hiển thị Bảng Tổng hợp Dòng tiền:]
    RenderTables --> CashTable[1. Tiền mặt: Quỹ đầu ca + Thu từ đơn - Chi trả thừa = Lý thuyết vs Thực đếm]
    RenderTables --> QRTable[2. Chuyển khoản: Mã VietQR / Ngân hàng đã ghi nhận]
    RenderTables --> DebtTable[3. Ghi nợ: Công nợ phát sinh trong ngày]
    RenderTables --> ErrorInvoiceTable[4. Cảnh báo: Danh sách Hóa đơn gửi CQT bị lỗi SEND_ERROR trong ngày - QTN-06]
    
    RenderTables --> ClickLock[Chủ hộ bấm 'Chốt Sổ Thu Chi Ngày']
    ClickLock --> CallLockAPI[POST /api/v1/reports/reconciliation/lock]
    CallLockAPI --> ToastReconcile[Toast: Đã khóa sổ thu chi ngày thành công!]
```

---

### 7.4 Màn hình Thống Kê Mặt Hàng Bán Chạy (`/reports/top-selling`)
- **Route**: `/reports/revenue` | **Component**: [RevenueReportPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/RevenueReportPage.tsx), [ReportController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/ReportController.java)
- **Mã Backlog**: `NCL-07-CN-007`

```mermaid
flowchart TD
    Start[Truy cập Tab Bán Chạy /reports/top-selling] --> SelectDate[Chọn khoảng thời gian: Tuần này / Tháng này / Tùy chọn]
    SelectDate --> FetchTopSellers[GET /api/v1/reports/top-selling?fromDate=X&toDate=Y&limit=20]
    FetchTopSellers --> RenderChart[Hiển thị Biểu đồ Thanh Xếp hạng Top Mặt Hàng]
    RenderChart --> RenderTable[Bảng chi tiết: SKU, Tên SP, Nhóm hàng, Số lượng bán, Doanh thu, Tỷ trọng %]
```

---

### 7.5 Màn hình Nhật Ký Hoạt Động (`/reports/activity-logs`)
- **Route**: `/reports/activity-logs` | **Component**: [ActivityLogPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/ActivityLogPage.tsx)
- **Mã Backlog**: `NCL-07-CN-004`, `QTN-09`

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Chủ hộ / Manager
    participant UI as ActivityLogPage.tsx
    participant API as GET /api/v1/reports/activity-logs

    Admin->>UI: Truy cập /reports/activity-logs
    UI->>API: Call API lấy lịch sử thao tác hệ thống
    API-->>UI: Danh sách Logs (User, Hành động, IP, Thời gian, Dữ liệu cũ -> mới)
    UI-->>Admin: Render Bảng Audit Log (Ví dụ: "Thu ngân A đã điều chỉnh giá sản phẩm B")
```

---

### 7.6 Màn hình Bảng Điều Khiển Doanh Thu Tổng Quan Dashboard (`/dashboard`)
- **Route**: `/dashboard` | **Component**: [DashboardOverviewPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/dashboard/pages/DashboardOverviewPage.tsx)
- **Vai trò**: Chủ hộ (`normal_management`), Kế toán (`normal_management`). Thu ngân (`point_of_sale`) xem ca cá nhân.
- **Mã Backlog**: `NCL-07-CN-005`, `QTN-10`

```mermaid
flowchart TD
    Start[Truy cập /dashboard] --> CheckRole{Kiểm tra Vai trò RoleCode - QTN-10}
    CheckRole -- Thu ngân point_of_sale --> ShowCashierShift[Hiển thị CashierShiftDashboard: Chỉ xem Ca & Đơn cá nhân]
    CheckRole -- Admin nền tảng platform_admin --> RedirectAdmin[Điều hướng /admin/overview]
    CheckRole -- Cơ quan Thuế tax_authority --> RedirectTax[Điều hướng /tax-authority/invoices]
    
    CheckRole -- Chủ hộ owner / Kế toán accountant --> FetchMetrics[Gọi song song các API Dashboard]
    FetchMetrics --> API1[GET /api/v1/reports/dashboard]
    FetchMetrics --> API2[GET /api/v1/reports/top-selling]
    FetchMetrics --> API3[GET /api/v1/reports/activity-logs]
    FetchMetrics --> API4[GET /api/v1/invoices?status=SEND_ERROR]
    
    API1 & API2 & API3 & API4 --> RenderDashboard[Render Màn hình Dashboard Tổng Quan]
    RenderDashboard --> ShowKPIs[Cards KPI: Tổng Doanh Thu, Số Đơn, Hóa đơn lỗi SEND_ERROR]
    RenderDashboard --> ShowCharts[Biểu đồ Tăng trưởng Doanh Thu + Biểu đồ Tròn PTTT]
    RenderDashboard --> ShowTopSellers[Widget Top 5 Mặt hàng bán chạy nhất]
    RenderDashboard --> ShowLogs[Panel Nhật ký Hoạt động thao tác gần đây]
```

---

## 8. PHÂN HỆ 8: QUẢN LÝ KHÁCH HÀNG & CÔNG NỢ (NCL-10)

### 8.1 Màn hình Quản Lý Khách Hàng (`/customers`)
- **Route**: `/customers` | **Component**: [CustomerPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/customer/pages/CustomerPage.tsx)
- **Mã Backlog**: `NCL-10-CN-001`

```mermaid
flowchart TD
    Start[Truy cập /customers] --> FetchCust[GET /api/v1/customers]
    FetchCust --> RenderCustTable[Hiển thị Bảng Khách hàng: Họ tên, SĐT, MST, Tích điểm, Công nợ]
    
    RenderCustTable --> AddCust[Bấm '+ Thêm Khách hàng']
    AddCust --> OpenModal[Mở CustomerFormModal]
    OpenModal --> SubmitCust[POST /api/v1/customers -> Toast thành công]

    RenderCustTable --> ViewHistory[Click Dòng Khách hàng]
    ViewHistory --> OpenDrawer[Mở CustomerHistoryDrawer: Lịch sử mua đơn hàng & Điểm thưởng đã tích]
```

---

### 8.2 Màn hình Thu Nợ & Nhắc Nợ Khách Hàng (`/customers`, `/debts`)
- **Route**: `/customers` | **Components**: [CustomerPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/customer/pages/CustomerPage.tsx), [DebtPaymentModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/customer/components/DebtPaymentModal.tsx), [DebtReminderModal.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/customer/components/DebtReminderModal.tsx), [CustomerDebtController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/CustomerDebtController.java)
- **Vai trò**: Chủ hộ (`normal_management`), Kế toán (`normal_management`).
- **Mã Backlog**: `NCL-10-CN-002`, `NCL-10-CN-003`, `QTN-13`, `QTN-14`

#### 8.2.1 Sơ Đồ Quy Trình Thu Nợ Khách Hàng (Customer Debt Collection - NCL-10-CN-002)
```mermaid
sequenceDiagram
    autonumber
    actor User as Chủ hộ / Kế toán
    participant UI as CustomerPage / DebtPaymentModal
    participant DebtAPI as POST /api/v1/debts/collect
    participant DB as Database (CustomerDebts & Customer)

    User->>UI: Bấm "Thu nợ" tại dòng Khách hàng có công nợ > 0
    UI->>UI: Hiển thị Tổng dư nợ hiện tại + Hạn mức nợ của Khách (QTN-13)
    User->>UI: Nhập Số tiền thu + Phương thức (Tiền mặt / CK) + Ghi chú
    User->>UI: Bấm "Xác Nhận Thu Nợ"
    UI->>DebtAPI: Send CollectDebtRequest(customerId, amount, paymentMethod, note)
    DebtAPI->>DB: @Transactional: Tạo bản ghi Thu nợ + Trừ Tổng công nợ khách hàng
    DB-->>DebtAPI: Updated Customer Debt Record
    DebtAPI-->>UI: ApiResponse(CustomerDebtResponse)
    UI-->>User: Toast: Đã ghi nhận thu nợ N VNĐ thành công + In phiếu thu nợ
```

#### 8.2.2 Sơ Đồ Nhắc Công Nợ & Cảnh Báo Đến Hạn (Debt Reminder Flow - NCL-10-CN-003, QTN-14)
```mermaid
flowchart TD
    Start[Vào Modal DebtReminderModal] --> LoadReminders[GET /api/v1/debts/reminders?status=OVERDUE]
    LoadReminders --> RenderDebtTable[Hiển thị Bảng Công Nợ: Khách hàng, Số nợ, Ngày nợ, Ngày đến hạn, Trạng thái - QTN-14]
    
    RenderDebtTable --> ActionRemind[Bấm 'Gửi Email Nhắc Nợ']
    ActionRemind --> ConfirmRemind[POST /api/v1/debts/remind]
    ConfirmRemind --> SendMail[Hệ thống gửi Email thông báo tự động tới Khách hàng]
    SendMail --> ToastRemindSuccess[Toast: Đã gửi email nhắc nợ thành công!]
```

---

## 9. PHÂN HỆ 9: CẤU HÌNH CỬA HÀNG & DỮ LIỆU (NCL-09)

### 9.1 Màn hình Thông Tin Hộ Kinh Doanh (`/settings/business-info`)
- **Route**: `/settings/business-info` | **Components**: [BusinessInfoPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/BusinessInfoPage.tsx), [HouseholdController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/HouseholdController.java)
- **Mã Backlog**: `NCL-09-CN-001`

```mermaid
flowchart TD
    Start[Truy cập /settings/business-info] --> LoadInfo[GET /api/v1/households/my-household]
    LoadInfo --> RenderForm[Hiển thị Form: Tên hộ, MST, Địa chỉ, SĐT, Tên Chủ hộ]
    RenderForm --> EditForm[Chỉnh sửa thông tin cửa hàng -> Bấm 'Lưu Thay Đổi']
    EditForm --> CallAPIUpdate[PUT /api/v1/households/my-household]
    CallAPIUpdate --> ToastSave[Toast: Cập nhật thông tin hộ kinh doanh thành công!]
```

---

### 9.2 Màn hình Cấu Hình Mẫu Hóa Đơn & Chữ Ký Số (`/settings/invoice-template`)
- **Route**: `/settings/invoice-template` | **Component**: [InvoiceTemplatePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/InvoiceTemplatePage.tsx)
- **Mã Backlog**: `NCL-09-CN-002`, `QTN-02`

```mermaid
flowchart TD
    Start[Truy cập /settings/invoice-template] --> FetchTemplate[GET /api/v1/invoice-templates]
    FetchTemplate --> ShowTemplate[Hiển thị Mẫu số, Ký hiệu HĐ 1C26M, Logo Hộ & Cấu hình Token Chữ ký số]
    ShowTemplate --> UploadLogo[Tải Logo cửa hàng & Cấu hình Chữ ký số USB Token / HSM]
    UploadLogo --> SaveTemplate[PUT /api/v1/invoice-templates]
    SaveTemplate --> ToastTemplate[Toast: Đã lưu thiết lập Mẫu Hóa đơn hợp lệ - QTN-02]
```

---

### 9.3 Màn hình Thuế Suất Đang Hiệu Lực (`/settings/tax-rates`)
- **Route**: `/settings/tax-rates` | **Component**: [TaxRateSettingsPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/TaxRateSettingsPage.tsx)
- **Mã Backlog**: `NCL-09-CN-003`, `QTN-17`

```mermaid
flowchart TD
    Start[Truy cập /settings/tax-rates] --> FetchTax[GET /api/v1/tax-rates]
    FetchTax --> ShowTaxList[Danh sách Thuế suất: VAT0, VAT5, VAT8, VAT10]
    ShowTaxList --> ToggleTax[Công tắc Bật/Tắt Trạng thái Hiệu lực của mức Thuế - QTN-17]
    ToggleTax --> UpdateTaxAPI[PATCH /api/v1/tax-rates/{id}/status]
    UpdateTaxAPI --> RefreshTax[Chỉ mức thuế đang hiệu lực mới được áp dụng khi xuất Hóa đơn]
```

---

### 9.4 Màn hình Sao Lưu & Xuất Dữ Liệu Danh Mục (`/settings/backup-export`)
- **Route**: `/settings/backup-export` | **Component**: [BackupExportPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/BackupExportPage.tsx)
- **Mã Backlog**: `NCL-09-CN-006`

```mermaid
flowchart TD
    Start[Truy cập /settings/backup-export] --> ShowOptions[Tùy chọn: Sao lưu Hệ thống & Export Excel/JSON]
    ShowOptions --> ClickBackup[Bấm 'Tạo Bản Sao Lưu Dữ Liệu']
    ClickBackup --> CallBackupAPI[GET /api/v1/backup/export]
    CallBackupAPI --> DownloadBackup[Tải file SaoLuu_DuLieu_BanHangViet.json / .sql]
```

---

### 9.5 Màn hình Cấu Hình Máy In Hóa Đơn (`/settings/printer`)
- **Route**: `/settings/printer` | **Component**: [PrinterSettingsPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/settings/pages/PrinterSettingsPage.tsx)
- **Mã Backlog**: `NCL-09-CN-004`

```mermaid
flowchart TD
    Start[Truy cập /settings/printer] --> LoadPrinterConfig[Nạp Cấu hình Máy in từ LocalStorage / System Config]
    LoadPrinterConfig --> RenderPrinterForm[Form: Chọn Cổng kết nối LAN/IP / USB / Bluetooth + Khổ giấy 80mm / 58mm / A4]
    RenderPrinterForm --> ClickTest[Bấm 'In Thử Nghiệm']
    ClickTest --> SendTestPrint[Gửi lệnh in mẫu tới Máy in đã chọn]
    SendTestPrint --> ClickSavePrinter[Bấm 'Lưu Thiết Lập Máy In']
    ClickSavePrinter --> ToastPrinter[Toast: Cấu hình máy in hóa đơn đã được lưu!]
```

---

## 10. PHÂN HỆ 10: WORKSPACE PLATFORM ADMIN (ADMIN NỀN TẢNG)

### 10.1 Màn hình Bảng Điều Khiển Tổng Quan Admin (`/admin/overview`)
- **Route**: `/admin/overview` | **Component**: [PlatformAdminOverviewPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/platform_admin/pages/PlatformAdminOverviewPage.tsx)
- **Vai trò**: Quản trị viên hệ thống (`platform_admin`).

```mermaid
flowchart TD
    Start[Admin truy cập /admin/overview] --> FetchAdminStats[GET /api/v1/admin/stats]
    FetchAdminStats --> RenderMetrics[Metrics Cards: Tổng Hộ Kinh Doanh, Hộ đang hoạt động, Hộ sắp hết hạn, Tổng HĐĐT đã phát hành]
    RenderMetrics --> RenderTrafficChart[Biểu đồ Lưu lượng Giao dịch & Request Hệ thống]
```

---

### 10.2 Màn hình Quản Lý Hộ Kinh Doanh (`/admin/households`)
- **Route**: `/admin/households` | **Component**: [HouseholdManagementPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/platform_admin/pages/HouseholdManagementPage.tsx)
- **Vai trò**: Quản trị viên hệ thống (`platform_admin`).

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Admin
    participant UI as HouseholdManagementPage.tsx
    participant API as GET/PATCH /api/v1/admin/households
    participant DB as Database

    Admin->>UI: Truy cập /admin/households
    UI->>API: GET /api/v1/admin/households (Kèm bộ lọc MST, Tên Hộ, Trạng thái)
    API-->>UI: Render Danh sách Hộ kinh doanh & Gói dịch vụ
    
    alt Khóa / Mở khóa Hộ Kinh Doanh
        Admin->>UI: Bấm công tắc Khóa/Mở khóa Hộ
        UI->>API: PATCH /api/v1/admin/households/{id}/status
        API->>DB: Cập nhật Trạng thái Active/Locked
        API-->>UI: 200 OK
        UI-->>Admin: Toast: Đã thay đổi trạng thái Hộ thành công
    else Gia hạn Gói Dịch vụ
        Admin->>UI: Click "Gia hạn" -> Chọn Ngày hết hạn mới
        UI->>API: POST /api/v1/admin/households/{id}/extend
        API->>DB: Cập nhật Subscription Expire Date
        API-->>UI: 200 OK
        UI-->>Admin: Toast: Gia hạn dịch vụ thành công!
    end
```

---

### 10.3 Màn hình Nhật Ký Hệ Thống Admin (`/admin/logs`)
- **Route**: `/admin/logs` | **Component**: [PlatformAdminLogsPage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/platform_admin/pages/PlatformAdminLogsPage.tsx)
- **Vai trò**: Quản trị viên hệ thống (`platform_admin`).

```mermaid
flowchart TD
    Start[Admin truy cập /admin/logs] --> FetchSystemLogs[GET /api/v1/admin/logs]
    FetchSystemLogs --> RenderLogTable[Bảng Nhật Ký Toàn Hệ Thống: Thời gian, Hộ KD, Người thực hiện, API Endpoint, Trạng thái Response, IP]
    RenderLogTable --> FilterLogs[Lọc theo Cấp độ Error/Warning, MST Hộ, Khoảng thời gian]
```

---

## 11. PHÂN HỆ 11: WORKSPACE CƠ QUAN THUẾ MÔ PHỎNG (TAX AUTHORITY)

### 11.1 Cổng Duyệt Cấp Mã Hóa Đơn Điện Tử Cục Thuế (`/tax-authority/invoices`)
- **Route**: `/tax-authority/invoices` | **Components**: [TaxInvoiceApprovalRoutePage.tsx](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/tax_authority/pages/TaxInvoiceApprovalRoutePage.tsx), [TaxAuthorityController.java](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/java/com/sales/controller/TaxAuthorityController.java)
- **Vai trò**: Cán bộ Cục Thuế mô phỏng (`tax_authority`).
- **Mã Backlog**: `NCL-04-CN-003`, `NCL-04-CN-004`, `QTN-06`

```mermaid
sequenceDiagram
    autonumber
    actor TaxOfficer as Cán bộ Cục Thuế (VT-05)
    participant UI as TaxInvoiceApprovalRoutePage.tsx
    participant TaxAPI as /api/v1/tax-authority/invoices
    participant DB as Database

    TaxOfficer->>UI: Truy cập /tax-authority/invoices
    UI->>TaxAPI: GET /api/v1/tax-authority/invoices/waiting
    TaxAPI-->>UI: Render Danh sách Hóa đơn đang chờ cấp mã
    
    alt Hành động 1: Duyệt Cấp Mã
        TaxOfficer->>UI: Click "Duyệt cấp mã" -> Sinh Mã CQT
        UI->>TaxAPI: POST /api/v1/tax-authority/invoices/{invoiceId}/approve
        TaxAPI->>DB: Chuyển Trạng thái HĐ sang ISSUED + Gán Mã CQT & Số HĐ tăng dần
        DB-->>TaxAPI: Approved Record
        TaxAPI-->>UI: 200 OK
        UI-->>TaxOfficer: Toast: Đã cấp mã CQT thành công!
    else Hành động 2: Từ Chối Cấp Mã (Cảnh báo hạn QTN-06)
        TaxOfficer->>UI: Click "Từ chối" -> Nhập Thông báo lỗi (VD: Mã số thuế người mua bị sai)
        UI->>TaxAPI: POST /api/v1/tax-authority/invoices/{invoiceId}/reject
        TaxAPI->>DB: Chuyển Trạng thái HĐ sang SEND_ERROR + Lưu Chi tiết Lỗi (QTN-06)
        DB-->>TaxAPI: Rejected Record
        TaxAPI-->>UI: 200 OK
        UI-->>TaxOfficer: Toast: Đã chuyển trạng thái Lỗi gửi thuế
    end
```

---

## 📌 TỔNG KẾT BẢNG ÁNH XẠ MÀN HÌNH & BACKLOG (SUMMARY MATRIX)

| Phân Hệ | Số Lượng Màn Hình & Modals | Các Route Chính | Mã Backlog & Quy Tắc Ánh Xạ |
| :--- | :---: | :--- | :--- |
| **1. Xác Thực & Tài Khoản** | 3 Màn hình + 2 Modals | `/auth/login`, `/auth/register`, `/employees` | `NCL-01-CN-001` ➔ `004`, `QTN-01` |
| **2. Hàng Hóa & Tồn Kho** | 3 Màn hình + 5 Modals | `/products`, `/products/stock-entry` | `NCL-02-CN-001` ➔ `005`, `NCL-09-CN-005` |
| **3. POS, Ca & Đồng Bộ Offline** | 3 Màn hình + 6 Modals/Drawers | `/pos`, `/shifts`, `/sync` | `NCL-03-CN-001` ➔ `008`, `NCL-08-CN-001` ➔ `003`, `QTN-07,08,11,15,16` |
| **4. Đơn Hàng Bán Lẻ** | 1 Màn hình + 2 Drawers | `/orders` | `NCL-03-CN-005`, `NCL-04-CN-001`, `QTN-03` |
| **5. Hóa Đơn Điện Tử & Thuế**| 2 Màn hình + 4 Drawers/Modals| `/e-invoices`, `/e-invoices/:id/adjust` | `NCL-04-CN-002` ➔ `005`, `NCL-05-CN-001` ➔ `004`, `QTN-04,05,06,09,12` |
| **6. Kênh Gửi & Tra Cứu** | 1 Màn hình + 1 Popup | `/lookup-invoice` | `NCL-06-CN-001` ➔ `004` |
| **7. Báo Cáo, Nhật Ký & Dashboard** | 6 Màn hình | `/dashboard`, `/reports/*` | `NCL-07-CN-001` ➔ `007`, `QTN-09,10,16` |
| **8. Khách Hàng & Công Nợ** | 1 Màn hình + 3 Modals/Drawers | `/customers` | `NCL-10-CN-001` ➔ `003`, `QTN-13,14` |
| **9. Cấu Hình Cửa Hàng & Dữ Liệu** | 5 Màn hình | `/settings/*` | `NCL-09-CN-001` ➔ `006`, `QTN-02,17` |
| **10. Platform Admin** | 3 Màn hình | `/admin/*` | Nền tảng Admin hệ thống |
| **11. Cục Thuế Mô Phỏng** | 1 Màn hình + 1 Action Modal | `/tax-authority/invoices` | `NCL-04-CN-003`, `NCL-04-CN-004`, `QTN-06` |
