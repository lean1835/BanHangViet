# Global Store Directory (Redux Toolkit)

Cấu hình Redux Store và các API query cache.

## Nội dung chính
- `baseApi.ts`: Khởi tạo RTK Query `baseApi` với baseUrl và header Authorization dùng chung.
- `globalSlice.ts`: Redux Slice quản lý trạng thái giao diện UI chung (ví dụ: theme sáng tối, ngôn ngữ).
- `index.ts`: Tổ chức khởi tạo store kết hợp middleware.
- Sử dụng RTK Query để gọi và quản lý cache API từ Server, hạn chế đưa biến UI tạm lên Global Store.
