# 📋 TECHNICAL SUMMARY: CODE REVIEW LOCAL UNCOMMITTED CHANGES
**Mã nghiệp vụ:** NCL-11 (4 Chức năng): Trả hàng, hoàn tiền và điều chỉnh giảm hóa đơn  
**Ngày review:** 21/08/2026  
**Trạng thái phán quyết:** **APPROVED ✅**  
**Hệ số chấm điểm tổng thể:** **9.8 / 10**

---

## 1. TỔNG QUAN PHẠM VI (SCOPE & METRICS)

| Thông số | Chi tiết |
|---|---|
| **Mục tiêu Epic** | NCL-11: Trả hàng, hoàn tiền và điều chỉnh giảm hóa đơn (Xử lý toàn vẹn luồng khách trả lại hàng sau khi xuất HĐĐT, hoàn tồn kho, hoàn tiền/giảm công nợ, phát hành HĐ điều chỉnh giảm, báo cáo thống kê hàng trả lại) |
| **Quy chuẩn đối chiếu** | [BE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/BE_SKILL.md), [FE_SKILL.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/FE_SKILL.md), [code_review.rule.md](file:///d:/Intern/Codegym/BanHangViet/.huh/skills/code_review.rule.md) |
| **Số files thay đổi** | **19 files** (5 files Backend Java, 14 files Frontend React/TypeScript/CSS) |
| **Backend Tests** | **40/40 Unit & Integration Tests Passed** (`com.sales.controller.ReturnTicketControllerTest`, `com.sales.service.ReturnTicketServiceImplTest`) |
| **Frontend Tests** | **23/23 Vitest Tests Passed** (Bao gồm đầy đủ test case cho Table, Modals, Helpers, Sidebar, Statistics) |
| **Linter / Typecheck** | **0 Errors, 0 Warnings** (`eslint . --max-warnings 0`) |

---

## 2. MA TRẬN ĐỐI CHIẾU YÊU CẦU NGHIỆP VỤ (YCHT - NCL-11)

| Mã Chức Năng | Tên Chức Năng | Quy Tắc Nghiệp Vụ (QTN) & Acceptance Criteria | Trạng Thái Đạt Được |
|---|---|---|:---:|
| **NCL-11-CN-001** | **Lập phiếu trả hàng từ hóa đơn đã cấp mã** | - **QTN-18**: Chỉ lập phiếu cho HĐ đã cấp mã (`ISSUED`/`ADJUSTED`), chưa hủy.<br>- **QTN-18 (Hạn 7 ngày)**: Cảnh báo quá hạn và chỉ cho lập khi Chủ hộ (`VT-01`) xác nhận ngoại lệ (`allowOverdueOverride`).<br>- **QTN-19**: Chặn trả vượt số lượng đã bán trừ các lần đã trả trước.<br>- **Phân quyền**: Chỉ Chủ hộ (`VT-01`) và Thu ngân (`VT-02`) được lập phiếu. | **ĐẠT CHUẨN ✅** |
| **NCL-11-CN-002** | **Duyệt phiếu trả hàng và hoàn tiền cho khách** | - **Phân quyền**: Chỉ Chủ hộ (`VT-01`) có quyền duyệt hoặc từ chối phiếu.<br>- **Hoàn tồn kho**: Cộng hoàn tồn kho nguyên tử (`addStock`) vào kho hàng.<br>- **Hình thức hoàn**: Tiền mặt (`CASH`), Chuyển khoản (`BANK_TRANSFER`), Giảm trừ công nợ (`DEBT_REDUCTION`).<br>- **Lưu vết**: Ghi nhận `approvedByUser`, `approvedAt`, `rejectReason`, `rejectedAt`, `ActivityLog`. | **ĐẠT CHUẨN ✅** |
| **NCL-11-CN-003** | **Lập hóa đơn điều chỉnh giảm cho phần hàng trả lại** | - **QTN-20**: Hóa đơn điều chỉnh giảm liên kết cả HĐ gốc (`originalInvoice`) và phiếu trả hàng (`returnTicket`).<br>- Chuyển trạng thái HĐ gốc sang `ADJUSTED`, ghi `InvoiceStatusLog`.<br>- Sinh mã tra cứu, số hóa đơn tăng dần theo pattern/symbol của HĐ gốc.<br>- **Phân quyền**: Kế toán (`VT-03`) và Chủ hộ (`VT-01`). | **ĐẠT CHUẨN ✅** |
| **NCL-11-CN-004** | **Theo dõi hàng trả lại và tiền đã hoàn** | - Lọc theo khoảng thời gian (`fromDate`, `toDate`).<br>- Tổng hợp KPI: Tổng số phiếu, đã duyệt, chờ duyệt, từ chối, tổng tiền hoàn, tổng SL trả.<br>- Phân loại theo hình thức hoàn tiền.<br>- Bảng xếp hạng **Top 10 mặt hàng bị trả nhiều nhất**.<br>- Chuỗi dữ liệu biểu đồ/bảng theo ngày (Daily timeline).<br>- **Phân quyền**: Kế toán (`VT-03`) và Chủ hộ (`VT-01`). | **ĐẠT CHUẨN ✅** |

---

## 3. CHECKLIST KIỂM TRA KỸ THUẬT & QUY CHUẨN KIẾN TRÚC

### 3.1 Backend (Spring Boot + Spring Security + JPA)
- [x] **Layer Isolation**: Controller chỉ đóng vai trò HTTP Adapter (nhận request, validate `@Valid`, kiểm tra `@PreAuthorize`, gọi Service). Mọi logic tính thuế, kiểm tra thời hạn, trừ/cộng tồn kho và giảm công nợ đóng gói 100% trong `ReturnTicketServiceImpl`.
- [x] **Transaction Integrity**: Toàn bộ thao tác ghi có `@Transactional(rollbackFor = Exception.class)`. Các giao dịch hoàn tồn kho, giảm công nợ, lưu HĐ điều chỉnh và ghi log chuyển trạng thái thực thi atomic.
- [x] **N+1 Query Avoidance**: Truy vấn qua `@EntityGraph` (eager nạp `items`, `product`, `createdByUser`, `household`, `originalInvoice`) và JPQL Aggregation Projections (`findDailyReturnStatistics`, `countTicketsByStatus`, `findTopReturnedProducts`, `findReturnedQuantitiesByInvoiceId`). Không có vòng lặp gọi repository.
- [x] **Validation & Exception Handling**: Sử dụng `AppException` với `ErrorCode` chuẩn hóa; bắt lỗi tập trung tại `GlobalExceptionHandler`.
- [x] **Security**: Phân quyền tường minh bằng `@PreAuthorize("hasRole(...)")` theo chuẩn mã vai trò hệ thống (`VT-01`, `VT-02`, `VT-03`). Dynamic queries dùng JPA Criteria Specification, ngăn chặn SQL Injection tuyệt đối.

### 3.2 Frontend (React 19 + TypeScript + RTK Query + Tailwind CSS)
- [x] **API Integration**: Module hóa trong `src/modules/return_ticket/services/returnTicketApi.ts` qua `baseApi.injectEndpoints`. Không dùng `axios`/`fetch` trực tiếp.
- [x] **Cache Invalidation**: Cấu hình `providesTags` và `invalidatesTags` chuẩn xác (`ReturnTicket`, `Invoice`, `Product`, `Debt`, `Report`).
- [x] **State Management**: Server state được cache tự động qua Redux Toolkit; UI state (dialog, tabs, form steps, filters) dùng `useState`.
- [x] **Form Validation & Realtime Calculations**: Ràng buộc chặt chẽ số lượng trả nguyên tử (1, 2, 3...) không vượt `returnableQuantity`, tự động tính toán thuế GTGT, thành tiền và tiền hoàn theo thời gian thực.
- [x] **Design System & UX**: Áp dụng giao diện hiện đại với design tokens (`kv-blue-primary`, `emerald`, `amber`, `rose`), Dialog trợ năng (Accessibility & Focus trap với `useAccessibleDialog`), hỗ trợ xem và in phiếu trả hàng chuẩn mẫu kế toán (`ReturnTicketPrintModal`).

---

## 4. BẢNG CHỈ SỐ ĐÁNH GIÁ (SCORECARD)

| Tiêu chí | Điểm /10 | Ghi chú đánh giá |
|---|:---:|---|
| **1. Tính năng (Features)** | **10.0 / 10** | Đáp ứng trọn vẹn 100% các Acceptance Criteria của cả 4 User Stories NCL-11-CN-001 -> 004 và các quy tắc QTN-18, QTN-19, QTN-20. |
| **2. Hiệu suất (Performance)** | **9.8 / 10** | Dùng JPA Projections và `@EntityGraph` loại bỏ N+1 query. Phân trang phía backend. Frontend dùng `useMemo` tính toán real-time mượt mà. |
| **3. Bảo mật (Security)** | **10.0 / 10** | Phân quyền đa tầng: Controller `@PreAuthorize` + Service programmatic check + Frontend conditional rendering + Route guards. |
| **4. Code Quality** | **9.7 / 10** | Phân tách module sạch sẽ (`types`, `services`, `components`, `pages`, `utils`). TypeScript strict mode, 0 lint warning. |
| **5. Git Hygiene & Test Coverage**| **9.5 / 10** | 40/40 tests backend passed, 23/23 tests frontend passed. Không có code rác hay hardcode. |

---

## 5. KẾT LUẬN & HƯỚNG DẪN TIẾP THEO
- **Phán quyết:** **APPROVED ✅** (Không tồn tại lỗi P0 hay P1).
- **Hành động:** Mã nguồn đã sẵn sàng để commit và push lên nhánh tính năng/tạo Merge Request vào nhánh `develop`.
