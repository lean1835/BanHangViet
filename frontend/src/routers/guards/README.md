# Router Guards Package

Chứa các Route Guards để kiểm soát quyền truy cập trang của người dùng.

## Ví dụ
- `PrivateRoute.tsx`: Kiểm tra trạng thái đăng nhập, nếu chưa đăng nhập sẽ chuyển hướng (redirect) về màn hình `/login`.
- `PublicRoute.tsx`: Chặn người dùng đã đăng nhập quay lại màn hình `/login` hoặc `/register`.
- Đặt tên file theo chuẩn `PascalCase`.
