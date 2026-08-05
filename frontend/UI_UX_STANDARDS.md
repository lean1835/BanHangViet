# 🎨 QUY CHUẨN UI/UX HỆ THỐNG BÁN HÀNG VIỆT (UI/UX DESIGN STANDARDS)

> **Lưu ý**: Tài liệu này quy định các tiêu chuẩn về **Giao diện người dùng (UI)** và **Trải nghiệm người dùng (UX)** áp dụng cho toàn bộ dự án **Bán Hàng Việt** (Bao gồm Bán hàng tại quầy POS, Quản lý cửa hàng, Hóa đơn điện tử và Cổng tương tác Cơ quan Thuế). Tài liệu tập trung vào nguyên tắc thiết kế, quy chuẩn thị giác, hành vi tương tác và ngôn ngữ giao diện.
---

## 📋 MỤC LỤC
1. [Triết Lý Thiết Kế & Định Hướng Sản Phẩm](#1-triết-lý-thiết-kế--định-hướng-sản-phẩm)
2. [Hệ Thống Màu Sắc & Quy Tắc Sử Dụng](#2-hệ-thống-màu-sắc--quy-tắc-sử-dụng)
3. [Hệ Thống Phông Chữ & Khung Kích Thước (Typography)](#3-hệ-thống-phông-chữ--khung-kích-thước-typography)
4. [Bố Cục Giao Diện & Hệ Thống Lưới (Layout & Grid System)](#4-bố-cục-giao-diện--hệ-thống-lưới-layout--grid-system)
5. [Quy Chuẩn Thành Phần Giao Diện (UI Component Standards)](#5-quy-chuẩn-thành-phần-giao-diện-ui-component-standards)
6. [Trải Nghiệm Tương Tác & Phản Hồi Người Dùng (UX Interaction & Feedback)](#6-trải-nghiệm-tương-tác--phản-hồi-người-dùng-ux-interaction--feedback)
7. [Quy Chuẩn Đáp Ứng Đa Thiết Bị (Responsive & Touch Rules)](#7-quy-chuẩn-đáp-ứng-đa-thiết-bị-responsive--touch-rules)
8. [Tối Ưu Giao Diện Theo Vai Trò Người Dùng (Role-Based UI Standards)](#8-tối-ưu-giao-diện-theo-vai-trò-người-dùng-role-based-ui-standards)
9. [Ngôn Ngữ Giao Diện & Micro-copy (Vietnamese Business Wording)](#9-ngôn-ngữ-giao-diện--micro-copy-vietnamese-business-wording)

---

## 1. TRIẾT LÝ THIẾT KẾ & ĐỊNH HƯỚNG SẢN PHẨM

### 1.1 Mục tiêu trải nghiệm (Core UX Goals)
*   **Tốc độ & Tinh gọn (Speed & Efficiency)**: Thao tác bán hàng tại quầy (POS) phải hoàn thành trong ít cú nhấp chuột nhất. Tự động hóa điền thông tin, gợi ý thông minh và hỗ trợ tối đa phím tắt.
*   **Minh bạch & Chính xác (Clarity & Accuracy)**: Số liệu tài chính, tiền thuế GTGT, trạng thái đơn hàng và trạng thái cấp mã hóa đơn từ Cơ quan Thuế phải hiển thị rõ ràng, không gây nhầm lẫn.
*   **Dễ tiếp cận với Tiểu thương Việt Nam (Familiarity & Ease of Use)**: Giao diện gần gũi, sử dụng thuật ngữ bán hàng quen thuộc tại Việt Nam, giảm thiểu thời gian đào tạo thu ngân mới.

### 1.2 Phong cách thị giác (Visual Style)
*   **Modern Corporate / Retail SaaS**: Hiện đại, mượt mà, chuyên nghiệp với phong cách phẳng (Flat design) kết hợp bóng đổ nhẹ (Soft shadows) tạo độ sâu thị giác.
*   **Giao diện tương phản tốt (High Legibility)**: Sử dụng các gam màu độ tương phản đạt chuẩn WCAG 2.1 AA giúp mắt người dùng không bị mỏi khi thao tác liên tục 8-12 tiếng/ngày.

---

## 2. HỆ THỐNG MÀU SẮC & QUY TẮC SỬ DỤNG

### 2.1 Bảng màu chính (Brand & Primary Colors)

| Tên màu | Mã Hex / Variable | Ứng dụng / Quy cách sử dụng |
| :--- | :--- | :--- |
| **KV Blue Primary** | `#0068FF` (`var(--kv-blue-primary)`) | Nút bấm chính (Primary Action), Tab active, Link chính, Icon thương hiệu. |
| **KV Blue Dark** | `#0050CC` (`var(--kv-blue-dark)`) | Trạng thái Hover / Active của nút chính, Header nhấn mạnh. |
| **KV Blue Light** | `#E8F0FF` (`var(--kv-blue-light)`) | Nền dòng được chọn (Selected Row), Nền Badge active, Nền Item menu đang chọn. |
| **KV Orange Accent** | `#FF6B00` (`var(--kv-orange-accent)`) | Điểm nhấn chú ý: Nút Thanh toán nhanh, Cảnh báo ca làm việc, Nút Nộp thuế khẩn. |

### 2.2 Màu trạng thái nghiệp vụ (Status & Feedback Colors)
Tất cả trạng thái trong hệ thống **bắt buộc** phải tuân theo mã màu chuẩn để người dùng nhận biết ngay lập tức mà không cần đọc chữ:

| Trạng thái | Mã Hex Nền | Mã Hex Chữ / Viền | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Thành công (Success)** | `#ECFDF5` | `#00B96B` | Hóa đơn `ISSUED` (Đã phát hành), Đơn `COMPLETED` (Hoàn thành), `PAID` (Đã thanh toán). |
| **Chờ xử lý (Warning)** | `#FFF7ED` | `#FF6B00` | Hóa đơn `DRAFT` (Nháp), `WAITING_TAX_CODE` (Chờ cấp mã), Ca `OPEN` (Đang mở). |
| **Lỗi / Hủy (Danger)** | `#FEF2F2` | `#EF4444` | Hóa đơn `SEND_ERROR` (Lỗi gửi thuế), Đơn `CANCELED` (Đã hủy), Nút Xóa dữ liệu. |
| **Thông tin / Đã đóng (Info/Neutral)** | `#F1F5F9` | `#64748B` | Hóa đơn `ADJUSTED` (Đã điều chỉnh), Ca `CLOSED` (Đã đóng), Trạng thái phụ. |

### 2.3 Bảng màu trung tính & Nền (Neutral & Background Colors)
*   **Chữ chính (Dark Text)**: `#1A1A2E` — Tiêu đề, số tiền chính, mã đơn hàng.
*   **Chữ nội dung (Body Text)**: `#4A5568` — Nội dung bảng, nhãn trường nhập liệu.
*   **Chữ làm mờ (Muted Text)**: `#8A94A6` — Ghi chú phụ, placeholder, thời gian tạo.
*   **Đường phân cách (Border)**: `#E2E8F0` — Viền bảng, viền ô nhập liệu, viền card.
*   **Nền ứng dụng (App Background)**: `#F5F7FA` — Nền tổng thể đằng sau các Card/Table.
*   **Nền Trắng (Card Background)**: `#FFFFFF` — Nền Card, Nền Bảng, Nền Modal.

---

## 3. HỆ THỐNG PHÔNG CHỮ & KHUNG KÍCH THƯỚC (TYPOGRAPHY)

### 3.1 Họ phông chữ (Font Family)
*   Phông chữ chuẩn: **Inter**, hệ thống tự động fallback sang `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
*   Đặc điểm: Chữ tròn trịa, hiển thị rõ số liệu tài chính, nét chữ rõ ở mọi độ phân giải.

### 3.2 Thang kích thước chữ (Type Scale Standards)

| Cấp độ | Kích thước (px/rem) | Độ dầy (Weight) | Dòng cao (Line Height) | Trường hợp sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `24px` (1.5rem) | Bold (700) | 1.2 | Tổng doanh thu POS, Số tiền thanh toán lớn. |
| **Heading 1 (H1)** | `20px` (1.25rem) | SemiBold (600) | 1.3 | Tiêu đề màn hình chính (Danh sách đơn hàng, Hóa đơn). |
| **Heading 2 (H2)** | `16px` (1.0rem) | SemiBold (600) | 1.4 | Tiêu đề Card, Tiêu đề Modal, Tiêu đề Drawer chi tiết. |
| **Body Standard** | `14px` (0.875rem) | Regular (400) / Medium (500) | 1.5 | Chữ mặc định toàn hệ thống, giá sản phẩm trong bảng. |
| **Body Small** | `12px` (0.75rem) | Regular (400) / Medium (500) | 1.4 | Subtitle, nhãn phụ, ngày giờ, thông số badge. |
| **Tiny / Caption** | `10px - 11px` | Medium (500) | 1.2 | Tag trạng thái cực nhỏ, ghi chú bản quyền chân trang. |

### 3.3 Quy tắc định dạng số & Tiền tệ
*   **Tiền tệ Việt Nam (VNĐ)**: Tất cả số tiền **bắt buộc** phải phân cách hàng nghìn bằng dấu chấm (`.`) và có đơn vị `đ` hoặc `VNĐ` phía sau.
    *   *Đúng*: `150.000 đ` hoặc `1.250.000 VNĐ`
    *   *Sai*: `150000`, `150,000$`
*   **Số lượng**: Căn phải (Right-align) trong các bảng dữ liệu để dễ so sánh hàng dọc.
*   **Mã đơn hàng / MST / Mã tra cứu**: Sử dụng font chữ đơn cách (Monospace) nhẹ hoặc font rõ nét để tránh nhầm giữa `0` và `O`, `1` và `l`.

---

## 4. BỐ CỤC GIAO DIỆN & HỆ THỐNG LƯỚI (LAYOUT & GRID SYSTEM)

### 4.1 Khung ứng dụng chính (App Shell Layout)
Ứng dụng sử dụng cấu trúc khung chuẩn 3 phần cố định:
1.  **Thanh tiện ích trên cùng (Dashboard Utility Bar / Header)**:
    *   Cố định (Sticky Top), chiều cao `56px` hoặc `64px`.
    *   Chứa: Logo Bán Hàng Việt, Tên cửa hàng hiện tại, Trạng thái ca làm việc (Mở/Đóng), Nút thông báo, Nút trợ giúp, và Thông tin tài khoản đăng nhập.
2.  **Thanh điều hướng bên trái (Navigation Sidebar)**:
    *   Chiều rộng mở rộng: `240px`, chiều rộng thu gọn (Icon mode): `64px`.
    *   Hỗ trợ thu gọn/mở rộng mượt mà (Transition 200ms).
    *   Menu đang chọn (Active Menu Item) hiển thị nền `KV Blue Light` (`#E8F0FF`) kèm vạch viền xanh bên trái `4px`.
3.  **Vùng làm việc (Workspace Content Area)**:
    *   Khoảng cách viền (Padding): `16px` trên mobile/tablet, `24px` trên màn hình Desktop.
    *   Nền xám nhạt `#F5F7FA` để làm nổi bật các khối thông tin (Card/Table).

```
+-----------------------------------------------------------------------+
|  LOGO | Cửa Hàng A |  [Ca 1: Mở]   (🔍 Tìm kiếm)    🔔 ⚙️  [Tài khoản] |  <-- Utility Bar (56px)
+----------+------------------------------------------------------------+
|  🏠 Trang chủ|  [Tiêu đề Màn hình]                  [+ Nút Hành động] |
|  📦 Sản phẩm| +--------------------------------------------------------+ |
|  🛒 Bán POS | | [Card Thống Kê 1]  [Card Thống Kê 2]  [Card Thống Kê 3] | |
|  🧾 Đơn hàng| +--------------------------------------------------------+ |
|  📑 Hóa đơn | | [BẢNG DỮ LIỆU CHÍNH / DATA TABLE]                     | |  <-- Workspace
|  📊 Báo cáo | |                                                        | |      (Background #F5F7FA)
|  ⚙️ Cấu hình| |                                                        | |
+----------+------------------------------------------------------------+
```

### 4.2 Bố cục đặc thù cho Màn hình Bán hàng (POS Layout)
*   **Bố cục chia 2 cột (Split View Layout)**:
    *   **Cột trái (60% - 70%)**: Khu vực tìm kiếm & Danh mục sản phẩm (Grid hiển thị sản phẩm dạng thẻ hoặc danh sách nhanh).
    *   **Cột phải (30% - 40%)**: Hóa đơn bán lẻ & Thanh toán (Giỏ hàng cố định, chọn khách hàng, chọn phương thức thanh toán, nút **[F2 - THANH TOÁN]** màu cam/xanh nổi bật).

---

## 5. QUY CHUẨN THÀNH PHẦN GIAO DIỆN (UI COMPONENT STANDARDS)

### 5.1 Hệ thống Nút Bấm (Button System)
Nút bấm được phân chia cấp độ ưu tiên trực quan rõ ràng để tránh người dùng nhấn nhầm:

```
[ Primary Button ]   --> Màu KV Blue (#0068FF), chữ trắng (Dùng cho action chính: Lưu, Thanh toán, Phát hành)
[ Secondary Button ] --> Nền trắng/xám, viền xám (#E2E8F0) (Dùng cho: In, Xuất Excel, Xem trước)
[ Danger Button ]    --> Màu Đỏ (#EF4444), chữ trắng (Dùng cho: Hủy hóa đơn, Xóa mục - Luôn hiện Confirm Modal)
[ Ghost / Link Btn ] --> Không viền/nền, chữ xanh (Dùng cho action phụ trong dòng bảng)
```

*   **Trạng thái Disabled**: Màu xám nhạt (`#E2E8F0`), con trỏ `not-allowed`, không nhận phản hồi hover/click.
*   **Trạng thái Loading**: Hiển thị Spinner icon bên trái chữ và khóa tương tác tạm thời để chống double-click.
*   **Kích thước chuẩn**:
    *   Desktop: Height `36px` (Small), `40px` (Medium/Standard), `48px` (Large - POS Payment).
    *   Mobile/Touch: Minimum Height `44px` (Đạt chuẩn thao tác ngón tay).

### 5.2 Trường nhập dữ liệu (Form Controls & Input Fields)
*   **Định dạng chuẩn**: Viền `#E2E8F0`, góc bo `6px` hoặc `8px`, nền trắng.
*   **Trạng thái Focus**: Viền đổi sang màu KV Blue (`#0068FF`) kèm hiệu ứng ring bóng mờ `rgba(0, 104, 255, 0.15)`.
*   **Trạng thái Lỗi (Validation Error)**: Viền đổi sang màu Đỏ (`#EF4444`), dòng văn bản thông báo lỗi màu đỏ ngay dưới ô nhập liệu (Font size `12px`).
*   **Tự động định dạng (Auto Masking)**: Ô nhập tiền tự động chèn dấu chấm phân cách; Ô tìm kiếm có icon kính phóng đại bên trái và nút xóa (x) nhanh bên phải.

### 5.3 Bảng Dữ Liệu (Data Table & Grid)
*   **Tiêu đề bảng (Header)**: Nền xám nhẹ (`#F8FAFC`), chữ in hoa nhẹ hoặc chữ đậm vừa, cố định (Sticky Header) khi cuộn nội dung dài.
*   **Dòng (Table Row)**:
    *   Chiều cao dòng chuẩn: `48px` (Thường) hoặc `56px` (Có thông tin phụ).
    *   Hiệu ứng Hover: Đổi màu nền nhẹ (`#F1F5F9`) khi di chuột qua.
    *   Hiệu ứng Selected: Đổi màu nền xanh nhạt (`#E8F0FF`).
*   **Phân trang (Pagination Bar)**: Luôn đặt cố định ở chân bảng. Bao gồm: Tổng số bản ghi (vd: "Hiển thị 1-10 trên 120 bản ghi"), Bộ chọn số bản ghi/trang (10, 25, 50, 100), và Các nút chuyển trang.
*   **Giao diện Trống (Empty State)**: Khi không có dữ liệu, hiển thị hình minh họa icon mờ + Thông điệp "Chưa có dữ liệu" + Nút hành động gợi ý (vd: "+ Tạo đơn hàng mới").

### 5.4 Hộp thoại Xác nhận & Cửa sổ Trượt (Modal & Drawer)
*   **Modal (Hộp thoại giữa màn hình)**:
    *   Dùng cho: Xác nhận hành động nguy hiểm, form tạo nhanh, xem popup ngắn.
    *   Quy chuẩn: Cố định Header (Tiêu đề + Nút Đóng X) và Footer (Nút Hủy bên trái, Nút Xác nhận bên phải). Chiều cao body có thể cuộn (`overflow-y: auto`).
*   **Drawer (Cửa sổ trượt từ cạnh phải)**:
    *   Dùng cho: Xem chi tiết Hóa đơn, Xem lịch sử đơn hàng, Cấu hình chi tiết đối tượng.
    *   Ưu điểm UX: Giúp người dùng vừa xem chi tiết vừa giữ nguyên ngữ cảnh danh sách bảng phía sau mà không bị chuyển trang.

---

## 6. TRẢI NGHIỆM TƯƠNG TÁC & PHẢN HỒI NGƯỜI DÙNG (UX INTERACTION & FEEDBACK)

### 6.1 Thông báo Toast & Notification Systems
Mọi thao tác của người dùng phải nhận được phản hồi ngay lập tức (Thời gian phản hồi UI < 100ms):

```
+---------------------------------------------------------+
|  ✅  Phát hành hóa đơn thành công! (Số HĐ: HD-000123)  [X] |  <-- Toast Success (Top-Right)
+---------------------------------------------------------+
|  ⚠️  Ca làm việc chưa đóng. Vui lòng kiểm kê tiền mặt! [X] |  <-- Toast Warning
+---------------------------------------------------------+
|  ❌  Không thể kết nối Cơ quan Thuế. Mã lỗi: ERR_503    [X] |  <-- Toast Error
+---------------------------------------------------------+
```

*   **Vị trí**: Mặc định hiển thị ở góc trên bên phải màn hình (`Top-Right`).
*   **Thời gian hiển thị**: Tự động đóng sau `3.5 giây` đối với thông báo Thành công/Thông tin. Thông báo Lỗi nghiêm trọng yêu cầu người dùng bấm đóng thủ công (`Dismissible`).

### 6.2 Màn hình Chờ & Nạp Dữ liệu (Loading & Skeleton Screens)
*   **Tuyệt đối không để màn hình trắng (No Blank Screen)**.
*   Khi tải trang hoặc tải bảng dữ liệu: Sử dụng **Skeleton Screen** (Khung xương xám nháy mờ hiệu ứng Shimmer) thay vì chỉ dùng 1 icon quay tròn chính giữa màn hình.
*   Khi submit form hoặc gửi API: Disable nút bấm và hiển thị spinner trên nút bấm đó.

### 6.3 Phím Tắt Nghiệp Vụ (Keyboard Shortcuts for POS)
Để tăng tốc tối đa cho thu ngân, màn hình bán hàng POS bắt buộc hỗ trợ các phím tắt hệ thống tiêu chuẩn:
*   `F1`: Con trỏ lập tức focus vào ô tìm kiếm sản phẩm.
*   `F2`: Mở màn hình/Xác nhận Thanh Toán.
*   `F3`: Mở ô chọn/Thêm mới thông tin Khách hàng.
*   `F4`: Chọn nhanh phương thức thanh toán (Tiền mặt / Chuyển khoản QR).
*   `F8`: In lại hóa đơn gần nhất.
*   `ESC`: Đóng các cửa sổ Modal/Drawer đang mở.

---

## 7. QUY CHUẨN ĐÁP ỨNG ĐA THIẾT BỊ (RESPONSIVE & TOUCH RULES)

### 7.1 Điểm ngắt màn hình chuẩn (Breakpoints)
*   **Mobile Small/Medium**: `< 640px` (`sm`)
*   **Tablet / Large Phone**: `640px` đến `1023px` (`md`)
*   **Laptop / Desktop**: `1024px` đến `1279px` (`lg`)
*   **Monitor Rộng**: `>= 1280px` (`xl` / `2xl`)

### 7.2 Quy tắc chuyển đổi giao diện theo thiết bị (Adaptive Design Rules)
1.  **Chuyển đổi Bảng sang Dạng Thẻ (Table to Card List on Mobile)**:
    *   Trái với Desktop hiển thị dạng bảng ngang nhiều cột, trên màn hình Mobile `< 640px`, các dòng dữ liệu tự động chuyển thành các Thẻ thông tin (Cards) xếp theo chiều dọc.
2.  **Vùng chạm cảm ứng (Touch Targets)**:
    *   Tất cả các thành phần tương tác (Nút bấm, Checkbox, Item danh sách) trên Tablet & Mobile phải có vùng chạm tối thiểu **`44px x 44px`** để ngón tay bấm dễ dàng mà không bị bấm nhầm.

---

## 8. TỐI ƯU GIAO DIỆN THEO VAI TRÒ NGƯỜI DÙNG (ROLE-BASED UI STANDARDS)

Hệ thống điều chỉnh linh hoạt giao diện dựa theo Vai trò (Role) được phân quyền:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              VAI TRÒ NGƯỜI DÙNG                        │
├───────────────────┬───────────────────┬───────────────────┬────────────┤
│ Chủ hộ (VT-01)    │ Thu ngân (VT-02)  │ Kế toán (VT-03)   │ Thuế mô phỏng│
│ (Owner/Admin)     │ (Cashier POS)     │ (Accountant)      │ (Tax Portal)
├───────────────────┼───────────────────┼───────────────────┼────────────┤
│ - Toàn quyền UI   │ - Tối ưu cho POS  │ - Tập trung Quản  │ - Giao diện│
│ - Báo cáo tổng thể│ - Giao diện lớn   │   lý Hóa đơn &    │   kiểm duyệt│
│ - Cấu hình cửa    │ - Màn hình đơn    │   Đồng bộ Thuế    │   riêng biệt│
│   hàng, Thuế      │   giản, nút bấm   │ - Báo cáo sổ quỹ, │ - Nhận diện│
│ - Phân quyền NV   │   to, phím tắt    │   doanh thu chi   │   màu Đỏ/Vàng│
│                   │ - Ẩn nút Hủy/Xóa  │   tiết            │   Cơ quan  │
│                   │   Hóa đơn CQT     │                   │   Thuế     │
└───────────────────┴───────────────────┴───────────────────┴────────────┘
```

*   **Nguyên tắc Ẩn / Khóa (Hide vs Disable)**:
    *   Nếu người dùng không có quyền truy cập tính năng: **Ẩn hoàn toàn** menu hoặc nút bấm đó khỏi giao diện để tránh rác mắt.
    *   Nếu tính năng chưa đủ điều kiện thực hiện (ví dụ: Hóa đơn chưa lưu nháp thì chưa thể bấm "Gửi thuế"): **Khóa nút (Disable)** và kèm Tooltip giải thích lý do khi di chuột qua.

---

## 9. NGÔN NGỮ GIAO DIỆN & MICRO-COPY (VIETNAMESE BUSINESS WORDING)

### 9.1 Nguyên tắc ngôn ngữ (Wording Principles)
*   **Đồng nhất thuật ngữ (Consistency)**: Sử dụng chính xác thuật ngữ quản lý bán hàng và thuế tại Việt Nam:
    *   Dùng *"Hóa đơn điện tử"*, *"Mã Cơ quan Thuế"*, *"Tiền hàng chưa thuế"*, *"Tiền thuế GTGT"*, *"Tiền thừa trả khách"*, *"Giao dịch ca"*.
    *   Không dùng từ tiếng Anh bồi hoặc dịch máy ngô nghê (Ví dụ: Không dùng "Invoice Draft" mà dùng "Hóa đơn nháp"; Không dùng "Tax status" mà dùng "Trạng thái cấp mã").
*   **Ngắn gọn & Hành động (Action-Oriented)**: Động từ đứng đầu các nút bấm:
    *   `+ Tạo đơn hàng`, `Phát hành hóa đơn`, `Gửi Cơ quan Thuế`, `In hóa đơn`, `Đóng ca làm việc`.

### 9.2 Thông báo lỗi thân thiện (Constructive Error Messages)
Mọi thông báo lỗi **không được đổ lỗi cho người dùng** và **bắt buộc đưa ra giải pháp khắc phục**:

*   ❌ **Dở**: *"Lỗi 400: Dữ liệu không hợp lệ."*
*   ✅ **Tốt**: *"Không thể phát hành hóa đơn do Mã số thuế người mua bị sai cấu trúc (Phải gồm 10 hoặc 13 chữ số). Vui lòng kiểm tra lại."*
*   ❌ **Dở**: *"Lỗi hệ thống."*
*   ✅ **Tốt**: *"Cổng thông tin Cơ quan Thuế tạm thời không phản hồi. Hóa đơn đã được lưu vào hàng đợi và sẽ tự động gửi lại."*

---

## 📌 TỔNG KẾT BẢNG KIỂM TRA UI/UX TRƯỚC KHI RELEASE (CHECKLIST)

- [ ] **Màu sắc**: Đã sử dụng đúng mã màu chuẩn (`#0068FF` KV Blue, trạng thái đúng màu quy định)?
- [ ] **Phông chữ & Số tiền**: Số tiền đã được format phân cách hàng nghìn bằng dấu chấm (`150.000 đ`) chưa?
- [ ] **Phản hồi**: Mọi nút bấm submit đều có trạng thái loading spinner và chống double-click chưa?
- [ ] **Phân trang & Empty State**: Các bảng dữ liệu đã có phân trang và hiển thị Empty State thân thiện khi trống chưa?
- [ ] **Responsive**: Giao diện trên Tablet & Mobile đã được kiểm tra, vùng bấm nút đạt tối thiểu `44px` chưa?
- [ ] **Lỗi & Ngôn ngữ**: Thông báo lỗi có tiếng Việt rõ nghĩa và hướng dẫn khắc phục chưa?
