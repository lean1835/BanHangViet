# Service Implementations Package

Nơi triển khai cài đặt chi tiết cho các Service Interface.

## Quy tắc thiết kế
- Chứa các class implement trực tiếp các Interface trong thư mục `interfaces/` (ví dụ: `UserServiceImpl.java`).
- Được chú thích bằng `@Service` của Spring.
- Chứa logic nghiệp vụ chi tiết, gọi tới các Repository để đọc ghi DB và phối hợp các Transaction thông qua annotation `@Transactional`.
- Đặt tên file sử dụng hậu tố `ServiceImpl` (ví dụ: `UserServiceImpl.java`).
