# Controller Layer (REST Controllers)

Lớp định tuyến và tiếp nhận các yêu cầu HTTP từ Client.

## Quy tắc thiết kế
- Chỉ chịu trách nhiệm điều hướng request, gọi tầng Service xử lý nghiệp vụ và trả về dữ liệu.
- **Tuyệt đối không** viết logic nghiệp vụ, tính toán hoặc gọi trực tiếp tầng Repository tại đây.
- Sử dụng `@Valid` để kiểm tra sơ bộ dữ liệu đầu vào.
- Trả về đối tượng đồng nhất `ResponseEntity<ApiResponse<T>>`.

## Đặt tên & Mapping
- Đặt tên lớp có hậu tố `Controller` (ví dụ: `AuthController`, `ProductController`).
- API Endpoint viết thường, sử dụng `kebab-case` (ví dụ: `/api/v1/user-profiles`).
