# 📋 BÁO CÁO TỔNG QUAN REVIEW MERGE REQUEST (MR SUMMARY)
**Mã Epic/Task:** NCL-14 (Gồm 4 Chức năng: CN-001, CN-002, CN-003, CN-004)  
**Phạm vi:** Nhật ký kiểm toán bất biến, Sao lưu dữ liệu tự động, Phục hồi dữ liệu và Cảnh báo thao tác bất thường  
**Đối tượng thụ hưởng:** Stakeholders, Product Owner, Tech Lead, System Architect  
**Ngày review:** 24/08/2026  
**Trạng thái phán quyết:** **APPROVED ✅**

---

## 1. TỔNG QUAN THAY ĐỔI (OVERVIEW)

Gói thay đổi mã nguồn cục bộ (uncommitted local changes) tập trung hoàn thiện toàn diện phân hệ **NCL-14: Nhật ký kiểm toán, sao lưu và phục hồi dữ liệu**, bao gồm 4 chức năng nghiệp vụ trọng yếu:

1. **NCL-14-CN-001: Nhật ký kiểm toán không sửa xóa được (Immutable Audit Log)**
   - Cơ chế băm chuỗi liên hoàn (**Cryptographic SHA-256 Hash Chaining**) liên kết chặt chẽ từng bản ghi `activity_logs` với `previous_hash` của bản ghi trước đó (Genesis Hash: 64 số 0).
   - Đảm bảo thuộc tính **Append-Only**; từ chối mọi thao tác sửa/xóa đối với toàn bộ các vai trò (kể cả Chủ hộ).
   - Tích hợp công cụ phát hiện đứt gãy chuỗi (`verifyIntegrity`) chỉ điểm chính xác vị trí `sequence_number` và `log_id` bị can thiệp trái phép.
   - Tự động ghi vết chính các hành vi truy cập tra cứu (`AUDIT_LOG_VIEW`) và xuất file Excel (`AUDIT_LOG_EXPORT`).

2. **NCL-14-CN-002: Sao lưu dữ liệu tự động theo ngày (Daily Automated Backup)**
   - Lập lịch sao lưu tự động hằng ngày và hỗ trợ kích hoạt sao lưu thủ công tức thời (Snapshot đầy đủ Khách hàng, Hàng hóa, Nhà cung cấp, Nhân viên).
   - Cơ chế tự động dọn dẹp các bản sao lưu cũ (`PURGED`) khi chạm ngưỡng lưu trữ `retention_count` (mặc định 7 bản) để bảo vệ tài nguyên đĩa cứng.
   - Hiển thị dashboard trạng thái tổng quan bản sao lưu (Dung lượng, thời điểm sao lưu cuối, số bản khả dụng).

3. **NCL-14-CN-003: Phục hồi dữ liệu từ bản sao lưu (Restore Data from Backup)**
   - Cho phép Chủ hộ xem trước thông tin chi tiết (`previewBackupForRestore`) và cảnh báo rủi ro trước khi thực hiện.
   - Kiểm tra tính toàn vẹn và hợp lệ của tệp sao lưu trước khi phục hồi (dừng ngay trước khi tác động đến CSDL nếu file bị hỏng hoặc trạng thái không hợp lệ).
   - Tự động đồng bộ khôi phục trạng thái các thực thể (`Customer`, `Product`, `Supplier`, `User`) về mốc thời gian snapshot.
   - Ghi nhật ký kiểm toán với chuỗi băm Hash Chain bất biến ngay sau khi phục hồi thành công.

4. **NCL-14-CN-004: Cảnh báo thao tác bất thường (Anomaly Detection Alert)**
   - Thuật toán cửa sổ trượt (**Sliding Window Algorithm**) phát hiện hành vi hủy hóa đơn hàng loạt ($\ge 5$ hóa đơn trong vòng 10 phút).
   - Thuật toán quét đơn hàng chiết khấu/giảm giá vượt ngưỡng bất thường ($\ge 30\%$) và điều chỉnh tồn kho đột biến.
   - Ghi nhận trạng thái "Ngày an toàn" (`isCleanDay = true`) khi không có thao tác vượt ngưỡng.
   - Tích hợp kiểm duyệt cảnh báo (`REVIEWED` / `DISMISSED`) và điều chỉnh linh hoạt tham số ngưỡng theo từng hộ kinh doanh.

---

## 2. KẾT QUẢ KIỂM TRA ĐIỀU KIỆN CHẤP NHẬN (ACCEPTANCE CRITERIA)

