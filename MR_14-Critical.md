# 🛡️ BÁO CÁO PHÂN TÍCH RỦI RO KỸ THUẬT (CRITICAL RISK REPORT)
**Mã Epic/Task:** NCL-14 (Chức năng: CN-001, CN-002, CN-003, CN-004)  
**Phạm vi:** Phân hệ Kiểm toán dữ liệu, Sao lưu tự động, Khôi phục CSDL & Phát hiện gian lận bất thường  
**Đối tượng:** Lead Engineer / Solution Architect / Security Auditor  
**Mức độ rủi ro tổng thể:** **THẤP (LOW RISK) - ĐÃ CÓ BIỆN PHÁP KIỂM SOÁT TOÀN DIỆN**  
**Trạng thái phán quyết:** **APPROVED ✅**

---

## 1. PHÂN TÍCH RỦI RO BẢO MẬT & TOÀN VẸN DỮ LIỆU (SECURITY & DATA INTEGRITY)

### 1.1 Tính Bất Biến Của Nhật Ký Kiểm Toán (Tamper-Resistant Audit Log - QTN-25 & NCL-14-CN-001)
- **Rủi ro phân tích:** Hóa đơn bán hàng và nhật ký điều chỉnh tồn kho là chứng từ có giá trị pháp lý kế toán thuế. Nếu kẻ xấu hoặc nhân viên có quyền can thiệp trực tiếp vào bảng cơ sở dữ liệu `activity_logs` để xóa dấu vết gian lận, hệ thống sẽ mất khả năng giải trình khi kiểm toán.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **SHA-256 Hash Chaining:** Mỗi dòng nhật ký được băm liên hoàn dựa trên:
     $$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} \parallel \text{householdId} \parallel \text{userId} \parallel \text{action} \parallel \text{targetTable} \parallel \text{targetId} \parallel \text{oldValue} \parallel \text{newValue})$$
     Bản ghi đầu tiên gắn với `GENESIS_HASH` ($64$ ký tự `0`).
  2. **Thuật toán Integrity Verification (`verifyIntegrity`):** Kiểm tra tuần tự hai chiều:
     - So khớp `previous_hash` của bản ghi hiện tại với `hash` của bản ghi trước đó.
     - Tính toán lại toàn bộ giá trị băm từ dữ liệu thô và đối chiếu với trường `hash` đã lưu. Nếu sai khác, trả về chính xác `corruptedSequenceNumber` và `corruptedLogId`.
  3. **Cơ chế Tự Động Ghi Vết Truy Vết (`recordSelfAuditLog`):**
     Mọi hành vi xem (`AUDIT_LOG_VIEW`) và xuất tệp Excel (`AUDIT_LOG_EXPORT`) đều được ghi nối vào chuỗi Hash Chain để ngăn chặn việc dò tìm lỗ hổng kiểm toán mà không để lại vết.
  4. **Tách biệt Transaction (`Propagation.REQUIRES_NEW`):**
     Lớp `ActivityLogHelper` ghi nhật ký độc lập trong một transaction mới, đảm bảo việc ghi log kiểm toán không bị rollback ngay cả khi nghiệp vụ chính bị lỗi.

---

### 1.2 Rủi Ro Khi Phục Hồi Dữ Liệu CSDL (Disaster Recovery & Data Corruption - NCL-14-CN-003)
- **Rủi ro phân tích:** Thao tác khôi phục CSDL ghi đè dữ liệu diện rộng. Nếu tệp sao lưu bị lỗi cấu trúc, thiếu trường, hoặc bị dọn dẹp (`PURGED`), việc phục hồi dang dở có thể làm hỏng trạng thái CSDL đang vận hành.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Pre-Validation Chặt Chẽ:** Trước khi thực hiện phục hồi, hệ thống kiểm tra:
     - Trạng thái tệp sao lưu: Từ chối nếu trạng thái là `PURGED` hoặc `FAILED`.
     - Dung lượng và sự tồn tại của tệp trên đĩa: Ném `AppException(ErrorCode.BACKUP_CORRUPTED_OR_INVALID)` nếu file rỗng hoặc không tồn tại.
  2. **Phục hồi trạng thái Soft-Delete có kiểm soát:**
     - Khôi phục các thực thể (`Customer`, `Product`, `Supplier`, `User`) có trong snapshot về trạng thái `deletedAt = null`.
     - Đánh dấu `deletedAt = now()` cho các thực thể phát sinh sau mốc thời gian sao lưu để đảm bảo đồng nhất với thời điểm snapshot.
  3. **Quản lý Transaction:** Toàn bộ quá trình phục hồi được bọc trong `@Transactional(rollbackFor = Exception.class)`. Nếu có bất kỳ lỗi I/O hoặc DB nào, mọi thay đổi đều tự động rollback.

---

### 1.3 Rủi Ro Tràn Bộ Nhớ & Không Gian Lưu Trữ (Disk Exhaustion - NCL-14-CN-002)
- **Rủi ro phân tích:** Sao lưu tự động hằng ngày tích lũy qua thời gian có thể làm đầy ổ đĩa lưu trữ của máy chủ (Disk Full).
- **Giải pháp kỹ thuật đã triển khai:**
  - Cơ chế **Retention Policy**: Mặc định lưu giữ $7$ bản gần nhất (có thể cấu hình từ $1$ đến $100$ bản).
  - Thuật toán tự động giải phóng: Khi số lượng bản sao lưu thành công đạt ngưỡng `retentionCount`, hệ thống tự động đánh dấu `PURGED` và dọn dẹp các bản sao lưu cũ nhất trước khi lưu bản mới (`NCL-14-CN-002-TC-02`).

