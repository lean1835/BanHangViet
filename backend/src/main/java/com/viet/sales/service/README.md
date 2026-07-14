# Service Layer (Business Logic)

Nơi tập trung xử lý toàn bộ logic nghiệp vụ của dự án.

## Quy tắc thiết kế
- Chia làm hai thư mục con để đảm bảo tính decoupling (lỏng lẻo liên kết):
  - `interfaces/`: Định nghĩa các hàm nghiệp vụ (ví dụ: `UserService`).
  - `classes/`: Chứa các lớp triển khai thực tế của Interface (ví dụ: `UserServiceImpl`).
- Lớp cài đặt cụ thể được đánh dấu `@Service` và thực hiện liên kết `@Transactional` đối với các tác vụ ghi (write/update) nhiều bảng đồng thời.
- Đóng gói logic tính toán nghiệp vụ, gọi tầng repository để lưu trữ hoặc truy vấn DB.
