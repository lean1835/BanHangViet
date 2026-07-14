# Service Interfaces Package

Định nghĩa ranh giới nghiệp vụ (Business Boundaries) bằng các Java Interface.

## Quy tắc thiết kế
- Chỉ chứa khai báo chữ ký hàm của dịch vụ (Service methods).
- Đóng vai trò làm cổng giao tiếp để decoupling (giảm liên kết cứng) giữa Controller và Service Implementation thực tế, giúp dễ dàng Mock test.
- Đặt tên file sử dụng tiền tố/hậu tố dịch vụ rõ ràng (ví dụ: `UserService.java`, `ProductService.java`).
