# Request DTO Package

Chứa các đối tượng truyền tải dữ liệu (Data Transfer Objects) đầu vào từ Client gửi lên.

## Quy tắc thiết kế
- Chứa các class biểu diễn dữ liệu của HTTP request body (ví dụ: `LoginRequest`, `CreateUserRequest`).
- Áp dụng các Annotation validation trực tiếp trên các trường dữ liệu để tự động kiểm tra định dạng đầu vào (ví dụ: `@NotNull`, `@NotBlank`, `@Size`, `@Email`).
- Đặt tên file sử dụng hậu tố `Request` (ví dụ: `RegisterRequest.java`).
