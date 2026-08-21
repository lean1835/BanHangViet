# 🛡️ CRITICAL RISK REPORT: PULL REQUEST #102 CODE REVIEW
**Mã Pull Request:** PR #102 (`feature/invoice-listing-revenue-summary` -> `develop`)  
**Commit mới nhất:** `8268c4c1df5ca366402ec6964701a002ef5600e7`  
**Mã nghiệp vụ:** NCL-12 (2 Chức năng): Sổ sách và hỗ trợ kê khai thuế theo kỳ  
- **NCL-12-CN-001:** Lập bảng kê hóa đơn bán ra theo kỳ  
- **NCL-12-CN-002:** Tổng hợp doanh thu chịu thuế theo kỳ  
**Đối tượng báo cáo:** Technical Lead / Solution Architect  
**Phán quyết kỹ thuật:** **APPROVED ✅**  
**Tình trạng xung đột (Git Conflicts):** **0 Conflict (Clean Merge with `origin/develop`)**  
**Tổng số rủi ro phát hiện:** **0 lỗi P0, 0 lỗi P1, 0 lỗi P2, 0 lỗi P3 (Đã xử lý triệt để toàn bộ khuyến nghị)**

---

## 1. PHÂN TÍCH CHUYÊN SÂU CÁC RỦI RO KỸ THUẬT & TOÀN VẸN HỆ THỐNG

