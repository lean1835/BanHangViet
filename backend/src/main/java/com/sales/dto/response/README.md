# Response DTO Package

Chứa các đối tượng truyền tải dữ liệu (Data Transfer Objects) đầu ra gửi trả lại cho Client.

## Quy tắc thiết kế
- Chứa các class biểu diễn dữ liệu phản hồi của API (ví dụ: `UserResponse`, `AuthResponse`).
- Giúp ẩn đi các trường dữ liệu nhạy cảm của Entity gốc (như mật khẩu, khóa bí mật, token nội bộ).
- Đặt tên file sử dụng hậu tố `Response` (ví dụ: `UserResponse.java`).
