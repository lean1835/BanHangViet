# 📊 TECHNICAL SUMMARY REPORT - MERGE REQUEST / PR #63

**Tên tính năng:** NCL-07 — Báo cáo doanh thu và nhật ký hoạt động (Reports & Activity Log / Dashboard)  
**Mã Commit:** `f5c383c5d0b0670d1845c073a176b845b81f005d`  
**Tác giả:** `buidinhtuan06092005@gmail.com`  
**Ngày review:** 23/07/2026  
**Trạng thái:** **REQUEST CHANGES ❌ (Bắt buộc Fix P1 trước khi Merge)**  
**Tài liệu quy chuẩn áp dụng:** [`FE_SKILL.md`](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md), [`code_review.rule.md`](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/code_review.rule.md), [`Yêu cầu hệ thống (Excel)`](file:///d:/Intern/Codegym/BanHangViet/.huh/ptyc/Y%C3%AAu%20c%E1%BA%A7u%20h%E1%BB%87%20th%E1%BB%91ng%20%28excel%29/Epics%20%28Nh%C3%B3m%20ch%E1%BB%A9c%20n%C4%83ng%29.html#L228)

---

## 1. 📌 PHÁN QUYẾT & TỔNG QUAN REVIEW

| Tiêu chí | Trạng thái | Ghi chú ngắn |
|---|---|---|
| **Phán quyết cuối cùng** | **REQUEST CHANGES ❌** | Đã triển khai đầy đủ 7/7 User Stories của Epic NCL-07, nhưng tồn tại **02 lỗi P1 (High)** về toàn vẹn dữ liệu đối chiếu và quản lý cache. |
| **Rủi ro vận hành** | **🟡 TRUNG BÌNH** | Dữ liệu trạng thái khóa đối chiếu ngày (`locked_recon_dates`) bị lưu ở `localStorage` trên trình duyệt gây sai lệch giữa các thiết bị/nhân viên. |
| **Sẵn sàng Production** | **⚠️ CẦN KHẮC PHỤC** | Yêu cầu sửa lỗi P1-1 và P1-2 trước khi merge vào nhánh `develop`. |

---

## 2. 📊 BẢNG ĐÁNH GIÁ ĐIỂM SỐ (SCORECARD)

| Tiêu chí | Điểm /10 | Đánh giá & Ghi chú chi tiết theo quy chuẩn |
|---|---|---|
| **Tính năng (Feature Completion)** | **9.0 / 10** | Hoàn thành đủ 7/7 User Stories `NCL-07-CN-001` đến `NCL-07-CN-007` (Doanh thu ngày, Bán chạy, Đối chiếu, Nhật ký, Dashboard overview, So sánh kỳ). |
| **Hiệu suất (Performance)** | **7.5 / 10** | Tích hợp RTK Query tốt nhưng thiếu khai báo `providesTags` đầy đủ ở `reportApi.ts`, gây hiện tượng stale cache khi thực hiện chốt khóa đối chiếu. |
| **Bảo mật & Toàn vẹn Dữ liệu** | **6.5 / 10** | **Sai sót P1:** Lưu danh sách ngày đã khóa đối chiếu vào `localStorage` của trình duyệt thay vì đọc từ trạng thái `isLocked` trả về từ Backend API. |
| **Chất lượng mã nguồn (Code Quality)** | **7.5 / 10** | Vi phạm quy chuẩn [`FE_SKILL.md`](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md#L238): Còn sử dụng kiểu `any` trong `ReconciliationTable.tsx` và `ActivityLogPage.tsx`. |
| **Git Hygiene** | **8.0 / 10** | Commit `f5c383c` có message `"fix dashboard ui"` gọn gàng, tuy nhiên nên chi tiết hóa phạm vi thay đổi. |
| **TỔNG ĐIỂM TRUNG BÌNH** | **7.7 / 10** | **KHÁ (REQUEST CHANGES DO LỖI P1)** |

---

## 3. 🛠️ CHI TIẾT CÁC LỖI BẮT BUỘC FIX TRƯỚC KHI MERGE

1. **[P1-1] [Data Integrity] Lưu trạng thái đối chiếu tài chính ở `localStorage`:** Tệp `ReconciliationTable.tsx` đọc/ghi `localStorage.getItem("locked_recon_dates")` làm hỏng tính nhất quán dữ liệu giữa các máy tính khác nhau trong cùng Hộ kinh doanh.
2. **[P1-2] [RTK Query / Stale Cache] Thiếu Invalidate Tags cho Dashboard Overview:** `reportApi.ts` chưa gán `providesTags` cho `getDashboardOverview`, `getDailyRevenue`, `getProductRevenue`, dẫn tới việc thông tin trên Dashboard không được làm tươi tự động sau khi đối chiếu.
3. **[P2-1] [FE_SKILL Rule #13] Lạm dụng kiểu `any`:** `shiftsList.reduce((sum: number, s: any) => ...`, `shift: any`, `parsed: any`.
4. **[P2-2] [Validation] Thiếu kiểm tra ràng buộc khoảng thời gian:** `RevenueComparison.tsx` chưa áp dụng Zod schema để validate ngày bắt đầu <= ngày kết thúc.

*(Chi tiết kỹ thuật từng dòng code đính kèm tại [`MR_#63-Critical.md`](file:///d:/Intern/Codegym/BanHangViet/MR_%2363-Critical.md)).*
