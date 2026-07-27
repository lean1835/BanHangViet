# Exception Handling Layer

Hệ thống quản lý và xử lý lỗi tập trung toàn cục cho ứng dụng.

## Cấu trúc chuẩn
- `AppException.java`: Lớp RuntimeException custom, nhận tham số đầu vào là một `ErrorCode` cụ thể.
- `ErrorCode.java` (Enum): Định nghĩa danh sách các mã lỗi nghiệp vụ, đi kèm HttpStatusCode và thông báo mô tả lỗi tương ứng.
- `GlobalExceptionHandler.java`: Sử dụng `@ControllerAdvice` để bắt các Exception ném ra từ Controller/Service và đóng gói thành `ApiResponse` chuẩn trả về cho Client.
