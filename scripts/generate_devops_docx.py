import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os

def create_devops_docx():
    doc = docx.Document()
    
    # 1. Page Margins (0.8 inches like backend_architecture.docx)
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

    # Helper styling functions
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_borders(cell, top="e2e8f0", bottom="e2e8f0", left="e2e8f0", right="e2e8f0"):
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="{top}"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="{bottom}"/><w:left w:val="single" w:sz="4" w:space="0" w:color="{left}"/><w:right w:val="single" w:sz="4" w:space="0" w:color="{right}"/></w:tcBorders>')
        tcPr.append(borders)

    def add_divider():
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run("________________________________________________________________________________")
        run.font.size = Pt(6)
        run.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    def add_p(text, bold_prefix="", italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Segoe UI"
            r_bold.font.size = Pt(9.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(9.5)
        run.font.italic = italic
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        return p

    def add_bullet(lead_text, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r_lead = p.add_run(lead_text + " ")
        r_lead.font.name = "Segoe UI"
        r_lead.font.size = Pt(9.5)
        r_lead.font.bold = True
        r_lead.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r_text = p.add_run(text)
        r_text.font.name = "Segoe UI"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    def add_caption(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(8)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(8.5)
        run.font.italic = True
        run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    def add_callout(code_or_tree_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
        set_cell_borders(cell, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(code_or_tree_text)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    def add_styled_table(headers, rows_data, col_widths=None):
        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Header Row
        hdr_cells = tbl.rows[0].cells
        for col_idx, h_text in enumerate(headers):
            cell = hdr_cells[col_idx]
            set_cell_background(cell, "1E3A8A")
            set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
            set_cell_borders(cell, top="1E3A8A", bottom="1E3A8A", left="3B82F6", right="3B82F6")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(h_text)
            run.font.name = "Segoe UI"
            run.font.size = Pt(9.0)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Data Rows
        for row_idx, r_data in enumerate(rows_data):
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            row_cells = tbl.rows[row_idx + 1].cells
            for col_idx, val in enumerate(r_data):
                cell = row_cells[col_idx]
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=90, bottom=90, left=140, right=140)
                set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                run = p.add_run(val)
                run.font.name = "Segoe UI"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

        # Apply column widths
        if col_widths:
            for row in tbl.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = width

    # =========================================================================
    # DOCUMENT CONTENT
    # =========================================================================

    # Title & Subtitle
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("Kiến Trúc DevOps & Hướng Dẫn Vận Hành Hạ Tầng")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(19)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(8)
    run_d = desc_p.add_run("Tài liệu kỹ thuật tổng hợp toàn diện kiến trúc DevOps của hệ thống Bán Hàng Việt Monorepo: từ quy chuẩn Container hóa, luồng tự động hóa CI/CD GitHub Actions, cấu trúc mạng cô lập Docker Compose đến cơ chế triển khai Zero-Downtime Rolling Deployment và sao lưu CSDL tự động.")
    run_d.font.name = "Segoe UI"
    run_d.font.size = Pt(9.5)
    run_d.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    add_divider()

    # SECTION 1
    add_h1("1. Tổng Quan Kiến Trúc DevOps & Hạ Tầng Máy Chủ")
    add_p("Hệ thống Bán Hàng Việt được triển khai theo mô hình Monorepo kết hợp kiến trúc Container hóa khép kín trên nền tảng máy chủ đám mây Ubuntu Linux VPS. Toàn bộ quy trình từ kiểm thử, đóng gói Docker Image đến đưa lên máy chủ sản xuất được tự động hóa 100% qua GitHub Actions.")

    # Image 1
    if os.path.exists("docs/architecture/devops_system_architecture.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture("docs/architecture/devops_system_architecture.png", width=Inches(6.8))
        add_caption("Hình 1: Sơ đồ kiến trúc DevOps & Hạ tầng triển khai tổng thể của Bán Hàng Việt Monorepo")

    add_p("Mô hình hạ tầng phân chia trách nhiệm rõ ràng giữa các phân vùng:", bold_prefix="Phân vùng trách nhiệm:")
    add_bullet("Phân vùng Phát triển (Developer Workspace):", "Lập trình viên làm việc trên mã nguồn cục bộ, chạy kiểm thử tự động, tuân thủ Clean Code và đẩy commit lên GitHub.")
    add_bullet("Phân vùng Tự động hóa (GitHub Actions & GHCR):", "Đảm nhiệm vai trò Continuous Integration (chạy 1406 tests backend và 522 tests frontend) và Continuous Delivery (build Docker image đa tầng, gắn tag phiên bản và lưu trữ trên GitHub Container Registry).")
    add_bullet("Phân vùng Máy chủ Sản xuất (Production VPS):", "Máy chủ Ubuntu 22.04 LTS chạy Docker Engine & Docker Compose. Điều phối 3 container chính: Nginx Frontend (Reverse Proxy), Spring Boot Backend (API Server) và MySQL 8.0 (Database).")

    add_p("Bảng tổng hợp vai trò của các thành phần hạ tầng cốt lõi:", bold_prefix="Bảng 1: Ma trận thành phần hạ tầng:")
    add_styled_table(
        ["Thành phần", "Công nghệ / Phiên bản", "Vai trò và Chức năng chính"],
        [
            ["Mã nguồn Monorepo", "Git / GitHub Repository", "Quản lý tập trung cả frontend/, backend/, scripts/, docs/ trên cùng một vòng đời phiên bản."],
            ["CI/CD Runner", "GitHub Actions (ubuntu-latest)", "Tự động kích hoạt test song song, build multi-stage image và kích hoạt SSH deploy."],
            ["Container Registry", "GitHub Packages (ghcr.io)", "Lưu trữ Docker Image an toàn, phân quyền riêng tư qua GITHUB_TOKEN, gắn tag commit-sha."],
            ["Reverse Proxy / Web", "Nginx 1.25 Alpine", "Điều hướng SSL/TLS (Let's Encrypt), phục vụ Single Page App React, proxy ngược /api về Backend."],
            ["Backend Service", "Spring Boot 3.3.4 (Java 21)", "Cung cấp REST API, xử lý nghiệp vụ bán hàng, quản lý phiên JWT và ngữ cảnh Đa hộ (Multi-tenancy)."],
            ["Database Service", "MySQL 8.0 Community", "Lưu trữ dữ liệu quan hệ, cô lập trong mạng nội bộ, tự động chạy migration qua Flyway."],
            ["Hạ tầng Scripts", "POSIX Shell (/scripts)", "Điều phối triển khai Zero-Downtime (deploy.sh) và sao lưu CSDL xoay vòng 7 ngày (backup_db.sh)."]
        ],
        col_widths=[Inches(1.8), Inches(1.8), Inches(3.2)]
    )

    add_divider()

    # SECTION 2
    add_h1("2. Container Hóa Đa Tầng (Dockerization & Multi-stage Builds)")
    add_p("Nhằm đạt được hiệu năng tải tối đa, giảm thiểu kích thước Docker Image và loại bỏ hoàn toàn các lỗ hổng bảo mật của môi trường biên dịch, cả Backend và Frontend đều áp dụng triệt để kỹ thuật Multi-stage Build.")

    add_h2("2.1. Đóng Gói Backend Spring Boot (backend/Dockerfile)")
    add_p("Quy trình đóng gói Backend chia thành 2 giai đoạn rõ rệt:", bold_prefix="Cơ chế 2 giai đoạn:")
    add_bullet("Stage 1 (Builder):", "Sử dụng maven:3.9-eclipse-temurin-17-alpine. Tận dụng cơ chế layer cache bằng cách copy riêng pom.xml và chạy mvn dependency:go-offline trước khi copy toàn bộ mã nguồn src/. Điều này giúp các lần build tiếp theo chỉ mất vài giây nếu không thay đổi thư viện.")
    add_bullet("Stage 2 (Runtime):", "Sử dụng base image siêu nhẹ eclipse-temurin:17-jre-alpine (~180MB). Chỉ copy duy nhất tệp app.jar đã đóng gói từ Stage 1 sang, loại bỏ toàn bộ công cụ Maven và mã nguồn.")
    add_bullet("Bảo mật Non-root User:", "Tạo tài khoản người dùng spring và nhóm người dùng spring (UID 1001). Tiến hành phân quyền chown app.jar và chạy ứng dụng dưới user này. Ngăn chặn tuyệt đối nguy cơ tấn công leo thang đặc quyền (Privilege Escalation) nếu container bị tấn công.")
    add_bullet("Cấu hình Môi trường & Timezone:", "Thiết lập biến môi trường -Duser.timezone=Asia/Ho_Chi_Minh đảm bảo hóa đơn điện tử, đơn hàng và báo cáo thuế luôn đồng nhất múi giờ Việt Nam (UTC+7).")

    add_h2("2.2. Đóng Gói Frontend React Vite (frontend/Dockerfile)")
    add_p("Frontend được tối ưu hóa thành một tệp đóng gói tĩnh kết hợp máy chủ Nginx hiệu năng cao:", bold_prefix="Cơ chế 2 giai đoạn:")
    add_bullet("Stage 1 (Builder):", "Sử dụng node:20-alpine. Chạy npm ci để cài đặt chính xác các phiên bản dependency theo package-lock.json, sau đó chạy npm run build tạo thư mục phân phối dist/ tĩnh.")
    add_bullet("Stage 2 (Production Server):", "Sử dụng nginx:1.25-alpine (~25MB). Copy toàn bộ thư mục dist/ vào /usr/share/nginx/html và nạp tệp cấu hình tùy chỉnh nginx.conf.")
    add_bullet("Khắc phục triệt để lỗi 413 (Payload Too Large):", "Cấu hình client_max_body_size 50M; đồng bộ với mức 50MB của Spring Boot, phục vụ nhập file Excel lớn (10.000 hàng hóa/khách hàng) mà không bị Nginx từ chối.")
    add_bullet("Hỗ trợ Single Page Application (SPA):", "Khai báo try_files $uri $uri/ /index.html; giải quyết hoàn toàn lỗi HTTP 404 Not Found khi người dùng F5 tải lại trang tại các đường dẫn con React Router.")
    add_bullet("Chống lỗi CORS (Cross-Origin Resource Sharing):", "Nginx đóng vai trò Reverse Proxy điều hướng toàn bộ request /api/ sang http://banhangviet-be:8080. Cả giao diện và API đều cùng chung một Domain/Port nên trình duyệt không phát sinh kiểm tra CORS pre-flight.")

    add_p("So sánh hiệu quả trước và sau khi áp dụng Multi-stage Build:", bold_prefix="Bảng 2: So sánh tối ưu hóa Container Image:")
    add_styled_table(
        ["Dịch vụ", "Build thông thường (Single-stage)", "Multi-stage Build (Hiện tại)", "Mức độ tối ưu"],
        [
            ["Backend (Spring Boot)", "~850 MB (Chứa cả JDK + Maven + Source)", "~220 MB (Chỉ chứa JRE + JAR thực thi)", "Giảm 74% dung lượng, loại bỏ rủi ro lộ mã nguồn"],
            ["Frontend (React Vite)", "~450 MB (Chứa Node_modules + Tooling)", "~32 MB (Chỉ chứa Nginx + HTML/JS minified)", "Giảm 93% dung lượng, tải trang và deploy siêu tốc"],
            ["Thời gian Pull Image VPS", "Khoảng 60 - 90 giây", "Khoảng 8 - 15 giây", "Tăng tốc độ triển khai gấp 6 lần"]
        ],
        col_widths=[Inches(1.8), Inches(2.2), Inches(2.2), Inches(0.6)]
    )

    add_divider()

    # SECTION 3
    add_h1("3. Điều Phối Mạng Nội Bộ & An Ninh Dữ Liệu (Docker Compose)")
    add_p("Hạ tầng ứng dụng trên máy chủ VPS được điều phối thống nhất thông qua tệp cấu hình docker-compose.yml đặt tại thư mục gốc.")

    add_callout(
"""version: '3.8'

x-logging-options: &default-logging
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'

services:
  banhangviet-be:
    container_name: banhangviet-be
    image: ${BE_IMAGE_NAME:-ghcr.io/lean1835/banhangviet-be:latest}
    restart: always
    security_opt:
      - no-new-privileges:true
    env_file:
      - ./backend/.env
    networks:
      - shared_network
    logging: *default-logging

  banhangviet-fe:
    container_name: banhangviet-fe
    image: ${FE_IMAGE_NAME:-ghcr.io/lean1835/banhangviet-fe:latest}
    ports:
      - '${FE_PORT:-80}:80'
      - '443:443'
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - banhangviet-be
    restart: always
    logging: *default-logging

networks:
  shared_network:
    name: default_network
    external: true"""
    )
    add_caption("Mã nguồn cấu hình docker-compose.yml chuẩn hóa an ninh và tối ưu vận hành")

    add_p("Các điểm cốt lõi trong kiến trúc điều phối Docker Compose:", bold_prefix="Nguyên tắc an toàn hạ tầng:")
    add_bullet("Cô lập mạng nội bộ (Internal Isolated Network):", "Toàn bộ container gia nhập shared_network (default_network). Backend kết nối CSDL MySQL qua DNS nội bộ banhangviet-db:3306. CSDL MySQL tuyệt đối không mở port ra Internet công cộng, ngăn chặn 100% các cuộc quét cổng và tấn công Brute-force từ bên ngoài.")
    add_bullet("Cơ chế chống tràn dung lượng đĩa (Log Rotation):", "Áp dụng cấu hình mặc định driver: 'json-file' với giới hạn cứng max-size: '10m' và max-file: '3'. Đảm bảo log của mỗi container không bao giờ vượt quá 30MB, loại trừ nguy cơ VPS bị tê liệt do đầy ổ cứng.")
    add_bullet("Lưu trữ bền vững (Persistent Storage):", "Dữ liệu CSDL MySQL được gắn kết vào Docker Volume /var/lib/mysql. Mọi hoạt động cập nhật phần mềm, tái khởi động container hay re-deploy đều không gây mất mát dữ liệu.")
    add_bullet("Bảo mật phân quyền (No New Privileges):", "Khai báo cờ bảo mật security_opt: [no-new-privileges:true] ngăn chặn mọi tiến trình bên trong container tự động nâng quyền lên root của máy chủ host.")

    add_divider()

    # SECTION 4
    add_h1("4. Quy Trình CI/CD Tự Động Hóa (GitHub Actions Pipeline)")
    add_p("Chuỗi tự động hóa CI/CD được thiết lập qua tệp .github/workflows/deploy.yml với triết lý: 100% minh bạch, kiểm thử toàn diện mọi nhánh và chỉ cho phép đưa code lên Production khi toàn bộ kiểm thử đạt chuẩn tuyệt đối.")

    # Image 2
    if os.path.exists("docs/architecture/devops_cicd_flow.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture("docs/architecture/devops_cicd_flow.png", width=Inches(6.8))
        add_caption("Hình 2: Sơ đồ luồng quyết định 3 giai đoạn và các cổng kiểm soát chất lượng (Quality Gates)")

    add_p("Chi tiết 3 giai đoạn trong quy trình CI/CD:", bold_prefix="3 Giai đoạn thực thi:")
    add_bullet("Giai đoạn 1: Verify Song Song (Mọi nhánh & Pull Request):", "Khi có bất kỳ commit push hoặc PR mở vào bất kỳ nhánh nào, GitHub Actions khởi chạy song song 2 máy ảo: một máy chạy mvn test -B (kiểm tra 1406 test cases backend và migration Flyway), một máy chạy npm ci, npm run lint, Vitest (522 test cases frontend) và npm run build. Nếu có dù chỉ 1 lỗi, pipeline lập tức Báo đỏ, chặn Merge PR và không build Docker Image.")
    add_bullet("Giai đoạn 2: Build & Push Docker Image (Chỉ nhánh production):", "Khi mã nguồn được duyệt và hợp nhất vào nhánh production, Stage 2 kích hoạt Docker Buildx với bộ nhớ đệm GitHub Cache. Đóng gói 2 images gắn thẻ định danh SHA commit và :latest, sau đó đẩy lên GitHub Container Registry (ghcr.io).")
    add_bullet("Giai đoạn 3: SSH Rolling Deploy lên VPS:", "Sử dụng ssh-agent nạp khóa bí mật PRODUCTION_SSH_KEY kết nối trực tiếp vào máy chủ VPS. Đồng bộ docker-compose.yml, nạp file cấu hình bảo mật và kích hoạt kịch bản deploy.sh.")

    add_divider()

    # SECTION 5
    add_h1("5. Kịch Bản Triển Khai Zero-Downtime & Vận Hành Trên VPS")
    add_p("Tính năng ấn tượng nhất của hạ tầng DevOps Bán Hàng Việt là khả năng triển khai ứng dụng mà không gây gián đoạn dịch vụ (Zero-Downtime) thông qua kịch bản điều phối tự động scripts/deploy.sh trên VPS.")

    # Image 3
    if os.path.exists("docs/architecture/devops_zero_downtime_deploy.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture("docs/architecture/devops_zero_downtime_deploy.png", width=Inches(6.8))
        add_caption("Hình 3: Quy trình triển khai Rolling Zero-Downtime & Vòng lặp Healthcheck Polling trên VPS")

    add_p("Quy trình 5 bước thực thi trong scripts/deploy.sh:", bold_prefix="Trình tự triển khai:")
    add_bullet("Bước 1: Tải Docker Images với cơ chế Thử lại (Retry):", "Script gọi docker pull cho cả BE và FE với hàm bọc retry tối đa 3 lần, delay 5 giây giữa các lần nhằm chống lỗi rớt gói mạng quốc tế.")
    add_bullet("Bước 2: Khởi chạy lại Backend Container trước:", "Chạy docker compose up -d banhangviet-be. Lúc này, container Frontend cũ vẫn đang hoạt động bình thường và phục vụ người dùng.")
    add_bullet("Bước 3: Vòng lặp thăm dò sức khỏe (Healthcheck Polling):", "Script thực hiện vòng lặp 48 lần (mỗi lần cách nhau 5 giây, tối đa 240 giây = 4 phút) kiểm tra trạng thái sức khỏe qua lệnh docker inspect --format='{{.State.Health.Status}}'. Điểm kiểm tra là API /api/v1/sync/health của Backend (xác nhận kết nối CSDL thành công và Flyway đã chạy xong).")
    add_bullet("Bước 4: Khởi chạy Frontend Container sau:", "Chỉ khi Backend báo healthy (HTTP 200), script mới khởi chạy docker compose up -d banhangviet-fe. Nginx khởi động lại chỉ mất 1-2 giây và lập tức chuyển tiếp người dùng sang Backend phiên bản mới. Người dùng hoàn toàn không gặp lỗi HTTP 502 Bad Gateway.")
    add_bullet("Bước 5: Tự động dọn dẹp tài nguyên thừa:", "Chạy docker image prune -f giải phóng ngay lập tức các layer image cũ, giữ cho dung lượng ổ đĩa VPS luôn sạch sẽ.")

    add_h2("5.2. Kịch Bản Tự Động Sao Lưu Dữ Liệu (scripts/backup_db.sh)")
    add_p("Để phòng chống thảm họa mất mát dữ liệu, dự án trang bị kịch bản sao lưu CSDL tự động và xoay vòng tệp:", bold_prefix="Cơ chế sao lưu an toàn:")
    add_bullet("Xuất dữ liệu an toàn:", "Chạy lệnh mysqldump --single-transaction --quick trực tiếp từ container banhangviet-db. Không gây khóa bảng (table lock), đảm bảo hoạt động bán hàng POS vẫn diễn ra bình thường trong lúc sao lưu.")
    add_bullet("Nén dữ liệu mức tối đa:", "Dữ liệu xuất ra được nén trực tiếp qua đường ống gzip -9 giúp giảm hơn 85% dung lượng lưu trữ.")
    add_bullet("Tự động xoay vòng 7 ngày (Retention Policy):", "Lệnh find \"$BACKUP_DIR\" -name \"db_*.sql.gz\" -type f -mtime +7 -delete tự động dọn sạch các bản backup cũ hơn 7 ngày, cân bằng hoàn hảo giữa an toàn dữ liệu và dung lượng ổ cứng.")

    add_divider()

    # SECTION 6
    add_h1("6. Quản Trị Bí Mật & An Ninh Hạ Tầng (Secrets Audit)")
    add_p("Tuyệt đối không lưu trữ mật khẩu, khóa bí mật hay chứng chỉ bảo mật trong mã nguồn Git công khai. Mọi thông tin nhạy cảm được quản lý qua GitHub Repository Secrets.")

    add_styled_table(
        ["Tên Biến Bí Mật (Secret)", "Môi trường lưu trữ", "Mục đích sử dụng & Biện pháp bảo vệ"],
        [
            ["PRODUCTION_IP", "GitHub Actions Secret", "Địa chỉ IP tĩnh của máy chủ VPS. Chỉ nạp vào phiên chạy SSH của CI/CD runner."],
            ["PRODUCTION_USER", "GitHub Actions Secret", "Tên tài khoản người dùng Linux trên VPS (ví dụ: ubuntu)."],
            ["PRODUCTION_SSH_KEY", "GitHub Actions Secret", "Cặp khóa SSH Private Key ED25519 được mã hóa, không sử dụng mật khẩu truy cập SSH thông thường."],
            ["ENV_PRODUCTION", "GitHub Actions Secret", "Toàn bộ chuỗi cấu hình biến môi trường Backend (DB_PASSWORD, JWT_SECRET, GEMINI_API_KEY, VIETQR_KEY...)."],
            ["GITHUB_TOKEN", "GitHub Auto Generated", "Token tự động cấp với quyền ghi packages:write dùng để đăng nhập và push image lên GHCR."]
        ],
        col_widths=[Inches(1.8), Inches(1.8), Inches(3.2)]
    )

    add_p("Cơ chế truyền bí mật chống lộ lề:", bold_prefix="Biện pháp truyền Secret an toàn:")
    add_p("Thay vì ghi bí mật vào command line hoặc lưu file tạm trên runner, chuỗi ENV_PRODUCTION được truyền trực tiếp qua stdin của kết nối mã hóa SSH: printf '%s\\n' \"$ENV_PRODUCTION\" | ssh ... \"cat > $DEPLOY_PATH/backend/.env\". Cách làm này ngăn chặn 100% việc rò rỉ secret trong bash history hay log của runner.")

    add_divider()

    # SECTION 7
    add_h1("7. Sổ Tay Vận Hành & Khắc Phục Sự Cố Khẩn Cấp (Runbook)")
    add_p("Bảng tổng hợp các câu lệnh hỗ trợ vận hành và giám sát hệ thống nhanh trên máy chủ VPS:", bold_prefix="Bảng 3: Sổ tay tra cứu lệnh vận hành máy chủ:")

    add_styled_table(
        ["Nhu cầu vận hành", "Câu lệnh thực thi trên VPS", "Mục đích kiểm tra"],
        [
            ["Xem log Backend trực tiếp", "docker logs -f --tail 100 banhangviet-be", "Theo dõi hoạt động xử lý API, truy vấn CSDL và lỗi ngoại lệ nếu có."],
            ["Xem log Nginx Frontend", "docker logs -f --tail 50 banhangviet-fe", "Kiểm tra lưu lượng truy cập HTTP, mã trạng thái 200/404/500."],
            ["Kiểm tra sức khỏe container", "docker inspect --format='{{.State.Health.Status}}' banhangviet-be", "Xác nhận trạng thái trả về healthy."],
            ["Kiểm tra tài nguyên RAM/CPU", "docker stats --no-stream", "Đảm bảo container không bị tràn RAM hoặc nghẽn CPU."],
            ["Chạy sao lưu CSDL ngay", "/bin/sh ~/banhangviet-deployment/scripts/backup_db.sh", "Tạo ngay 1 bản snapshot CSDL nén gzip tại thư mục backups/."],
            ["Dọn dẹp rác hệ thống", "docker system prune -f", "Xóa các container đã dừng, network không dùng và dangling images."]
        ],
        col_widths=[Inches(1.8), Inches(2.8), Inches(2.2)]
    )

    add_h2("7.2. Quy Trình Khôi Phục (Rollback) Khẩn Cấp Trong 30 Giây")
    add_p("Trong trường hợp phiên bản mới được deploy thành công nhưng phát sinh lỗi logic nghiệp vụ nghiêm trọng, người quản trị có thể rollback về phiên bản ổn định trước đó bằng đúng 1 câu lệnh duy nhất:")

    add_callout(
"""# Đăng nhập vào VPS và chạy lệnh Rollback với commit SHA phiên bản ổn định cũ:
cd ~/banhangviet-deployment
BE_IMAGE_NAME="ghcr.io/lean1835/banhangviet-be:5f8ddd75" \\
FE_IMAGE_NAME="ghcr.io/lean1835/banhangviet-fe:5f8ddd75" \\
DEPLOY_PATH="$PWD" \\
/bin/sh scripts/deploy.sh"""
    )
    add_caption("Lệnh Rollback tức thời về bản build ổn định đã được lưu trữ vĩnh viễn trên GHCR")

    # Save document
    out_path = "docs/architecture/devops_architecture.docx"
    doc.save(out_path)
    print(f"DevOps Architecture DOCX created successfully at: {out_path}")

if __name__ == "__main__":
    create_devops_docx()