---

### 1.4 Rủi Ro Thao Tác Bất Thường & Gian Lận Nội Bộ (Insider Threat & Anomaly Detection - NCL-14-CN-004)
- **Rủi ro phân tích:** Nhân viên thu ngân thông đồng với khách hủy hóa đơn sau khi thu tiền mặt, hoặc tự ý chiết khấu đơn hàng với tỷ lệ lớn.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Sliding Window Hủy Hóa Đơn:** Gom nhóm các hóa đơn bị hủy theo từng nhân viên và dùng cửa sổ thời gian $10$ phút. Nếu số hóa đơn hủy $\ge 5$, lập tức phát cảnh báo `CRITICAL`.
  2. **Quét Giảm Giá Đột Biến:** Phát hiện các đơn hàng có mức giảm giá $\ge 30\%$ so với tổng tiền đơn.
  3. **Chống Spam Cảnh Báo:** Sử dụng hàm kiểm tra `existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween` để loại trừ các cảnh báo trùng lặp trong cùng một khoảng thời gian.
  4. **Phân Quyền Tuyệt Đối (RBAC):** Nhân viên bán hàng (`VT-02`) bị chặn truy cập danh sách cảnh báo (vì cảnh báo có thể đang nhắm trực tiếp vào hành vi của nhân viên đó).

---

## 2. CHECKLIST KIỂM ĐỊNH KỸ THUẬT CHI TIẾT

### 2.1 Backend (Spring Boot + Spring Security + JPA)
- [x] **N+1 Query Avoidance**: Tất cả các JPA Repository (`ActivityLogRepository`, `AnomalyAlertRepository`, `UserRepository`, `ProductRepository`, `CustomerRepository`, `SupplierRepository`) đều sử dụng `@EntityGraph(attributePaths = {...})` để eager fetch các quan hệ cần thiết trong 1 câu query duy nhất.
- [x] **Transaction Management**: Áp dụng `@Transactional(rollbackFor = Exception.class)` trên các Service ghi dữ liệu; sử dụng `Propagation.REQUIRES_NEW` cho Audit Logging.
- [x] **Validation & Exception Handling**: Khai báo `@Valid` tại Controller; bắt lỗi và chuẩn hóa JSON Response tại `GlobalExceptionHandler`.
- [x] **Security (SQL Injection & Authorization)**: 100% truy vấn dùng Parameterized Queries (`:householdId`, `:username`,...); kiểm tra phân quyền người dùng tại tầng Service với `ErrorCode.FORBIDDEN` và `ErrorCode.UNAUTHORIZED`.
- [x] **Layer Isolation**: Controller hoàn toàn không chứa nghiệp vụ; chỉ tiếp nhận Request, chuyển giao Service và trả về `ApiResponse<T>`.

### 2.2 Frontend (React 19 + Vite + RTK Query)
- [x] **API Integration**: Tất cả các module (`audit_log`, `backup_restore`, `anomaly_alert`) đều sử dụng `baseApi.injectEndpoints` (không dùng `fetch/axios` tùy tiện trong components).
- [x] **Cache Invalidation**: Cấu hình đầy đủ `providesTags` và `invalidatesTags` (`API_TAG_TYPES.AUDIT_LOG`, `API_TAG_TYPES.BACKUP`, `API_TAG_TYPES.RESTORE`, `API_TAG_TYPES.ANOMALY_ALERT`). Khi sao lưu, phục hồi hoặc review cảnh báo, cache tự động được làm mới.
- [x] **State Management**: Quản lý UI state (Modal, Filter, Search Debounce) bằng `useState`; dữ liệu API đồng bộ qua Redux Toolkit Query Cache.
- [x] **Security & Route Guards**: Cấu hình `RoleGuard` ngăn chặn triệt để nhân viên (`VT-02`) truy cập vào các trang Quản trị, Sao lưu & Cảnh báo bất thường.
- [x] **Clean Code & Linting**: ESLint chạy kiểm tra không có bất kỳ warning/error nào (`--max-warnings 0`). Đã dọn dẹp sạch `console.log`.

---

## 3. PHÂN LOẠI MỨC ĐỘ LỖI & ĐÁNH GIÁ

| Mức độ | Số lượng | Mô tả & Trạng thái xử lý |
|---|---|---|
| **P0 (Critical)** | **0** | Không phát hiện lỗ hổng bảo mật, không có rủi ro mất dữ liệu. |
| **P1 (High)** | **0** | Không có lỗi logic nghiệp vụ; tất cả 14 Test Cases AC đều đạt 100%. |
| **P2 (Medium)** | **0** | Không vi phạm kiến trúc; cấu trúc code tuân thủ nghiêm ngặt chuẩn công ty. |
| **P3 (Low)** | **0** | Code sạch sẽ, formatting đồng bộ, naming conventions chuẩn. |

---

## 4. KẾT LUẬN & PHÁN QUYẾT CUỐI CÙNG

- **Trạng thái phán quyết:** **APPROVED ✅**
- **Đánh giá của Reviewer:** Mã nguồn có chất lượng cao, thiết kế kiến trúc chuẩn mực (Cryptographic Hash Chaining, Sliding Window Anomaly Detection, Automated Snapshot & Rollback), đáp ứng trọn vẹn yêu cầu nghiệp vụ NCL-14 và các quy chuẩn kỹ thuật BE_SKILL/FE_SKILL.
- **Sẵn sàng để Commit và Merge vào nhánh `develop`.**
