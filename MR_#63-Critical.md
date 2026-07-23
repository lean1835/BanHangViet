# 🔍 CRITICAL RISK REPORT - PULL REQUEST #63

**Tên tính năng:** NCL-07 — Báo cáo doanh thu và nhật ký hoạt động (Reports & Activity Log / Dashboard)  
**Mã Commit:** `f5c383c5d0b0670d1845c073a176b845b81f005d`  
**Người thực hiện:** `buidinhtuan06092005@gmail.com`  
**Ngày review:** 23/07/2026  
**Phán quyết:** **REQUEST CHANGES ❌ (Bắt buộc Fix P1 trước khi Merge)**

---

## 1. 📋 ĐÁNH GIÁ MỨC ĐỘ HOÀN THÀNH YÊU CẦU NGHIỆP VỤ (EPIC NCL-07)

| Mã User Story | Tên User Story | Trạng thái | Ghi chú kiểm tra mã nguồn |
|---|---|---|---|
| `NCL-07-CN-001` | Báo cáo doanh thu theo ngày | **ĐẠT ✅** | Đã triển khai `RevenueReport.tsx` & endpoint `/reports/daily` trong `reportApi.ts`. |
| `NCL-07-CN-002` | Báo cáo theo mặt hàng | **ĐẠT ✅** | Đã triển khai endpoint `/reports/products` hiển thị danh mục mặt hàng. |
| `NCL-07-CN-003` | Đối chiếu tiền cuối ngày | **CẦN FIX ⚠️** | Đã dựng `ReconciliationTable.tsx`, tuy nhiên dính lỗi P1-1 lưu trạng thái khóa ở `localStorage`. |
| `NCL-07-CN-004` | Xem nhật ký hoạt động | **ĐẠT ✅** | Đã dựng `ActivityLogPage.tsx` & `RecentActivityPanel.tsx` tra cứu lịch sử thao tác. |
| `NCL-07-CN-005` | Bảng điều khiển tổng quan | **ĐẠT ✅** | Đã dựng `DashboardOverviewPage.tsx`, `SalesKpiCards.tsx`, `RevenueChart.tsx`, `PaymentMethodChart.tsx`. |
| `NCL-07-CN-006` | So sánh doanh thu giữa các kỳ | **ĐẠT ✅** | Đã dựng `RevenueComparison.tsx` & endpoint `/reports/comparison`. |
| `NCL-07-CN-007` | Thống kê mặt hàng bán chạy | **ĐẠT ✅** | Đã dựng `BestSellersWidget.tsx` & endpoint `/reports/top-selling`. |

---

## 2. 🚨 CHI TIẾT CÁC LỖI KỸ THUẬT CẦN KHẮC PHỤC (P1 & P2)

### 🟠 LỖI P1 (HIGH - BẮT BUỘC FIX TRƯỚC KHI MERGE)

