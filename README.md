# 🇻🇳 Bán Hàng Việt - Hệ Thống Quản Lý Bán Hàng & Hóa Đơn Điện Tử

Dự án **Bán Hàng Việt** là phần mềm quản lý bán hàng và hỗ trợ xuất hóa đơn điện tử tối ưu dành cho các hộ kinh doanh cá thể và doanh nghiệp nhỏ tại Việt Nam. Hệ thống bao gồm 2 phần chính: **Backend** viết bằng Java (Spring Boot) và **Frontend** viết bằng React (Vite + TypeScript + Tailwind CSS).

---

## 🛠️ Công Nghệ Sử Dụng

### Backend (Spring Boot)
*   **Java Version**: 17
*   **Framework**: Spring Boot 3.3.1 (Spring Web, Spring Security, Spring Data JPA, Spring Validation)
*   **Database**: MySQL (sử dụng MySQL Connector J)
*   **Authentication**: JSON Web Token (JJWT 0.12.5) để phân quyền và xác thực
*   **Tiện ích**: Lombok, Hibernate

### Frontend (React & TypeScript)
*   **Framework**: React 19 + Vite (TypeScript)
*   **UI Library**: Ant Design (v5.19.1) & Lucide React (Icons)
*   **Styling**: Tailwind CSS (v3.4.4) & PostCSS
*   **State Management**: Redux Toolkit & React Redux
*   **Routing**: React Router DOM (v7.1.1)
*   **Validation**: Zod (v3.23.8)

---

## 📁 Cấu Trúc Thư Mục Dự Án

Dự án được phân chia rõ ràng thành 2 thư mục độc lập ở thư mục gốc:

```text
BanHangViet/
├── backend/            # Mã nguồn phía máy chủ (Spring Boot)
│   ├── src/main/java/  # Packages mã nguồn Java
│   └── pom.xml         # File quản lý dependencies của Maven
├── frontend/           # Mã nguồn giao diện người dùng (React SPA)
│   ├── src/            # Components, pages, stores, hooks
│   └── package.json    # File quản lý dependencies của Node.js
└── README.md           # Hướng dẫn này
```

---

## ⚙️ Hướng Dẫn Cài Đặt và Khởi Chạy

