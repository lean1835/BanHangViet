# Configuration Layer

Thư mục này chứa tất cả các lớp cấu hình hệ thống toàn cục của ứng dụng.

## Quy tắc thiết kế
- Chứa cấu hình Spring Security, CORS, JWT Filter, Async, Mail, Cloudinary, v.v.
- Các hằng số cấu hình nhạy cảm phải được load từ tệp `.properties` hoặc `.yaml` thông qua `@Value` hoặc `@ConfigurationProperties`.
- Không viết logic nghiệp vụ trong lớp cấu hình.

## Đặt tên
- Sử dụng hậu tố `Config` hoặc `Configuration` (ví dụ: `SecurityConfig`, `CORSConfig`).