#### 📍 P1-1 [Data Integrity / Persistence]: Lưu trạng thái Khóa đối chiếu tài chính vào `localStorage`
- **File:** [`frontend/src/modules/dashboard/components/ReconciliationTable.tsx`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/dashboard/components/ReconciliationTable.tsx#L157-L187)
- **Hiện trạng mã nguồn:**
  ```typescript
  // L157
  const saved = localStorage.getItem("locked_recon_dates");
  // L187
  localStorage.setItem("locked_recon_dates", JSON.stringify(newLocked));
  ```
- **Phân tích rủi ro:** 
  - `localStorage` nằm trên trình duyệt cục bộ, **không đồng bộ** giữa các tài khoản/thiết bị trong cùng Hộ kinh doanh.
  - Khi Nhân viên A khóa sổ đối chiếu trên máy A, Nhân viên B hoặc Chủ hộ đăng nhập ở máy B sẽ **KHÔNG** biết ngày đó đã được khóa, dẫn đến nguy cơ ghi đè hoặc chỉnh sửa dữ liệu tài chính trái phép.
  - Khi dọn dẹp cache trình duyệt, toàn bộ thông tin khóa đối chiếu sẽ bị mất sạch.
- **Hành động khắc phục bắt buộc:** 
  - Gỡ bỏ hoàn toàn việc đọc/ghi `localStorage` cho danh sách ngày khóa đối chiếu.
  - Trạng thái khóa đối chiếu phải dựa trực tiếp vào trường dữ liệu `isLocked` (hoặc danh sách ngày đã khóa) do Backend API trả về trong `IReconciliationResponse`.

---

#### 📍 P1-2 [RTK Query / Cache]: Thiếu Cache Tag Invalidation cho các Widgets Dashboard Overview
- **File:** [`frontend/src/modules/report/services/reportApi.ts`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/services/reportApi.ts#L15-L60)
- **Hiện trạng mã nguồn:** 
  Các endpoints `getDashboardOverview`, `getDailyRevenue`, `getProductRevenue`, `getTopSellingProducts` **không** được cấu hình `providesTags`. Mutation `lockReconciliation` chỉ invalidates tag `{ type: API_TAG_TYPES.REPORT, id: "RECON_..." }` và `LOGS`.
- **Phân tích rủi ro:** Khi người dùng thực hiện khóa đối chiếu ngày hoặc cập nhật dữ liệu tài chính, các widget KPI, biểu đồ doanh thu và sản phẩm bán chạy trên Dashboard Overview sẽ **không tự động refetch**, dẫn tới hiển thị số liệu cũ (Stale Cache) cho đến khi người dùng F5 lại trang.
- **Hành động khắc phục bắt buộc:** 
  - Gán `providesTags: [{ type: API_TAG_TYPES.REPORT, id: "DASHBOARD" }]` cho các endpoint lấy báo cáo tổng quan.
  - Cấu hình mutation `lockReconciliation` invalidates cả tag `"DASHBOARD"`.

---

### 🟡 LỖI P2 & P3 (CODE SMELL / CONVENTION)

#### 📍 P2-1 [TypeScript / Type Safety]: Lạm dụng kiểu `any` vi phạm FE_SKILL Section 13
- **File:** [`ReconciliationTable.tsx`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/dashboard/components/ReconciliationTable.tsx#L45) & [`ActivityLogPage.tsx`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/ActivityLogPage.tsx#L167)
- **Hiện trạng code:**
  ```typescript
  const shiftSum = shiftsList.reduce((sum: number, s: any) => ...);
  {shiftsList.map((shift: any) => ...)}
  let parsed: any = null;
  ```
- **Vi phạm:** Vi phạm mục 13 của [`FE_SKILL.md`](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md#L238) ("Không có file hoặc biến khai báo kiểu any mà không ghi chú rõ nguyên nhân").
- **Khắc phục:** Khai báo kiểu dữ liệu minh bạch cho `shift: IShiftItem` và `parsed: TLogPayload`.

---

#### 📍 P2-2 [Code Quality]: Gọi `refetch()` thủ công trên sự kiện Click
- **File:** [`RevenueComparison.tsx`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/components/RevenueComparison.tsx#L220) & [`ActivityLogPage.tsx`](file:///d:/Intern/Codegym/BanHangViet/frontend/src/modules/report/pages/ActivityLogPage.tsx#L403)
- **Hiện trạng code:** `onClick={() => void refetch()}`
- **Khắc phục:** RTK Query sẽ tự động refetch khi params (state) thay đổi. Hạn chế gắn trực tiếp `refetch()` vào onClick trừ trường hợp nút "Làm mới" chủ động.

---

## 3. 🎯 HƯỚNG DẪN KHẮC PHỤC DÀNH CHO DEVELOPER (ACTION ITEMS)

1. **Loại bỏ `localStorage` khỏi `ReconciliationTable.tsx`:** Sử dụng thuộc tính `isLocked` trả về từ `getReconciliation` API để disable nút/form khóa đối chiếu.
2. **Cập nhật Tag Invalidation trong `reportApi.ts`:** Thêm `API_TAG_TYPES.REPORT` tags cho tất cả query endpoints báo cáo để đảm bảo dữ liệu Dashboard luôn được cập nhật đồng bộ.
3. **Thay thế toàn bộ kiểu `any`:** Bổ sung interfaces thích hợp cho `shiftsList` và log JSON payloads.
