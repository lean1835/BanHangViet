# Routers Directory

Cấu hình định tuyến (Routing) toàn bộ ứng dụng.

## Nội dung chính
- `guards/`: Chứa các Component bảo vệ route (ví dụ: `PrivateRoute` chặn truy cập trái phép, `PublicRoute` chặn đăng nhập lại).
- `AppRouter.tsx`: Cấu hình danh sách các routes tập trung.
- Mỗi module độc lập dùng route top-level riêng (`/products`, `/shifts`, `/orders`, ...); chỉ route tổng quan dùng `/dashboard`.
- Chỉ lồng path khi màn hình thực sự là con của cùng nghiệp vụ (`/products/stock-entry`, `/reports/revenue`, ...).
- Sử dụng `react-router-dom` v6/v7 để định nghĩa.
- Đặt tên file theo chuẩn `PascalCase`.
