# Shared Components Directory

Chứa các components giao diện dùng chung trong toàn bộ dự án.

## Quy tắc thiết kế
- `common/`: Chứa các component nguyên tử dùng chung (ví dụ: `Button.tsx`, `Input.tsx`, `Table.tsx`).
- `layouts/`: Chứa các khung layout chính của dự án (ví dụ: `MainLayout.tsx`, `AuthLayout.tsx`).
- Đặt tên file component sử dụng chữ hoa đầu từ (`PascalCase`).
- Tuyệt đối không chứa logic nghiệp vụ phức tạp liên kết trực tiếp với dữ liệu API cụ thể của một trang/module.
