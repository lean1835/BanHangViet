# Specification Layer (JPA Specifications)

Định nghĩa các dynamic query nâng cao thông qua JPA Criteria API.

## Quy tắc thiết kế
- Sử dụng các Specification tĩnh để kết hợp tìm kiếm nhiều tham số động trên Client gửi lên (như bộ lọc sản phẩm theo khoảng giá, trạng thái, ngày tạo...).
- Giúp tái sử dụng điều kiện truy vấn dữ liệu dễ dàng mà không cần phải viết SQL thô hoặc ghép chuỗi native.
- Sử dụng kết hợp với `JpaSpecificationExecutor` tại Repository.
