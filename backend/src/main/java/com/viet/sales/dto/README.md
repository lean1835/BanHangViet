# Data Transfer Object (DTO) Layer

Chứa các lớp cấu trúc truyền tải dữ liệu giữa Client và Server.

## Quy tắc thiết kế
- Chia làm hai thư mục con:
  - `request/`: Chứa các dữ liệu đầu vào nhận từ Client (ví dụ: `RegisterRequest`).
  - `response/`: Chứa cấu trúc dữ liệu trả ra cho Client (ví dụ: `UserResponse`).
- Chứa file `ApiResponse.java` quy chuẩn hóa định dạng JSON trả về:
  ```json
  {
    "code": 1000,
    "message": "Success",
    "result": { ... }
  }
  ```
- Sử dụng các Annotation validation như `@NotBlank`, `@Size`, `@NotNull` trên DTO để kiểm tra dữ liệu đầu vào.
