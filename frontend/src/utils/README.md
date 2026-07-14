# Utilities & Helper Directory

Chứa các hàm tiện ích trợ giúp logic trong dự án, hoàn toàn không lưu trạng thái (stateless).

## Quy tắc thiết kế
- Chứa các hàm định dạng tiền tệ (`formatCurrency.ts`), xử lý ngày tháng (`formatDate.ts`), kiểm tra định dạng email/sđt, v.v.
- Không chứa component UI hoặc hooks.
- Đặt tên file theo chuẩn `camelCase`.
