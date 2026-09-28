import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def create_docx():
    doc = docx.Document()
    
    # Page Margins
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

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
        run.font.size = Pt(13)
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

    def add_p(text, bold_prefix=""):
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

    def add_callout(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        set_cell_borders(cell, top="CBD5E1", bottom="CBD5E1", left="CBD5E1", right="CBD5E1")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(code_text)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    def add_styled_table(headers, rows_data, col_widths=None):
        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        hdr_cells = tbl.rows[0].cells
        for col_idx, h_text in enumerate(headers):
            cell = hdr_cells[col_idx]
            set_cell_background(cell, "1E3A8A")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            set_cell_borders(cell, top="1E3A8A", bottom="1E3A8A", left="3B82F6", right="3B82F6")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(h_text)
            run.font.name = "Segoe UI"
            run.font.size = Pt(9.0)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        for row_idx, r_data in enumerate(rows_data):
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            row_cells = tbl.rows[row_idx + 1].cells
            for col_idx, val in enumerate(r_data):
                cell = row_cells[col_idx]
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                set_cell_borders(cell, top="E2E8F0", bottom="E2E8F0", left="E2E8F0", right="E2E8F0")
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                run = p.add_run(val)
                run.font.name = "Segoe UI"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

        if col_widths:
            for row in tbl.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = width

    # =========================================================================
    # DOCUMENT BODY
    # =========================================================================

    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("Giải Thích Chi Tiết Các Tệp Docker, Deploy & Backup")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(18)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(6)
    run_d = desc_p.add_run("Cẩm nang giải thích cặn kẽ, ngắn gọn bằng ngôn ngữ đời thường từng dòng mã trong bộ tệp hạ tầng: Dockerfile (BE & FE), nginx.conf, docker-compose.yml, deploy.sh và backup_db.sh.")
    run_d.font.name = "Segoe UI"
    run_d.font.size = Pt(9.5)
    run_d.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    add_divider()

    # Image
    if os.path.exists("docs/architecture/devops_components_diagram.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture("docs/architecture/devops_components_diagram.png", width=Inches(6.8))
        add_caption("Hình 1: Sơ đồ tương tác giữa bộ Dockerfile, Docker Compose và các kịch bản tự động trên VPS")

    # SECTION 1: DOCKERFILES
    add_h1("1. Bộ Tệp Đóng Gói Container (Dockerfile BE & FE)")

    add_h2("1.1. Tệp backend/Dockerfile (Đóng gói Spring Boot Java 21)")
    add_p("Tệp này đóng vai trò như một xưởng cơ khí tự động sản xuất ra động cơ Backend siêu nhẹ và cực kỳ bảo mật:", bold_prefix="Hình tượng đời sống:")

    add_callout(
"""# STAGE 1: Xưởng lắp ráp (Maven Builder)
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B
RUN mv target/*.jar target/app.jar

# STAGE 2: Sản phẩm xuất xưởng (Runtime siêu nhẹ)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk --no-cache add curl && rm -rf /var/cache/apk/*
RUN addgroup -S spring && adduser -S spring -G spring && \\
    mkdir -p /app/backups && chown -R spring:spring /app
USER spring:spring
COPY --chown=spring:spring --from=builder /app/target/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]"""
    )
    add_caption("Mã nguồn backend/Dockerfile: Multi-stage, Layer Cache và Non-root User")

    add_bullet("Kỹ thuật Layer Cache (Dòng 9 - 10):", "Copy riêng pom.xml và tải thư viện về trước (mvn dependency:go-offline). Khi lập trình viên sửa code Java trong src/, Docker chỉ biên dịch lại code mới chứ không tải lại hàng trăm MB thư viện, giúp build cực nhanh.")
    add_bullet("Cắt gọt dung lượng qua Stage 2 (Dòng 22):", "Chỉ mang duy nhất file app.jar sang image JRE (chỉ chứa môi trường chạy Java, không có Maven và mã nguồn). Giảm kích thước từ ~850MB xuống còn ~220MB.")
    add_bullet("Tạo User phi đặc quyền USER spring:spring (Dòng 30 - 33):", "Điểm ăn điểm bảo mật: Mặc định Docker chạy quyền root máy tính. Tại đây tạo riêng user 'spring' (UID 1001) để chạy ứng dụng. Nếu hacker tấn công vào backend thì cũng không thể chiếm quyền điều khiển máy chủ VPS host.")
    add_bullet("Tối ưu bộ nhớ JVM (Dòng 40):", "Sử dụng Garbage Collector G1GC hiện đại (-XX:+UseG1GC) và cho phép Java tự động co giãn theo dung lượng RAM của container (-XX:MaxRAMPercentage=75.0), chống lỗi OutOfMemory.")

    add_h2("1.2. Tệp frontend/Dockerfile & frontend/nginx.conf")
    add_p("Đóng gói giao diện React thành các tệp tĩnh HTML/JS và dùng máy chủ Nginx tí hon để phục vụ:", bold_prefix="Hình tượng đời sống:")

    add_callout(
"""# frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]"""
    )
    add_caption("Mã nguồn frontend/Dockerfile: Siêu nhẹ ~32MB chạy trên Nginx Alpine")

    add_p("3 Điểm cốt lõi bên trong tệp cấu hình frontend/nginx.conf:", bold_prefix="Tính năng cứu tinh trong nginx.conf:")
    add_bullet("client_max_body_size 50M (Dòng 9):", "Cho phép upload file lên đến 50MB (đồng bộ với Spring Boot). Mặc định Nginx chỉ cho phép 1MB. Nếu không có dòng này, khi người dùng tải tệp Excel 10.000 hàng hóa thì Nginx sẽ chặn ngay bằng lỗi HTTP 413 (Payload Too Large).")
    add_bullet("try_files $uri $uri/ /index.html (Dòng 53):", "Cứu tinh của React Router: Khi người dùng đang ở trang /pos hoặc /tax-report mà bấm F5 tải lại, Nginx sẽ tự chuyển tiếp về index.html để React vẽ tiếp giao diện, tránh bị lỗi HTTP 404 Not Found.")
    add_bullet("Reverse Proxy /api/ (Dòng 57 - 60):", "location /api/ { proxy_pass http://banhangviet-be:8080/api/; }: Cả giao diện và API đều cùng chung 1 cổng 80/443 của Nginx, xóa sổ hoàn toàn lỗi CORS gây đau đầu của các ứng dụng Web.")

    add_divider()

    # SECTION 2: DOCKER COMPOSE
    add_h1("2. Tệp Điều Phối Toàn Hệ Thống (docker-compose.yml)")
    add_p("Được ví như nhạc trưởng điều phối 3 nhạc công: Backend (Spring Boot), Frontend (Nginx) và Database (MySQL).", bold_prefix="Hình tượng đời sống:")

    add_callout(
"""x-logging-options: &default-logging
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '5'

services:
  banhangviet-be:
    container_name: banhangviet-be
    image: ${BE_IMAGE_NAME:-ghcr.io/lean1835/banhangviet-be:latest}
    security_opt: [no-new-privileges:true]
    ports: ['${BE_PORT:-8080}:8080']
    healthcheck:
      test: ['CMD', 'curl', '--fail', 'http://127.0.0.1:8080/api/v1/sync/health']
      interval: 10s
      retries: 8
      start_period: 180s
    volumes: ['./backups:/app/backups']
    env_file: ./backend/.env
    networks: [shared_network]

  banhangviet-fe:
    container_name: banhangviet-fe
    image: ${FE_IMAGE_NAME:-ghcr.io/lean1835/banhangviet-fe:latest}
    ports: ['${FE_PORT:-80}:80', '443:443']
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [banhangviet-be]
    networks: [shared_network]

networks:
  shared_network:
    external: true
    name: ${DOCKER_NETWORK:-default_network}"""
    )
    add_caption("Mã nguồn docker-compose.yml: Cô lập mạng, giới hạn log và kiểm tra sức khỏe")

    add_bullet("Cơ chế Log Rotation (Dòng 1 - 5):", "driver: 'json-file', max-size: '10m', max-file: '5'. Nghĩa là log của container chỉ được to tối đa 10MB và giữ tối đa 5 file (tổng 50MB). Khi đầy nó tự xoay vòng ghi đè. Không bao giờ có chuyện server bị sập vì đầy ổ cứng.")
    add_bullet("Bảo mật mạng nội bộ (shared_network):", "Backend và Database nói chuyện với nhau bằng đường mạng ngầm nội bộ qua DNS tĩnh (jdbc:mysql://banhangviet-db:3306/...). CSDL MySQL không mở port 3306 ra ngoài Internet, ngăn chặn 100% hacker quét cổng.")
    add_bullet("depends_on: [banhangviet-be] (Dòng 53):", "Frontend phụ thuộc vào Backend, đảm bảo thứ tự khởi động chuẩn.")
    add_bullet("Volume SSL Let's Encrypt (Dòng 51):", "Mount thư mục chứng chỉ SSL từ host vào container Nginx ở chế độ chỉ đọc (:ro), giúp trang web chạy HTTPS màu xanh an toàn.")

    add_divider()

    # SECTION 3: DEPLOY.SH
    add_h1("3. Kịch Bản Triển Khai Không Gián Đoạn (scripts/deploy.sh)")
    add_p("Kịch bản chạy trực tiếp trên máy chủ VPS, thực hiện việc thay thế phiên bản mới mà khách hàng đang mua sắm không hề bị gián đoạn (Zero-Downtime):", bold_prefix="Mục đích thông dụng:")

    add_callout(
"""# 1. Hàm tải image có cơ chế thử lại (Retry x3)
retry docker pull "$BE_IMAGE_NAME"
retry docker pull "$FE_IMAGE_NAME"

# 2. Khởi chạy Backend trước (Frontend cũ vẫn đang phục vụ khách)
docker compose up -d banhangviet-be

# 3. Vòng lặp thăm dò sức khỏe (Health Check Polling)
MAX_RETRIES=48 # 48 lần x 5s = 240s (4 phút)
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' banhangviet-be)
  if [ "$STATUS" = "healthy" ]; then
    HEALTHY=1; break
  fi
  sleep 5
done

# 4. Khi Backend đã 'healthy', mới bật Frontend phiên bản mới
if [ $HEALTHY -eq 1 ]; then
  docker compose up -d banhangviet-fe
  docker image prune -f  # Dọn dẹp image cũ
else
  # Nếu lỗi, in log 100 dòng và giữ nguyên Frontend cũ
  docker logs --tail 100 banhangviet-be
  exit 1
fi"""
    )
    add_caption("Quy trình 4 bước then chốt trong scripts/deploy.sh bảo vệ Zero-Downtime")

    add_bullet("Hàm retry 3 lần (Dòng 15 - 32):", "Nếu mạng quốc tế từ VPS tải ảnh từ GitHub Container Registry bị chập chờn, script tự đợi 5 giây và thử lại tối đa 3 lần chứ không vội báo lỗi bỏ cuộc.")
    add_bullet("Bí quyết Zero-Downtime:", "Tại sao không chạy docker compose up -d cả 2 cùng lúc? Vì nếu chạy cùng lúc, Backend Spring Boot mất khoảng 30-40 giây khởi động kết nối CSDL và chạy Flyway; trong lúc đó người dùng vào web bấm thanh toán sẽ bị dính ngay lỗi HTTP 502 Bad Gateway. Do đó, script BẬT BACKEND TRƯỚC, đợi khi nào Backend báo 'healthy' (HTTP 200) thì mới bật Frontend. Khách hàng không hề biết hệ thống vừa được nâng cấp!")
    add_bullet("Dọn dẹp rác tự động (docker image prune -f):", "Sau khi nâng cấp thành công, các layer Docker cũ tự động bị xóa bỏ để giải phóng dung lượng đĩa.")

    add_divider()

    # SECTION 4: BACKUP_DB.SH
    add_h1("4. Kịch Bản Tự Động Sao Lưu Dữ Liệu (scripts/backup_db.sh)")
    add_p("Chiếc phao cứu sinh bảo vệ tài sản quý giá nhất của doanh nghiệp - Dữ liệu bán hàng và hóa đơn thuế:", bold_prefix="Hình tượng đời sống:")

    add_callout(
"""#!/bin/sh
set -eu

BACKUP_DIR="/home/ubuntu/banhangviet-deployment/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

# 1. Trích xuất CSDL trực tiếp trong container và nén gzip-9
docker exec "$DB_CONTAINER" mysqldump \\
  -u"$DB_USER" -p"$DB_PASS" \\
  --single-transaction --quick \\
  --default-character-set=utf8mb4 \\
  "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# 2. Tự động tìm và xóa các bản sao lưu cũ hơn 7 ngày
find "$BACKUP_DIR" -name "db_${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete || true"""
    )
    add_caption("Mã nguồn scripts/backup_db.sh: Sao lưu nén cao và tự xoay vòng 7 ngày")

    add_bullet("mysqldump --single-transaction (Dòng 29):", "Điểm ăn điểm kỹ thuật: Tùy chọn này sao lưu dữ liệu trong 1 transaction nhất quán của InnoDB mà KHÔNG KHÓA BẢNG (no table lock). Nhân viên thu ngân tại quầy vẫn bấm máy in hóa đơn bán hàng bình thường mà không bị lag hay đơ máy.")
    add_bullet("Nén gzip -9 qua đường ống (Dòng 32):", "Dữ liệu xuất ra từ MySQL lập tức được truyền qua đường ống (pipe |) để nén mức 9 cao nhất. Tiết kiệm hơn 85% dung lượng lưu trữ trên VPS.")
    add_bullet("Chính sách xoay vòng 7 ngày (Dòng 39):", "Lệnh find ... -mtime +7 -delete tự động quét dọn. VPS sẽ luôn lưu trữ trọn vẹn 7 ngày gần nhất để khôi phục khi có sự cố, đồng thời không bao giờ để file backup tích tụ qua nhiều năm gây đầy ổ cứng.")

    add_divider()

    # SECTION 5: QUESTIONS FOR DEFENSE
    add_h1("5. Bảng 8 Câu Hỏi Vấn Đáp Thầy Cô Hay Hỏi Nhất Về Bộ Tệp Này")

    add_styled_table(
        ["Câu hỏi của Giảng viên / Hội đồng", "Vị trí mã nguồn", "Câu trả lời ngắn gọn & Thuyết phục"],
        [
            ["1. Tại sao dùng Multi-stage Build trong Dockerfile?", "backend/Dockerfile & frontend/Dockerfile", "Tách riêng khâu build và khâu chạy. Image sản phẩm chỉ chứa file thực thi, giảm 70-90% dung lượng và không lộ mã nguồn hay công cụ biên dịch."],
            ["2. Chạy container dưới quyền user 'spring' có lợi ích gì?", "backend/Dockerfile (Dòng 30-33)", "Áp dụng nguyên tắc Least Privilege (quyền tối thiểu), không dùng quyền root. Ngăn chặn hacker chiếm quyền điều khiển máy chủ host nếu container bị khai thác."],
            ["3. Làm thế nào để giải quyết lỗi CORS giữa React và Spring Boot?", "frontend/nginx.conf (Dòng 57-60)", "Nginx làm Reverse Proxy, chuyển tiếp các request /api/ sang backend. Cả FE và BE cùng chung Domain/Port nên trình duyệt không phát sinh kiểm tra CORS."],
            ["4. Làm sao tránh lỗi người dùng F5 bị 404 trong React Router?", "frontend/nginx.conf (Dòng 53)", "Dùng lệnh try_files $uri $uri/ /index.html. Khi không tìm thấy file tĩnh, Nginx tự chuyển tiếp về index.html để React Router xử lý định tuyến."],
            ["5. Nginx xử lý thế nào khi người dùng tải file Excel 10.000 dòng?", "frontend/nginx.conf (Dòng 9)", "Cấu hình client_max_body_size 50M (mặc định chỉ 1MB). Đồng bộ mức 50MB với Spring Boot để không bị chặn lỗi 413 Payload Too Large."],
            ["6. Làm sao để log container không làm đầy dung lượng ổ cứng VPS?", "docker-compose.yml (Dòng 1-5)", "Cấu hình driver json-file với max-size: 10m và max-file: 5. Khóa cứng log tối đa 50MB và tự xoay vòng ghi đè."],
            ["7. Cơ chế Zero-Downtime trong deploy.sh hoạt động ra sao?", "scripts/deploy.sh (Dòng 53-85)", "Chạy Backend mới trước, thăm dò API /health đến khi trả về HTTP 200 thì mới bật Frontend. Người dùng không bao giờ gặp lỗi 502 Bad Gateway."],
            ["8. Sao lưu database MySQL bằng mysqldump có làm đơ quầy bán hàng không?", "scripts/backup_db.sh (Dòng 29)", "Không. Nhờ có cờ --single-transaction, MySQL tạo snapshot nhất quán mà không khóa bảng (no lock), quầy POS vẫn bán hàng và xuất hóa đơn bình thường."]
        ],
        col_widths=[Inches(2.2), Inches(1.8), Inches(2.8)]
    )

    out_path = "docs/architecture/devops_files_explained.docx"
    doc.save(out_path)
    print(f"DevOps Files Explained DOCX created successfully at: {out_path}")

if __name__ == "__main__":
    create_docx()
