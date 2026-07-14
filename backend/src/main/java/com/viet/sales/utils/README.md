# Utility Layer

Chứa các hàm tiện ích dùng chung cho hệ thống, hoàn toàn không lưu trạng thái (stateless).

## Quy tắc thiết kế
- Chứa các class Helper xử lý chuỗi, định dạng ngày tháng, hash mật khẩu, kiểm tra mã, mã hóa token JWT (ví dụ: `PasswordUtil`, `DateUtil`).
- Không chứa các logic nghiệp vụ (business logic) của dự án.