| Chức năng (CN) | Mã Test Case | Loại kiểm thử | Tiêu chí yêu cầu | Kết quả | Đánh giá |
|---|---|---|---|---|---|
| **NCL-14-CN-001** | `CN-001-TC-01` | Luồng thành công | Ghi nhật ký kiểm toán gắn chuỗi kiểm tra SHA-256 nối với bản ghi trước | **ĐẠT** | Hash chain liên tục, sequence tăng tuần tự |
| | `CN-001-TC-02` | Bảo mật / Quyền | Chặn sửa/xóa nhật ký với mọi vai trò (kể cả Chủ hộ) | **ĐẠT** | Append-only, không cung cấp API Update/Delete |
| | `CN-001-TC-03` | Ngoại lệ | Phát hiện can thiệp CSDL trực tiếp, cảnh báo đứt gãy chuỗi | **ĐẠT** | `verifyIntegrity` trả về chi tiết sequence bị sửa |
| | `CN-001-TC-04` | Lưu lịch sử | Ghi vết việc tra cứu và xuất file Excel nhật ký | **ĐẠT** | Tự động ghi `AUDIT_LOG_VIEW` & `AUDIT_LOG_EXPORT` |
| **NCL-14-CN-002** | `CN-002-TC-01` | Luồng thành công | Đến giờ hẹn tự sao lưu và cập nhật trạng thái thành công | **ĐẠT** | Scheduler & Manual Trigger tạo snapshot thành công |
| | `CN-002-TC-02` | Quản lý bộ nhớ | Tự động xóa bản cũ nhất khi vượt ngưỡng retention count | **ĐẠT** | Chuyển trạng thái `PURGED` bản cũ nhất khi đạt ngưỡng |
| | `CN-002-TC-03` | Phân quyền | Chặn nhân viên/kế toán mở trang cấu hình sao lưu | **ĐẠT** | RoleGuard & Backend trả về `403 Forbidden` |
| **NCL-14-CN-003** | `CN-003-TC-01` | Luồng thành công | Phục hồi dữ liệu về mốc snapshot và ghi vết nhật ký | **ĐẠT** | Đồng bộ dữ liệu CSDL và lưu vết vào Hash Chain |
| | `CN-003-TC-02` | Ngoại lệ | Dừng trước khi động vào CSDL nếu file backup bị lỗi/hỏng | **ĐẠT** | Pre-validation ném `AppException` trước khi ghi DB |
| | `CN-003-TC-03` | Phân quyền | Chỉ Chủ hộ (VT-01) được phục hồi, chặn các vai trò khác | **ĐẠT** | Chặn chặt chẽ ở cả Frontend và Backend Service |
| | `CN-003-TC-04` | Lưu lịch sử | Ghi người phục hồi, tên file, thời điểm vào nhật ký | **ĐẠT** | Ghi đầy đủ `RESTORE_EXECUTE` vào `activity_logs` |
| **NCL-14-CN-004** | `CN-004-TC-01` | Luồng thành công | Cảnh báo hủy $\ge 5$ hóa đơn trong 10 phút kèm bằng chứng | **ĐẠT** | Sliding window phát hiện chính xác, lưu evidence JSON |
| | `CN-004-TC-02` | Dữ liệu rỗng | Ghi nhận "Ngày an toàn" khi không có hành vi vượt ngưỡng | **ĐẠT** | `isCleanDay = true` khi dữ liệu ngày không có cảnh báo |
| | `CN-004-TC-03` | Phân quyền | Chặn nhân viên bán hàng mở danh sách cảnh báo | **ĐẠT** | RoleGuard & Service chặn `VT-02` (Nhân viên) |

---

## 3. BẢNG CHỈ SỐ ĐÁNH GIÁ (SCORECARD)

| Tiêu chí | Điểm /10 | Đánh giá chi tiết |
|---|---|---|
| **1. Tính năng (Features & AC)** | **10/10** | Đáp ứng trọn vẹn 100% 4 Chức năng (14 Test Cases trong Acceptance Criteria & Quy tắc nghiệp vụ QTN-25). |
| **2. Hiệu suất (Performance)** | **9.5/10** | JPA `@EntityGraph` loại bỏ N+1 query. Truy vấn lọc dữ liệu có phân trang, đánh chỉ mục và xử lý Async/Sliding Window tối ưu. |
| **3. Bảo mật (Security & RBAC)** | **10/10** | Phân quyền đa tầng (Frontend Route Guard + Backend Service Guard). Hash Chain SHA-256 bảo vệ tính toàn vẹn dữ liệu chứng từ thuế. Không log mật khẩu. |
| **4. Code Quality & Standards** | **9.5/10** | Tuân thủ tuyệt đối quy chuẩn BE_SKILL (Layered Architecture, DTO, GlobalExceptionHandler) và FE_SKILL (RTK Query `baseApi`, tag invalidation, Module-based). |
| **5. Testing & Git Hygiene** | **10/10** | 33/33 Frontend unit/integration tests passed, 28/28 Backend integration/service tests passed. ESLint 0 warnings. |
| **TỔNG KẾT** | **9.8/10** | **XUẤT SẮC - SẴN SÀNG MERGE VÀO DEVELOP** |

---

## 4. KẾT LUẬN & HƯỚNG DẪN TIẾP THEO

- **Phán quyết:** **APPROVED ✅**
- Gói thay đổi đáp ứng đầy đủ tính toàn vẹn, bảo mật cao cấp theo chuẩn chứng từ kế toán thuế Việt Nam.
- Khuyến nghị Team tạo commit và Merge Request vào nhánh `develop`.
