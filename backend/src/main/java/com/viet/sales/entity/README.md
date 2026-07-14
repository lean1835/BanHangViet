# Entity Layer (JPA Entities)

Định nghĩa các đối tượng ORM map trực tiếp với các bảng trong cơ sở dữ liệu.

## Quy tắc thiết kế
- Sử dụng các Annotation chuẩn của Jakarta Persistence (`@Entity`, `@Table`, `@Id`, `@Column`).
- Sử dụng `@CreationTimestamp` cho `created_at` và `@UpdateTimestamp` cho `updated_at`.
- Tên bảng dùng kiểu chữ thường cách nhau bởi dấu gạch dưới (`snake_case`).
- Tránh sử dụng kiểu tải dữ liệu `EAGER` mặc định trên các quan hệ để tránh lỗi N+1 query.
