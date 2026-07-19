# Pages Directory

Chứa các trang cấp ứng dụng dùng để kết hợp nhiều module. Trang thuộc một nghiệp vụ cụ thể phải đặt trong `src/modules/<feature>/pages`.

## Quy tắc thiết kế
- Không đặt page nghiệp vụ trực tiếp tại đây; ví dụ trang tổng quan nằm trong `modules/dashboard/pages`.
- Sử dụng Lazy loading (`React.lazy`) kết hợp với `Suspense` trên Router để tối ưu hóa hiệu suất tải trang ban đầu.
- Đặt tên file theo chuẩn chữ hoa đầu từ (`PascalCase`), kèm theo hậu tố `Page` (ví dụ: `ProductDetailPage.tsx`).
