# Feature Modules Directory

Chứa các module nghiệp vụ chính (Feature Areas) của ứng dụng.

## Cấu trúc thư mục module nghiệp vụ:
Mỗi module lớn (ví dụ: `auth`, `product`, `order`, `user`) sẽ chứa các thư mục con riêng:
```
[feature_name]/
├── components/ # Các UI Component chỉ phục vụ riêng cho module này
├── services/   # Các RTK Query endpoints dùng để gọi API liên quan tới module
└── types/      # Định nghĩa các TypeScript interfaces riêng của module
```

## Nguyên tắc thiết kế
- **Tách biệt nghiệp vụ (Isolation)**: Các thành phần chỉ phục vụ riêng cho một chức năng thì phải đặt trong thư mục của module đó, không đặt ở thư mục dùng chung toàn cục.
- Quy chuẩn đặt tên thư mục module viết thường ngăn cách bằng snake_case (ví dụ: `shopping_cart`, `product_list`).
