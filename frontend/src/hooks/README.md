# Custom Hooks Directory

Chứa các custom React Hooks dùng chung cho toàn bộ dự án.

## Quy tắc thiết kế
- Tách biệt logic xử lý state phức tạp hoặc các tác vụ tương tác sự kiện (ví dụ: click outside, local storage sync, query params state).
- Đặt tên tệp và tên hàm bắt đầu bằng tiền tố `use` theo chuẩn `camelCase` (ví dụ: `useLocalStorage.ts`, `useWindowSize.ts`).