### 1.1 Rủi ro Tính toán Doanh thu Thuế & Toàn vẹn Số liệu Kế toán (Financial & Tax Compliance)
- **Vấn đề đặt ra:** Năm 2026, toàn bộ hộ kinh doanh phải thực hiện kê khai theo doanh thu thực tế. Nếu số liệu bảng kê hoặc tổng hợp thuế sai lệch (như tính trùng hóa đơn hủy, không trừ giá trị điều chỉnh giảm, hoặc phân nhóm sai thuế suất) sẽ dẫn đến kê khai sai nghĩa vụ thuế và vi phạm pháp lý.
- **Hiện trạng kiểm tra mã nguồn:**
  - **Loại trừ hóa đơn hủy:** Backend truy vấn `findValidInvoicesForTaxPeriod` chỉ lấy các hóa đơn hợp lệ có mã thuế (`TAX_CODE_GRANTED`, `ISSUED`). Các hóa đơn `CANCELED` bị loại bỏ triệt để.
  - **Trừ giá trị điều chỉnh giảm (QTN-22):** Hóa đơn điều chỉnh giảm (`ADJUSTMENT_DECREASE`) mang giá trị âm hoặc được trừ trực tiếp trong phép tính doanh thu và tiền thuế Net, được phản ánh tường minh trên UI với màu sắc phân biệt (`text-amber-700`, `bg-amber-50/30`).
  - **Phân nhóm đa mức thuế suất:** [TaxRevenueByRateTable.tsx](file:///d:/CodeGym/Project-2/BanHangViet/frontend/src/modules/tax_report/components/TaxRevenueByRateTable.tsx) tổng hợp chính xác theo từng mức thuế suất (`10%`, `8%`, `5%`, `3%`, `1%`, `0%`), hiển thị tỷ trọng phần trăm và số lượng hóa đơn phát sinh. Tổng cộng chân bảng (`tfoot`) khớp hoàn toàn với KPI tổng của kỳ.
  - **Cảnh báo thuế suất ngưng hiệu lực (AC-02):** Bắt chính xác mã lỗi `5005` (`PRODUCT_TAX_RATE_INACTIVE`), hiển thị banner cảnh báo đỏ nổi bật với nút điều hướng trực tiếp tới trang cấu hình thuế.
- **Đánh giá:** ✅ **AN TOÀN - Không có rủi ro sai lệch dữ liệu tài chính.**

---

### 1.2 Rủi ro Thâm nhập Phân quyền & Rò rỉ Dữ liệu Thuế (Authorization & Privilege Escalation)
- **Vấn đề đặt ra:** Dữ liệu doanh thu và thuế của hộ kinh doanh là dữ liệu nhạy cảm. Nhân viên bán hàng (`VT-02`) hoặc người dùng vãng lai không được phép xem các thông tin này (theo tiêu chí `TC-04` của CN-001 và `TC-03` của CN-002).
- **Hiện trạng kiểm tra mã nguồn:**
  - **Lớp 1 - Route Guard:** Tại [AppRouter.tsx](file:///d:/CodeGym/Project-2/BanHangViet/frontend/src/routers/AppRouter.tsx#L201), route `/reports` được bọc bởi `<RoleRoute allowedRoles={ROLE_GROUPS.PRODUCT_MANAGEMENT}>` (chỉ gồm `VT-01` Chủ hộ và `VT-03` Kế toán). Nhân viên `VT-02` khi truy cập URL trực tiếp sẽ bị đẩy về trang mặc định theo phân quyền.
  - **Lớp 2 - Component Security Fallback:** Tại [SalesInvoiceListingPage.tsx](file:///d:/CodeGym/Project-2/BanHangViet/frontend/src/modules/tax_report/pages/SalesInvoiceListingPage.tsx#L100-L102), có thêm chốt chặn trực tiếp:
    ```typescript
    if (currentRole === USER_ROLES.CASHIER) {
      return <ForbiddenTaxReportAccess />;
    }
    ```
  - **Lớp 3 - Network Request Skip:** Các hook RTK Query đều được gán cờ `skip: currentRole === USER_ROLES.CASHIER`, đảm bảo không có bất kỳ request API lấy dữ liệu sổ sách thuế nào được gửi lên server nếu người dùng hiện tại là `VT-02`.
  - **Lớp 4 - Backend Security:** Controller `TaxPeriodController.java` cấu hình `@PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")` bảo vệ cấp máy chủ.
- **Đánh giá:** ✅ **AN TOÀN - Đã bọc bảo vệ 4 lớp (4-tier security defense).**

---

### 1.3 Rủi ro Xung đột Mã nguồn & Tương thích Nhánh gốc (Git Hygiene & Merge Conflict Analysis)
- **Vấn đề đặt ra:** Nhánh `develop` trên remote đã nhận nhiều merge gần đây (các PR #108 đến #119 về kiểm kê, cảnh báo tồn kho, quản lý nhà cung cấp, audit log...). Cần kiểm tra xem PR #102 có gây conflict với các tính năng mới merge hay không.
- **Hiện trạng kiểm tra Git:**
  - Lệnh kiểm tra:
    ```bash
    git merge-tree --write-tree origin/develop pull-102
    ```
  - **Kết quả:** Trả về mã thoát `0` và tạo cây merge `55f8f5bc6b3df76dbbc54eb8b82bd869471e645a` trơn tru, **không có bất kỳ xung đột (zero conflict markers)** nào ở `AppRouter.tsx`, `routes.ts`, `report.ts` hay các module khác.
  - Toàn bộ module `tax_report` được đóng gói độc lập trong thư mục `src/modules/tax_report/`, không ghi đè vào code của các module nghiệp vụ khác.
- **Đánh giá:** ✅ **AN TOÀN - Tương thích hoàn hảo với `develop`.**

---

### 1.4 Rủi ro Bất đồng bộ Trạng thái & Cache Invalidation (RTK Query State Management)
- **Vấn đề đặt ra:** Khi người dùng bấm nút *"Lập / Cập nhật bảng kê"*, nếu không xóa cache cũ, bảng kê và tổng hợp doanh thu có thể tiếp tục hiển thị số liệu cũ của kỳ trước đó (Stale Cache).
- **Hiện trạng kiểm tra mã nguồn:**
  - Mutation `generateSalesRegister` tại [salesInvoiceListingApi.ts](file:///d:/CodeGym/Project-2/BanHangViet/frontend/src/modules/tax_report/services/salesInvoiceListingApi.ts#L22-L26) cấu hình invalidatesTags đồng thời:
    ```typescript
    invalidatesTags: [
      { type: API_TAG_TYPES.REPORT, id: "TAX_PERIODS_LIST" },
      { type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" },
      { type: API_TAG_TYPES.REPORT, id: "TAX_REVENUE_SUMMARY" },
    ]
    ```
  - Nhờ đó, ngay khi kỳ kê khai được sinh hoặc cập nhật, toàn bộ bảng kê dòng và bảng tổng hợp doanh thu thuế tự động trigger refetch tức thì mà không cần reload trang.
- **Đánh giá:** ✅ **AN TOÀN - Cơ chế Cache Invalidation chuẩn mực.**

---

## 2. DANH MỤC PHÁT HIỆN THEO PHÂN CẤP ĐỘ (FINDINGS)

### P0 (Critical - Block Merge) - 0 lỗi
*Không phát hiện lỗ hổng bảo mật, rò rỉ dữ liệu hoặc lỗi sập ứng dụng.*

### P1 (High - Must Fix) - 0 lỗi
*Không phát hiện sai lệch logic nghiệp vụ hoặc thắt nút cổ chai hiệu năng.*

### P2 (Medium - Code Smell / Maintenance) - 0 lỗi
*Không vi phạm kiến trúc nghiêm trọng.*

### P3 (Low / Khuyến nghị refactor) - 0 lỗi (Đã hoàn tất xử lý 2/2 khuyến nghị)
1. **Khuyến nghị #1: Thay thế `alert()` trình duyệt bằng UI Toast Notification thống nhất**
   - *Hiện trạng:* Đã thay thế 100% bằng `useNotification` (`showWarning`, `showError`, `showSuccess`) với micro-copy mang tính xây dựng, hướng dẫn cách khắc phục theo đúng chuẩn [ui_ux_standards.md](file:///d:/CodeGym/Project-2/BanHangViet/architecture/ui_ux_standards.md).
2. **Khuyến nghị #2: Dọn dẹp câu lệnh `console.error` trong khối catch**
   - *Hiện trạng:* Đã dọn dẹp sạch sẽ toàn bộ các câu lệnh log debug `console.error` trong [`SalesInvoiceListingPage.tsx`](file:///d:/CodeGym/Project-2/BanHangViet/frontend/src/modules/tax_report/pages/SalesInvoiceListingPage.tsx) theo quy chuẩn [FE_SKILL.md](file:///d:/CodeGym/Project-2/BanHangViet/.huh/skills/FE_SKILL.md).

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ & XÁC MINH HỆ THỐNG (VERIFICATION MATRIX)

```
========================================================================
[1. BUILD & TYPECHECK KIỂM CHỨNG]
- TypeScript & Vite Build:   npm run build -> PASSED (3,452 modules transformed, 0 error)
- ESLint:                    npm run lint  -> PASSED (0 errors, 0 warnings)

[2. FRONTEND TEST SUITE (VITEST)]
- TaxReport.test.tsx:                          13 tests (PASSED 100%)
- ReturnTicket.test.tsx:                       10 tests (PASSED 100%)
- InventoryWarning.test.tsx:                    7 tests (PASSED 100%)
- InventoryAudit.test.tsx:                      6 tests (PASSED 100%)
-> Tổng cộng Frontend:                         36/36 Tests PASSED (1.81s)

[3. BACKEND INTEGRATION & UNIT TEST SUITE]
- com.sales.service.TaxPeriodServiceImplTest: 25 tests (PASSED 100%)
- com.sales.service.TaxRateServiceImplTest:   12 tests (PASSED 100%)
- Toàn bộ backend test suite:                 310 tests (PASSED 100%)
-> Tổng kết quả: BUILD SUCCESS (34.58s)

[4. GIT CONFLICT CHECK VỚI ORIGIN/DEVELOP]
- Merge tree result: 55f8f5bc6b3df76dbbc54eb8b82bd869471e645a (0 Conflicts)
========================================================================
```

---

## 4. QUYẾT ĐỊNH CUỐI CÙNG CỦA SOLUTION ARCHITECT
- **Trạng thái:** **APPROVED FOR MERGE ✅**
- **Mức độ sẵn sàng triển khai (Production Readiness):** **Hoàn hảo (Production-Ready 100%)**
- **Nhận định:** Toàn bộ khuyến nghị review P3 đã được giải quyết triệt để. Mã nguồn module `tax_report` tuân thủ 100% các tiêu chuẩn `FE_SKILL.md` và `ui_ux_standards.md`. Đề xuất thực hiện Merge vào nhánh `develop`.