### 1. Chuẩn bị môi trường
Yêu cầu hệ thống đã cài đặt sẵn:
*   [JDK 17+](https://adoptium.net/temurin/releases/?version=17)
*   [Node.js v18+](https://nodejs.org/)
*   [MySQL Server 8.x+](https://dev.mysql.com/downloads/installer/)

---

### 2. Thiết lập Database (MySQL)
1. Khởi động MySQL Server của bạn.
2. Tạo mới một cơ sở dữ liệu có tên là `ban_hang_viet`:
   ```sql
   CREATE DATABASE ban_hang_viet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Cấu hình kết nối nằm ở file: `backend/src/main/resources/application.yml`
   *   **Mặc định**:
       *   URL: `jdbc:mysql://localhost:3306/ban_hang_viet`
       *   Username: `root`
       *   Password: `root`
   *   Bạn có thể thay đổi cấu hình này bằng cách tạo biến môi trường `DB_URL`, `DB_USER`, và `DB_PASSWORD` hoặc sửa trực tiếp trong file cấu hình.

---

### 3. Khởi chạy Backend (Spring Boot)
Di chuyển vào thư mục `backend` và chạy lệnh sau bằng Terminal / Command Prompt:

```bash
cd backend

# Chạy trực tiếp qua Maven Wrapper (Windows)
mvnw.cmd spring-boot:run

# Hoặc (Linux / macOS)
chmod +x mvnw
./mvnw spring-boot:run
```

*   **API URL mặc định**: `http://localhost:8080`
*   Hệ thống sẽ tự động tạo cấu trúc bảng (ddl-auto: `update`) khi khởi chạy lần đầu tiên.

---

### 4. Khởi chạy Frontend (React)
Mở một cửa sổ Terminal mới, chuyển vào thư mục `frontend` để cài đặt thư viện và chạy máy chủ phát triển (Dev server):

```bash
cd frontend

# Cài đặt các thư viện phụ thuộc
npm install

# Khởi chạy ứng dụng trong chế độ Development
npm run dev
```

*   **Ứng dụng Web mặc định**: Truy cập địa chỉ hiển thị trên terminal (thường là `http://localhost:5173`).

---

## 📐 Quy Tắc Thiết Kế Code (Coding Conventions)

Để giữ cho mã nguồn luôn dễ đọc, bảo trì và nhất quán giữa các thành viên dự án, vui lòng tuân thủ các quy tắc sau:

### Phía Backend (Spring Boot)

#### 1. Tầng cấu hình (`configuration`)
*   **Vị trí**: `backend/src/main/java/com/viet/sales/configuration`
*   Chỉ chứa cấu hình hệ thống toàn cục như Spring Security, CORS, JWT Filter, Async, Mail, Cloudinary, v.v.
*   *Quy tắc*: Các thông tin nhạy cảm bắt buộc cấu hình từ file `.yml` thông qua `@Value` hoặc `@ConfigurationProperties`. Không viết logic nghiệp vụ tại đây.
*   *Đặt tên*: Đặt tên class với hậu tố `Config` hoặc `Configuration` (ví dụ: `SecurityConfig`, `CORSConfig`).

#### 2. Tầng hằng số & Enum (`constant`)
*   **Vị trí**: `backend/src/main/java/com/viet/sales/constant`
*   Chứa các Enum nghiệp vụ (ví dụ: `Role`, `OrderStatus`) hoặc các hằng số tĩnh không thay đổi trong suốt vòng đời dự án.
*   *Đặt tên*: Tên Enum và hằng số tĩnh viết hoa, ngăn cách bằng dấu gạch dưới (`SCREAMING_SNAKE_CASE`).

#### 3. Tầng Tương Tác Dữ Liệu (`repository`)
*   **Vị trí**: `backend/src/main/java/com/viet/sales/repository`
*   Kế thừa `JpaRepository<Entity, ID>` từ Spring Data.
*   *Quy tắc*: Tránh viết logic nghiệp vụ phức tạp ở đây. Đối với các chức năng lọc tìm kiếm động, sử dụng thêm `JpaSpecificationExecutor<Entity>`. Cần lưu ý sử dụng `@EntityGraph` hoặc `join fetch` để giải quyết vấn đề N+1 query.
*   *Đặt tên*: Đặt tên interface với hậu tố `Repository` (ví dụ: `UserRepository`).

---

### Phía Frontend (React + Vite + TypeScript)

#### 1. Tiện ích và hàm bổ trợ (`utils`)
*   **Vị trí**: `frontend/src/utils`
*   Chứa các hàm tiện ích phục vụ logic chung trong dự án và hoàn toàn không lưu trạng thái (stateless).
*   *Quy tắc*: Chứa các hàm như định dạng tiền tệ (`formatCurrency.ts`), định dạng ngày tháng (`formatDate.ts`), validation email/sđt cơ bản. Không chứa component UI hoặc custom hooks tại đây.
*   *Đặt tên*: File viết theo kiểu `camelCase`.

#### 2. Định dạng UI và Tailwind CSS
*   Sử dụng biến màu sắc và layout đồng nhất tương tự hệ thống KiotViet (xem file mẫu `.huh/mockup/index.html` để tham khảo style và CSS Variables).
*   Ưu tiên sử dụng Ant Design kết hợp với Tailwind CSS thay vì viết CSS tùy biến quá nhiều.

---

## 🚀 Đóng Góp Ý Kiến & Quy Trình Git (Git Flow)

1. **Tạo nhánh mới**:
   *   Tính năng mới: `feature/ten-tinh-nang`
   *   Sửa lỗi: `bugfix/ten-loi`
2. **Commit message**:
   Sử dụng định dạng chuẩn rõ ràng:
   *   `feat: thêm chức năng xuất hóa đơn PDF`
   *   `fix: sửa lỗi không nhận token khi reload trang`
   *   `docs: cập nhật file README hướng dẫn chạy dự án`
3. **Tạo Pull Request**: Yêu cầu kiểm tra code (Code Review) và chạy thử nghiệm đầy đủ trước khi thực hiện merge vào nhánh chính (`main` / `master`).
