# Pages Directory

Chứa các thành phần đại diện cho các trang hiển thị chính của ứng dụng.

## Quy tắc thiết kế
- Mỗi file tương ứng với một màn hình định tuyến cụ thể (ví dụ: `LoginPage.tsx`, `DashboardPage.tsx`).
- Sử dụng Lazy loading (`React.lazy`) kết hợp với `Suspense` trên Router để tối ưu hóa hiệu suất tải trang ban đầu.
- Đặt tên file theo chuẩn chữ hoa đầu từ (`PascalCase`), kèm theo hậu tố `Page` (ví dụ: `ProductDetailPage.tsx`).
