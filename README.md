<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner_hero_apple.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/banner_hero_apple_light.svg">
  <img alt="Bán Hàng Việt" src="docs/assets/banner_hero_apple_light.svg" width="100%" />
</picture>

<br/>

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED.svg)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine%20Proxy-009639.svg)](https://nginx.org/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](https://www.mysql.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash%20Lite-8E75C4.svg)](https://aistudio.google.com/)

<br/>

</div>

**Bán Hàng Việt** là nền tảng quản lý bán hàng và điểm bán (POS) toàn diện được thiết kế chuyên biệt cho các Hộ kinh doanh cá thể và chuỗi bán lẻ tại Việt Nam. Hệ thống được xây dựng theo kiến trúc **Monorepo (Modular Monolith + React SPA)**, hỗ trợ mô hình **Đa hộ kinh doanh (Multi-Tenancy)** cô lập dữ liệu an toàn, tích hợp xuất hóa đơn điện tử khởi tạo từ máy tính tiền tuân thủ **Thông tư 78/2021/TT-BTC & Nghị định 123/2020/NĐ-CP**, kết hợp trợ lý AI Chatbot thông minh và hạ tầng DevOps CI/CD tự động hóa đạt chuẩn Production.

---

## 📌 Mục Lục

- [✨ Tính Năng Nghiệp Vụ Cốt Lõi](#-tính-năng-nghiệp-vụ-cốt-lõi)
- [🛠️ Công Nghệ & Kiến Trúc Kỹ Thuật](#️-công-nghệ--kiến-trúc-kỹ-thuật)
- [📂 Cấu Trúc Mã Nguồn Monorepo](#-cấu-trúc-mã-nguồn-monorepo)
- [🚀 Hướng Dẫn Cài Đặt & Chạy Local](#-hướng-dẫn-cài-đặt--chạy-local)
- [🐳 Triển Khai Production & DevOps CI/CD](#-triển-khai-production--devops-cicd)
- [🔐 Hệ Thống Phân Quyền Vai Trò (RBAC VT-01 - VT-06)](#-hệ-thống-phân-quyền-vai-trò-rbac-vt-01---vt-06)
- [📖 Tài Liệu Tham Khảo Kỹ Thuật](#-tài-liệu-tham-khảo-kỹ-thuật)

---

## ✨ Tính Năng Nghiệp Vụ Cốt Lõi

### 🛒 1. Điểm Bán POS & Quản Lý Ca (Shift Management)
- Giao diện bán hàng POS tốc độ cao, hỗ trợ quét mã vạch (Barcode Scanner/SKU) và tìm kiếm thông minh.
- Đa dạng thanh toán: Tiền mặt, chuyển khoản ngân hàng qua mã VietQR động, kết hợp nhiều phương thức.
- **Ràng buộc Quy tắc Ca 1-1**: Bắt buộc khai báo tiền quỹ đầu ca, mỗi nhân viên chỉ mở duy nhất 01 ca hoạt động (`OPEN`).
- Tự động đối chiếu doanh thu lý thuyết và tiền mặt thực tế khi đóng ca, bắt buộc giải trình khi phát hiện lệch quỹ.

### 🧾 2. Hóa Đơn Điện Tử & Kê Khai Thuế (TT78 & NĐ123)
- Hóa đơn điện tử máy tính tiền có mã của Cơ quan Thuế, ký số tập trung và truyền nhận dữ liệu tự động.
- Quản lý dải ký hiệu mẫu hóa đơn (1C24TYY...), xử lý hóa đơn điều chỉnh, thay thế và thông báo sai sót Mẫu 04/SS-HĐĐT.
- Tự động lập bảng kê thuế bán ra (Mẫu 01-1/HKD) và bảng kê mua vào (Mẫu 01-2/HKD) kết xuất định dạng chuẩn.

### 🤖 3. Trợ Lý AI Chatbot Bán Hàng (Google Gemini AI)
- Tích hợp mô hình AI **Gemini 3.5 Flash Lite** (hỗ trợ danh sách fallback tự động: Gemini 3.1 Flash, 2.5 Flash...).
- Truy vấn ngôn ngữ tự nhiên thông minh: kiểm tra tồn kho, gợi ý sản phẩm bán chạy, tóm tắt doanh số tức thì.
- Cơ chế **Smart Local Fallback**: Tự động chuyển về xử lý nội bộ ngoại tuyến khi mất kết nối mạng hoặc hết hạn mức API.

### 📦 4. Kho Hàng, Đổi Trả & Kiểm Kê Định Kỳ
- Quản lý đa đơn vị tính (thùng, lốc, lon) kèm bảng giá linh hoạt theo từng nhóm đối tượng khách hàng.
- Phiếu nhập kho, trả hàng nhà cung cấp, kiểm kê tồn kho định kỳ và tự động cân bằng số liệu.
- Quản lý đổi trả hàng linh hoạt: hoàn tiền mặt, đổi ngang sản phẩm hoặc ghi nợ công nợ.

### 🔄 5. Sao Lưu, Tự Kiểm Định & Phục Hồi Dữ Liệu
- Lập lịch tự động sao lưu dữ liệu CSDL hàng ngày lúc 01:00 sáng, nén gzip và tự động xoay vòng dọn dẹp các bản sao lưu cũ hơn 7 ngày.
- Cơ chế tự động chạy thử nghiệm khôi phục sao lưu (Mock Restore Verification) vào lúc 02:30 sáng nhằm kiểm chứng tính toàn vẹn của tệp sao lưu.

---

## 🛠️ Công Nghệ & Kiến Trúc Kỹ Thuật

| Tầng Hệ Thống | Công Nghệ Sử Dụng | Phiên Bản | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Java OpenJDK / Eclipse Temurin | **Java 17** | LTS, tối ưu Garbage Collector G1GC |
| **Backend Framework**| Spring Boot | **3.3.1** | Modular Monolith (Package-by-Feature) |
| **Security & Auth** | Spring Security 6 & JJWT | **0.12.5** | JWT Stateless, HouseholdContextHolder cô lập hộ |
| **ORM & Database** | Hibernate 6, Spring Data JPA | **MySQL 8.0** | HikariCP Connection Pool (Max: 20, Min: 5) |
| **Frontend Core** | React | **19.0.0** | Single Page Application (SPA), React Router v7 |
| **Language & Build** | TypeScript, Vite | **Vite 5.3.1** | ManualChunks tối ưu vendor bundle |
| **State Management** | Redux Toolkit & RTK Query | **2.2.x** | `baseApi` quản lý cache và invalidation |
| **UI Library** | Ant Design (`antd`) & Lucide Icons| **5.19.x** | Responsive POS + Dashboard, Tailwind CSS 3.4 |
| **Web Server** | Nginx Alpine | **1.27-alpine**| Reverse Proxy, HTTP/2, Gzip, 50MB Upload Limit |
| **CI/CD Pipeline** | GitHub Actions | **Workflow v4**| Parallel Test -> Buildx GHCR -> SSH Deploy VPS |
| **Container Engine** | Docker & Docker Compose | **Compose v2** | Multi-stage build, Non-root user `spring:spring` |

---

## 📂 Cấu Trúc Mã Nguồn Monorepo

```text
BanHangViet/
├── .github/
│   └── workflows/
│       └── deploy.yml                        # Pipeline CI/CD 3 giai đoạn tự động hóa toàn bộ
│
├── docker-compose.yml                         # Điều phối Backend, Frontend & Reverse Proxy trên VPS
│
├── backend/                                   # Mã nguồn Backend Spring Boot 3.3.1
│   ├── Dockerfile                             # Đóng gói Multi-stage: Maven Builder -> JRE 17 Alpine
│   ├── .env.example                           # Mẫu cấu hình biến môi trường Backend
│   ├── pom.xml                                # Quản lý dependencies dự án Maven
│   └── src/
│       ├── main/java/com/sales/
│       │   ├── SalesApplication.java          # Điểm khởi chạy ứng dụng Spring Boot
│       │   ├── common/                        # Hạ tầng dùng chung (Security, DTO, Exception, Utils)
│       │   └── modules/                       # 17 Feature Modules nghiệp vụ độc lập
│       │       ├── auth/                      # Đăng nhập, người dùng, phiên và hộ kinh doanh
│       │       ├── pos/ & shift/              # Điểm bán POS, ca thu ngân và bàn giao ca
│       │       ├── product/ & inventory/      # Hàng hóa, đơn vị tính, kho hàng, kiểm kê
│       │       ├── order/ & return_ticket/    # Đơn hàng, đổi trả và bàn ăn
│       │       ├── invoice/ & tax/            # Hóa đơn điện tử TT78, báo cáo thuế Mẫu 01
│       │       ├── chatbot/                   # Trợ lý AI bán hàng thông minh (Google Gemini)
│       │       └── backup/                    # Sao lưu và kiểm định khôi phục CSDL
│       └── main/resources/
│           ├── application.yml                # Cấu hình Spring Boot trung tâm
│           └── db/
│               └── init_ban_hang_viet_full.sql # CSDL khởi tạo toàn diện ban đầu
│
├── frontend/                                  # Mã nguồn Frontend React 19 + TypeScript
│   ├── Dockerfile                             # Đóng gói Multi-stage: Node 22 Builder -> Nginx Alpine
│   ├── nginx.conf                             # Cấu hình Nginx: SPA Fallback, 50MB upload, Reverse Proxy
│   ├── vite.config.ts                         # Cấu hình Vite build & manualChunks
│   └── src/
│       ├── components/                        # Layouts, Navbar, Sidebar dùng chung
│       ├── modules/                           # Các module màn hình theo tính năng
│       ├── stores/                            # Redux Toolkit & RTK Query `baseApi`
│       └── routers/                           # Hệ thống định tuyến & Guard phân quyền
│
├── scripts/
│   ├── deploy.sh                              # Kịch bản triển khai tự động Zero-Downtime trên VPS
│   └── backup_db.sh                           # Kịch bản tự động sao lưu CSDL nén gzip & xoay vòng 7 ngày
│
├── docs/                                      # Tài liệu kiến trúc và hướng dẫn kỹ thuật
│   └── architecture/
│       ├── cicd_pipeline.md                   # Đặc tả chi tiết quy trình CI/CD & lệnh thực thi
│       ├── cicd_pipeline_diagram.png          # Sơ đồ khối 5 mắt xích CI/CD trực quan
│       ├── cicd_pipeline.docx                 # Tệp Word chuẩn hóa phục vụ thuyết trình
│       ├── backend_architecture.docx          # Tài liệu kiến trúc Backend
│       └── frontend_architecture.docx         # Tài liệu kiến trúc Frontend
│
└── .huh/skills/                               # Bộ quy chuẩn phát triển dành cho AI Agent & Kỹ sư
    ├── DEVOPS_SKILL.md                        # Cẩm nang tái lập 100% hạ tầng DevOps từ con số 0
    ├── BE_SKILL.md                            # Quy chuẩn lập trình Backend Modular Monolith
    └── FE_SKILL.md                            # Quy chuẩn lập trình Frontend React Vite
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
- **Java**: OpenJDK / Eclipse Temurin `>= 17`
- **Node.js**: `>= 20.x` (Khuyến nghị `Node 22 LTS`)
- **Database**: MySQL Server `>= 8.0`
- **Maven**: `>= 3.9` (hoặc Maven Wrapper đi kèm)

---

### 1. Khởi Tạo Cơ Sở Dữ Liệu MySQL

1. Mở MySQL Workbench hoặc terminal MySQL, tạo mới CSDL:
   ```sql
   CREATE DATABASE ban_hang_viet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Nạp dữ liệu khởi tạo toàn diện từ tệp [backend/src/main/resources/db/init_ban_hang_viet_full.sql](file:///d:/Intern/Codegym/BanHangViet/backend/src/main/resources/db/init_ban_hang_viet_full.sql):
   ```bash
   mysql -u root -p ban_hang_viet < backend/src/main/resources/db/init_ban_hang_viet_full.sql
   ```

---

### 2. Khởi Chạy Backend (Spring Boot)

1. Sao chép tệp mẫu biến môi trường tại thư mục `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Mở tệp `backend/.env` và điền cấu hình CSDL của bạn (mặc định: `root`/`root`):
   ```env
   PORT=8080
   DB_URL=jdbc:mysql://localhost:3306/ban_hang_viet?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=9a4f2c8d3e1b7f0a5c8d2e4b6a1f3c5e7a9b0c2d4e6f8a0b1c3d5e7f9a1b3c5e
   FRONTEND_URL=http://localhost:3000
   ```
3. Chạy ứng dụng Backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   > Backend sẽ khởi chạy tại: `http://localhost:8080` (Endpoint kiểm tra sức khỏe: `http://localhost:8080/api/v1/sync/health`).

---

### 3. Khởi Chạy Frontend (React Vite)

1. Di chuyển vào thư mục `frontend/` và cài đặt thư viện:
   ```bash
   cd frontend
   npm ci
   ```
2. Khởi chạy server phát triển:
   ```bash
   npm run dev
   ```
   > Frontend sẽ khởi chạy tại: `http://localhost:3000`.

---

## 🐳 Triển Khai Production & DevOps CI/CD

Toàn bộ quá trình triển khai môi trường Production được tự động hóa 100% qua GitHub Actions Pipeline ([.github/workflows/deploy.yml](file:///d:/Intern/Codegym/BanHangViet/.github/workflows/deploy.yml)):

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
|       Developer       |     |       CI Verify       |     |     Docker Build      |     |      SSH Deploy       |     |      Production       |
|                       | --> |                       | --> |                       | --> |                       | --> |                       |
|  (git push mọi nhánh) |     | (mvn test & npm build)|     |  (Multi-stage & GHCR) |     | (deploy.sh & Health)  |     |  (Zero-Downtime Live) |
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
```

### 3 Giai Đoạn Vận Hành Khép Kín:
1. **Stage 1 (Verify Song Song)**: Chạy trên 100% mọi nhánh khi push hoặc tạo PR (`mvn test -B` và `npm run lint && npm run build`). Nếu có lỗi, pipeline dừng ngay lập tức.
2. **Stage 2 (Build & Push GHCR)**: Chỉ kích hoạt khi commit vào nhánh `production`. Đóng gói Docker Multi-stage siêu nhẹ (`ghcr.io/lean1835/banhangviet-be` và `-fe`) với cả 2 thẻ tag `<sha>` và `:latest`.
3. **Stage 3 (Deploy Rolling VPS)**: Kết nối SSH vào VPS, đồng bộ `docker-compose.yml`, truyền bí mật `ENV_PRODUCTION` vào `backend/.env` và kích hoạt [scripts/deploy.sh](file:///d:/Intern/Codegym/BanHangViet/scripts/deploy.sh):
   - Khởi chạy Backend trước và thăm dò Health Check `/api/v1/sync/health` tối đa 4 phút.
   - Khi Backend chuyển sang trạng thái `healthy`, Frontend Nginx mới khởi chạy để tiếp nhận lưu lượng truy cập.
   - Dọn dẹp images cũ với `docker image prune -f` để tiết kiệm tài nguyên máy chủ.

> 📖 Chi tiết toàn bộ sơ đồ khối và lệnh kỹ thuật xem tại: [docs/architecture/cicd_pipeline.md](file:///d:/Intern/Codegym/BanHangViet/docs/architecture/cicd_pipeline.md).

---

## 🔐 Hệ Thống Phân Quyền Vai Trò (RBAC VT-01 - VT-06)

Hệ thống bảo mật phân quyền RBAC đa cấp độ đảm bảo an toàn nghiệp vụ tài chính:

| Mã Vai Trò | Tên Quyền Hạn | Mã Định Danh | Quyền Hạn Trọng Yếu |
| :---: | :--- | :--- | :--- |
| **VT-01** | **Quản Trị Nền Tảng** | `ROLE_PLATFORM_ADMIN` | Quản trị gói cước thuê bao SaaS, giám sát toàn bộ hộ kinh doanh. |
| **VT-02** | **Chủ Hộ Kinh Doanh** | `ROLE_HOUSEHOLD_OWNER`| Toàn quyền quản trị cửa hàng, xem báo cáo lãi gộp, nhân viên, phân quyền. |
| **VT-03** | **Kế Toán Trưởng** | `ROLE_CHIEF_ACCOUNTANT`| Quản lý xuất hóa đơn điện tử, lập tờ khai thuế 01-1, 01-2, đối soát nợ. |
| **VT-04** | **Thu Ngân POS** | `ROLE_CASHIER` | Mở/đóng ca bán hàng, tạo đơn hàng tại quầy POS, in bill hóa đơn. |
| **VT-05** | **Thủ Kho** | `ROLE_INVENTORY_STAFF` | Quản lý nhập hàng từ nhà cung cấp, kiểm kê kho định kỳ, xuất trả hàng. |
| **VT-06** | **Cơ Quan Thuế** | `ROLE_TAX_AUTHORITY` | Tra cứu dữ liệu truyền nhận hóa đơn điện tử theo quy định Thông tư 78. |

---

## 📖 Tài Liệu Tham Khảo Kỹ Thuật

- 🚀 [Quy Trình Tự Động Hóa CI/CD](file:///d:/Intern/Codegym/BanHangViet/docs/architecture/cicd_pipeline.md) (`docs/architecture/cicd_pipeline.md`)
- 📊 [Sơ Đồ Khối Tuyến Tính CI/CD (Hình Ảnh PNG)](file:///d:/Intern/Codegym/BanHangViet/docs/architecture/cicd_pipeline_diagram.png) (`docs/architecture/cicd_pipeline_diagram.png`)
- 📑 [Tài Liệu Thuyết Trình CI/CD (.docx)](file:///d:/Intern/Codegym/BanHangViet/docs/architecture/cicd_pipeline.docx) (`docs/architecture/cicd_pipeline.docx`)
- 📘 [Cẩm Nang DevOps Chuẩn Senior (Tái lập 100% VPS)](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/DEVOPS_SKILL.md) (`.huh/skills/DEVOPS_SKILL.md`)
- ☕ [Quy Chuẩn Kiến Trúc Backend Modular Monolith](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/BE_SKILL.md) (`.huh/skills/BE_SKILL.md`)
- ⚛️ [Quy Chuẩn Kiến Trúc Frontend React Vite](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md) (`.huh/skills/FE_SKILL.md`)

---

© 2026 **Bán Hàng Việt** - Nền tảng Quản lý Bán hàng & Điểm bán POS Thế hệ mới.
