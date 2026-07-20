# 🛍️ Bán Hàng Việt - Hệ Thống Quản Lý Bán Hàng & POS Cho Hộ Kinh Doanh

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Vite](https://img.shields.io/badge/Vite-5.3.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

**Bán Hàng Việt** là hệ thống phần mềm quản lý bán hàng và điểm bán (POS) toàn diện được thiết kế tối ưu cho các hộ kinh doanh, cửa hàng bán lẻ tại Việt Nam. Hệ thống đáp ứng đầy đủ các quy trình nghiệp vụ từ quản lý ca bán hàng, bán hàng tại điểm POS, nhập kho sản phẩm, theo dõi hóa đơn, quản lý nhân viên - khách hàng cho tới báo cáo doanh thu và tích hợp chuẩn hóa hóa đơn điện tử với Cơ quan Thuế.

---

## 📌 Mục Lục

- [✨ Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [🛠️ Công Nghệ Sử Dụng](#️-công-nghệ-sử-dụng)
- [📂 Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
- [🔐 Phân Quyền & Vai Trò Hệ Thống](#-phân-quyền--vai-trò-hệ-thống)
- [📖 Tài Liệu Kiến Trúc Chi Tiết](#-tài-liệu-kiến-trúc-chi-tiết)

---

## ✨ Tính Năng Nổi Bật

### 🛒 1. Bán Hàng Tại Điểm Bán (POS)
- Màn hình thu ngân trực quan, tối ưu thao tác nhanh.
- Tìm kiếm sản phẩm thông minh qua mã vạch (Barcode/SKU) hoặc tên sản phẩm.
- Hỗ trợ đa dạng phương thức thanh toán: Tiền mặt, Chuyển khoản QR code.
- Tính toán chính xác tiền thừa, áp dụng chiết khấu và tự động in hóa đơn.

### ⏱️ 2. Quản Lý Ca Bán Hàng (Shift Management)
- Bắt buộc khai báo tiền quỹ đầu ca trước khi tiến hành bán hàng.
- Ràng buộc **Quy tắc 1-1**: Mỗi nhân viên chỉ được mở duy nhất 01 ca làm việc tại một thời điểm (`OPEN`).
- Tự động liên kết đơn bán hàng vào ca làm việc hiện tại.
- Đóng ca & kiểm kê tiền mặt cuối ngày: Tự động đối chiếu số tiền mặt lý thuyết và tiền mặt thực tế, yêu cầu giải trình khi có chênh lệch.

### 📦 3. Quản Lý Sản Phẩm & Nhập Kho
- Quản lý danh mục, đơn vị tính, giá bán, giá nhập, tồn kho của sản phẩm.
- Xây dựng bộ lọc tìm kiếm sản phẩm động với JPA Criteria API.
- Tạo phiếu nhập kho (Goods Receipt) và theo dõi biến động hàng tồn.

### 📑 4. Quản Lý Đơn Hàng & Hóa Đơn
- Quản lý toàn bộ lịch sử đơn hàng đã bán.
- Hỗ trợ tra cứu chi tiết hóa đơn, trạng thái thanh toán và thông tin khách hàng.

### 👥 5. Quản Lý Nhân Viên & Khách Hàng
- Quản lý danh sách nhân viên, tài khoản đăng nhập và vai trò hoạt động.
- Quản lý thông tin khách hàng thân thiết, lịch sử mua hàng.

### 📊 6. Báo Cáo Doanh Thu & Kết Nối Thuế
- Thống kê doanh thu theo thời gian, theo ca làm việc, theo nhân viên hoặc mặt hàng bán chạy.
- Kết nối và truyền dữ liệu hóa đơn tới hệ thống Cơ quan Thuế.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend (`/backend`)
| Công nghệ | Phiên bản / Mô tả |
| :--- | :--- |
| **Java** | JDK 17 |
| **Framework** | Spring Boot 3.3.1 |
| **Security** | Spring Security & JWT Stateless (JJWT 0.12.5) |
| **Database** | MySQL, Spring Data JPA / Hibernate |
| **Validation** | Jakarta Bean Validation (`@Valid`, `@NotNull`...) |
| **Architecture** | Layered Architecture (Controller ➔ Service ➔ Repository ➔ Entity) |
| **Build Tool** | Apache Maven |

### Frontend (`/frontend`)
| Công nghệ | Phiên bản / Mô tả |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript |
| **Build Tool** | Vite 5.3.1 |
| **State & API Management** | Redux Toolkit & RTK Query (`baseApi`) |
| **Routing** | React Router v7 (`react-router-dom`) với Guard Routes |
| **UI Components** | Ant Design (`antd` 5.19) & Lucide React Icons |
| **Styling** | Tailwind CSS 3.4 & PostCSS |
| **Form & Validation** | React Hook Form & Zod Schema Validation |

---

## 📂 Cấu Trúc Dự Án

Dự án được tổ chức dạng **Monorepo** tách biệt giữa backend và frontend:

```text
BanHangViet/
├── backend/                      # Mã nguồn Backend Spring Boot
│   ├── src/main/java/com/viet/sales/
│   │   ├── configuration/        # Cấu hình Security, JWT Filter, CORS
│   │   ├── constant/             # Các Enum, Constants (Roles, Status)
│   │   ├── controller/           # REST API Controllers
│   │   ├── dto/                  # Request & Response DTOs
│   │   ├── entity/               # JPA Entities (Database Mapping)
│   │   ├── exception/            # Global Exception Handler & Custom Errors
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   ├── service/              # Logic Nghiệp vụ (Interfaces & Classes)
│   │   ├── specification/        # Query động với JPA Criteria API
│   │   └── utils/                # Hàm tiện ích bổ trợ
│   ├── backend_architecture.md   # Tài liệu chi tiết kiến trúc Backend
│   └── pom.xml                   # Cấu hình Maven Dependencies
│
├── frontend/                     # Mã nguồn Frontend React TypeScript
│   ├── src/
│   │   ├── assets/               # Hình ảnh, font, tài nguyên tĩnh
│   │   ├── components/           # UI Component dùng chung (layouts, common)
│   │   ├── configs/              # Cấu hình hệ thống
│   │   ├── constants/            # API endpoints, routes, roles constants
│   │   ├── hooks/                # Custom hooks (useRedux, useDebounce...)
│   │   ├── modules/              # Feature Modules (auth, product, pos, shift, order...)
│   │   ├── pages/                # High-level Pages / Wrappers
│   │   ├── providers/            # React Context Providers
│   │   ├── routers/              # AppRouter & Guards (PrivateRoute, RoleRoute...)
│   │   ├── stores/               # Redux Store & RTK Query baseApi
│   │   └── utils/                # Formatters, helpers
│   ├── frontend_architecture.md  # Tài liệu chi tiết kiến trúc Frontend
│   ├── package.json              # Npm Dependencies & Scripts
│   ├── tailwind.config.js        # Cấu hình Tailwind CSS
│   └── vite.config.ts            # Cấu hình Vite Build Tool
│
├── .huh/                         # Phân tích Yêu cầu, Backlogs & Sơ đồ Luồng
│   ├── shift_management_analysis.md # Phân tích chi tiết User Story Ca bán hàng
│   └── shift_management_flow.md     # Sơ đồ luồng mở/đóng ca bán hàng
│
├── backend_architecture.md       # Tổng quan Kiến trúc Backend (Root)
└── README.md                     # Tài liệu tổng quan dự án (File này)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
- **Node.js**: `>= 18.x`
- **Java Development Kit (JDK)**: `>= 17`
- **Database**: MySQL `>= 8.0`
- **Maven**: `>= 3.8` (hoặc sử dụng Maven Wrapper)

---

### 1. Khởi Chạy Backend (Spring Boot)

1. **Cấu hình Cơ sở dữ liệu MySQL**:
   Tạo cơ sở dữ liệu MySQL mới (ví dụ: `sales_db`).

2. **Cấu hình file `application.properties`**:
   Chỉnh sửa đường dẫn kết nối MySQL và tài khoản tại `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/sales_db?useSSL=false&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=your_password
   
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   ```

3. **Chạy ứng dụng Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Backend sẽ lắng nghe tại cổng mặc định: `http://localhost:8080`.

---

### 2. Khởi Chạy Frontend (React + Vite)

1. **Cài đặt thư viện (Dependencies)**:
   ```bash
   cd frontend
   npm install
   ```

2. **Cấu hình biến môi trường**:
   Tạo file `.env` từ `.env.example` trong thư mục `frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   ```

3. **Chạy ứng dụng ở chế độ Development**:
   ```bash
   npm run dev
   ```
   Ứng dụng Frontend sẽ chạy tại địa chỉ: `http://localhost:5173`.

---

## 🔐 Phân Quyền & Vai Trò Hệ Thống

Hệ thống hỗ trợ phân quyền truy cập chi tiết dựa trên vai trò tài khoản (**Role-based Access Control**):

- **`normal_management` (Chủ hộ / Quản lý)**: Toàn quyền quản lý cửa hàng, xem báo cáo doanh thu, quản lý sản phẩm, nhân viên và cấu hình.
- **`point_of_sale` (Nhân viên thu ngân / Bán hàng)**: Truy cập màn hình POS, mở/đóng ca bán hàng, tạo đơn hàng và in hóa đơn.
- **`tax_authority` (Cơ quan Thuế)**: Kiểm tra dữ liệu hóa đơn truyền nhận tới Cục Thuế.
- **`platform_admin` (Quản trị viên Hệ thống)**: Quản trị nền tảng toàn cục.

---

## 📖 Tài Liệu Kiến Trúc Chi Tiết

Để tìm hiểu sâu hơn về kiến trúc kỹ thuật và luồng hoạt động từng tầng, vui lòng tham khảo các tài liệu sau:

- 📄 [Tài liệu Kiến trúc Backend](file:///d:/Intern/Codegym/BanHangViet/backend_architecture.md) (`backend_architecture.md`)
- 📄 [Tài liệu Kiến trúc Frontend](file:///d:/Intern/Codegym/BanHangViet/frontend/frontend_architecture.md) (`frontend/frontend_architecture.md`)
- 📄 [Phân tích nghiệp vụ Quản lý ca](file:///d:/Intern/Codegym/BanHangViet/.huh/shift_management_analysis.md) (`.huh/shift_management_analysis.md`)

---

© 2026 **Bán Hàng Việt** - Phát triển bởi CodeGym Intern Team.
