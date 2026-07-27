# Repository Layer (Spring Data JPA)

Tầng tương tác dữ liệu trực tiếp với Database.

## Quy tắc thiết kế
- Kế thừa `JpaRepository<Entity, ID>` của Spring Data.
- Đối với các chức năng lọc tìm kiếm nâng cao/động, kế thừa thêm `JpaSpecificationExecutor<Entity>`.
- Tránh viết logic nghiệp vụ phức tạp ở đây. Sử dụng `@EntityGraph` hoặc `join fetch` trong câu truy vấn custom khi cần giải quyết vấn đề N+1 query.
- Đặt tên lớp có hậu tố `Repository` (ví dụ: `UserRepository`).
