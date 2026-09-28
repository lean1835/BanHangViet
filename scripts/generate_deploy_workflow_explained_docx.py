import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def create_deploy_workflow_explained_docx():
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

        # Header Row
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

        # Data Rows
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
    run_t = title_p.add_run("Giải Thích Chi Tiết Tệp .github/workflows/deploy.yml")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(18)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(6)
    run_d = desc_p.add_run("Tài liệu hướng dẫn trực quan, diễn giải từng đoạn mã trong tệp cấu hình CI/CD của dự án Bán Hàng Việt bằng ngôn ngữ thông dụng, dễ hiểu nhất, phục vụ báo cáo và vấn đáp bảo vệ đồ án.")
    run_d.font.name = "Segoe UI"
    run_d.font.size = Pt(9.5)
    run_d.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    add_divider()

    # Image
    if os.path.exists("docs/architecture/deploy_workflow_diagram.png"):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture("docs/architecture/deploy_workflow_diagram.png", width=Inches(6.8))
        add_caption("Hình 1: Sơ đồ luồng thực thi bám sát từng đoạn mã trong tệp .github/workflows/deploy.yml")

    # SECTION 1
    add_h1("1. Khối Khởi Đầu & Điều Kiện Kích Hoạt (Dòng 1 đến 24)")
    add_p("Khối này quy định khi nào kịch bản tự động này thức dậy và chuẩn bị sẵn những công cụ gì:", bold_prefix="Mục đích thông dụng:")

    add_callout(
"""name: Production CI/CD Pipeline - lean1835/banhangviet

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
  workflow_dispatch:

concurrency:
  group: production-deploy
  cancel-in-progress: false

permissions:
  contents: read
  packages: write

env:
  REGISTRY: ghcr.io
  BE_IMAGE_BASE: ghcr.io/lean1835/banhangviet-be
  FE_IMAGE_BASE: ghcr.io/lean1835/banhangviet-fe"""
    )
    add_caption("Dòng 1 - 24: Khởi tạo sự kiện, đặt tên biến và cấp quyền")

    add_bullet("on: push / pull_request / branches: ['**']", "Nghĩa là: 'Hễ ai đẩy mã nguồn lên BẤT KỲ NHÁNH NÀO (feature, bugfix, dev, production), hệ thống đều tự động chạy ngay'. Điều này đảm bảo code ở đâu cũng phải được kiểm tra chất lượng.")
    add_bullet("workflow_dispatch:", "Cho phép người quản trị có thể bấm nút 'Run workflow' bằng tay trên web GitHub khi cần triển khai khẩn cấp mà không cần commit code mới.")
    add_bullet("concurrency: group: production-deploy", "Chiếc khóa an toàn: Nếu 2 lập trình viên cùng merge code vào nhánh production cùng một lúc, hệ thống sẽ xếp hàng chờ người thứ nhất deploy xong xuôi mới đến người thứ hai. Tuyệt đối không để 2 phiên bản đè nhau gây hỏng máy chủ.")
    add_bullet("permissions: packages: write", "Cấp quyền cho GitHub Actions được phép 'đẩy hàng vào kho' (ghi Docker Image lên kho chứa ghcr.io).")
    add_bullet("env: REGISTRY & IMAGES", "Khai báo địa chỉ kho hàng (ghcr.io) và tên thương hiệu của hai container Backend và Frontend.")

    add_divider()

    # SECTION 2
    add_h1("2. Giai Đoạn 1: Kiểm Thử Tự Động Song Song (Dòng 26 đến 62)")
    add_p("Ví như 2 nhân viên KCS (kiểm tra chất lượng sản phẩm) cùng làm việc độc lập: một người kiểm tra động cơ (Backend Java), một người kiểm tra vỏ ngoài (Frontend React). Cả 2 đều phải ĐẠT thì mới cho đi tiếp.", bold_prefix="Hình tượng đời sống:")

    add_callout(
"""jobs:
  verify-backend:
    name: Test Backend (Spring Boot Maven)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'
      - name: Run Backend Tests
        run: cd backend && mvn test -B

  verify-frontend:
    name: Lint & Build Frontend (React)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install, Lint & Build Frontend
        run: cd frontend && npm ci && npm run lint && npm run build"""
    )
    add_caption("Dòng 26 - 62: Hai Job kiểm thử tự động chạy song song")

    add_bullet("verify-backend (Test Backend):", "GitHub cấp 1 máy ảo Ubuntu, cài đặt Java 17 Temurin, tải thư viện Maven (có cache nhớ lại để lần sau nhanh hơn), và gõ lệnh: cd backend && mvn test -B. Lệnh này chạy toàn bộ 1406 bài test (tính tiền, hóa đơn, tồn kho, thuế...). Nếu trượt dù chỉ 1 bài, GitHub lập tức báo lỗi đỏ!")
    add_bullet("verify-frontend (Test Frontend):", "GitHub cấp song song 1 máy ảo Ubuntu khác, cài Node.js 22, chạy npm ci để cài đúng thư viện, npm run lint bắt lỗi cú pháp và npm run build kiểm tra biên dịch TypeScript. Nếu code giao diện bị gõ sai kiểu dữ liệu, pipeline dừng ngay lập tức.")

    add_divider()

    # SECTION 3
    add_h1("3. Giai Đoạn 2: Đóng Gói Docker & Đẩy Lên Kho GHCR (Dòng 64 đến 110)")
    add_p("Sau khi sản phẩm đã được kiểm tra chất lượng đạt 100%, bước này sẽ đóng gói toàn bộ ứng dụng vào trong các thùng container Docker tiêu chuẩn và dán nhãn chuyển vào kho GitHub Container Registry.", bold_prefix="Mục đích thông dụng:")

    add_callout(
"""  build-and-push:
    name: Build & Push Images to GHCR
    needs: [verify-backend, verify-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/production' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/setup-buildx-action@v3
      - name: Build & Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ${{ env.BE_IMAGE_BASE }}:${{ github.sha }}
            ${{ env.BE_IMAGE_BASE }}:latest
          cache-from: type=gha,scope=be
          cache-to: type=gha,mode=max,scope=be"""
    )
    add_caption("Dòng 64 - 110: Cổng điều kiện chặt chẽ và đóng gói đa tầng")

    add_bullet("needs: [verify-backend, verify-frontend]:", "Điều kiện tiên quyết: 'Chỉ khi cả 2 bác KCS ở Giai đoạn 1 đóng dấu ĐẠT (PASS 100%), bước này mới được phép khởi động'.")
    add_bullet("if: github.ref == 'refs/heads/production':", "Cổng chốt an toàn: 'Chỉ khi nào code được sáp nhập chính thức vào nhánh production thì mới đóng gói'. Lập trình viên nghịch ngợm ở nhánh dev hay feature thì máy chủ không bao giờ bị đụng tới.")
    add_bullet("Log in GHCR & Buildx:", "Đăng nhập kho lưu trữ bằng mật mã tự sinh GITHUB_TOKEN, kích hoạt công cụ Buildx hỗ trợ bộ nhớ đệm đám mây (GitHub Actions Cache), giúp thời gian đóng gói giảm từ 5 phút xuống còn ~1 phút.")
    add_bullet("Gắn 2 chiếc thẻ nhãn (Tags):", "Mỗi gói hàng được dán 2 nhãn: một nhãn gắn mã commit SHA duy nhất (ví dụ: :5f8ddd75 - phục vụ cho việc quay ngược thời gian Rollback) và một nhãn mang tên :latest (đại diện cho bản mới nhất).")

    add_divider()

    # SECTION 4
    add_h1("4. Giai Đoạn 3: Triển Khai Lên Máy Chủ VPS (Dòng 112 đến 163)")
    add_p("Giai đoạn cuối cùng: GitHub Actions kết nối vào máy chủ đám mây VPS thông qua đường hầm bảo mật SSH, nạp mật khẩu an toàn và kích hoạt kịch bản triển khai tự động không gián đoạn.", bold_prefix="Mục đích thông dụng:")

    add_callout(
"""  deploy-production:
    name: Deploy Both FE & BE to Production VPS
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/production' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    environment:
      name: production
    steps:
      - uses: actions/checkout@v4
      - name: Setup SSH Key
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.PRODUCTION_SSH_KEY }}
      - name: Deploy Monorepo to Production VPS
        env:
          ENV_PRODUCTION: ${{ secrets.ENV_PRODUCTION }}
        run: |
          DEPLOY_PATH="/home/${{ secrets.PRODUCTION_USER }}/banhangviet-deployment"
          BE_TAG="${{ env.BE_IMAGE_BASE }}:${{ github.sha }}"
          FE_TAG="${{ env.FE_IMAGE_BASE }}:${{ github.sha }}"
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.PRODUCTION_IP }} >> ~/.ssh/known_hosts

          # 1. Tạo thư mục trên VPS
          ssh ... "mkdir -p $DEPLOY_PATH/scripts $DEPLOY_PATH/backend"

          # 2. Đồng bộ docker-compose.yml và scripts
          scp ... docker-compose.yml ...:$DEPLOY_PATH/docker-compose.yml
          scp ... scripts/*.sh ...:$DEPLOY_PATH/scripts/

          # 3. Rót bí mật môi trường an toàn qua stdin (không lộ ra shell)
          printf '%s\\n' "$ENV_PRODUCTION" | ssh ... "cat > $DEPLOY_PATH/backend/.env"

          # 4. Kích hoạt kịch bản deploy.sh
          ssh ... "chmod +x $DEPLOY_PATH/scripts/*.sh && ... /bin/sh $DEPLOY_PATH/scripts/deploy.sh" """
    )
    add_caption("Dòng 112 - 163: Luồng kết nối SSH, bảo mật bí mật và kích hoạt deploy.sh trên VPS")

    add_bullet("Setup SSH Key & ssh-keyscan:", "Nạp khóa bí mật PRODUCTION_SSH_KEY để mở cửa VPS từ xa mà không cần gõ mật khẩu. Lệnh ssh-keyscan lưu sẵn vân tay máy chủ vào danh sách tin cậy (known_hosts), giúp kết nối mượt mà không bị treo vì câu hỏi xác nhận Yes/No.")
    add_bullet("Đồng bộ tệp cấu hình qua SCP:", "Chép tệp docker-compose.yml và toàn bộ thư mục scripts/ lên VPS để máy chủ luôn có kịch bản vận hành mới nhất.")
    add_bullet("Kỹ thuật rót Secret qua đường ống stdin:", "Dòng lệnh: printf '%s\\n' \"$ENV_PRODUCTION\" | ssh ... \"cat > .../.env\". Đây là kỹ thuật bảo mật cực cao: nạp trực tiếp toàn bộ mật khẩu CSDL, khóa JWT vào tệp .env trên VPS qua luồng dữ liệu kín, không in ra màn hình và không lưu vào lịch sử lệnh (Bash history).")
    add_bullet("Kích hoạt /bin/sh scripts/deploy.sh:", "Giao toàn quyền cho kịch bản deploy.sh trên VPS tự động: kéo image mới về, bật Backend trước, thăm dò Health Check 4 phút đến khi chạy tốt rồi mới bật Frontend. Người dùng đang mua sắm không hề bị gián đoạn hay thấy màn hình trắng (Zero Downtime).")

    add_divider()

    # SECTION 5: SUMMARY TABLE FOR DEFENSE
    add_h1("5. Bảng Tóm Tắt 5 Câu Hỏi Thầy Cô Thường Hỏi Về Tệp Này")
    add_p("Bảng tổng hợp câu hỏi và câu trả lời ngắn gọn, trực diện phục vụ vấn đáp bảo vệ đồ án:", bold_prefix="Cẩm nang vấn đáp:")

    add_styled_table(
        ["Câu hỏi của Giảng viên / Hội đồng", "Vị trí trong tệp deploy.yml", "Câu trả lời ngắn gọn & Thuyết phục"],
        [
            ["1. Tại sao lại chia thành 3 giai đoạn (Stages) mà không chạy chung?", "needs: [verify-backend, verify-frontend] (Dòng 68)", "Để tiết kiệm thời gian và tài nguyên: Nếu code bị lỗi test ở Stage 1 thì dừng ngay lập tức, không mất công build Docker và không bao giờ đưa code lỗi lên máy chủ."],
            ["2. Làm sao biết code ở nhánh khác không vô tình làm hỏng máy chủ Production?", "if: github.ref == 'refs/heads/production' (Dòng 70, 118)", "Hệ thống có cổng chốt if: chỉ duy nhất nhánh production mới kích hoạt Stage 2 và 3. Các nhánh khác chỉ được chạy Stage 1 để kiểm tra."],
            ["3. Mật khẩu database và khóa JWT có bị lộ trên GitHub không?", "secrets: ${{ secrets.ENV_PRODUCTION }} (Dòng 132, 149)", "Không. Toàn bộ thông tin nhạy cảm nằm trong GitHub Secrets được mã hóa AES-256 và truyền thẳng qua đường ống stdin vào VPS, không lưu trong mã nguồn Git."],
            ["4. Khi deploy thì người dùng có bị gián đoạn (Downtime) không?", "Dòng 160 gọi scripts/deploy.sh", "Không. Kịch bản chạy Backend trước, thăm dò API /health cho đến khi hoạt động tốt mới chuyển đổi Frontend, đạt Zero-Downtime hoàn toàn."],
            ["5. Nhãn commit sha (:tag) trong Docker dùng để làm gì?", "tags: ${{ env.BE_IMAGE_BASE }}:${{ github.sha }} (Dòng 93, 106)", "Mỗi bản build gắn liền với 1 mã commit duy nhất. Nếu bản cập nhật mới bị lỗi nghiệp vụ, có thể dùng mã này để Rollback quay về bản cũ chỉ trong 30 giây."]
        ],
        col_widths=[Inches(2.2), Inches(1.8), Inches(2.8)]
    )

    out_path = "docs/architecture/deploy_workflow_explained.docx"
    doc.save(out_path)
    print(f"Deploy Workflow Explained DOCX created successfully at: {out_path}")

if __name__ == "__main__":
    create_deploy_workflow_explained_docx()
