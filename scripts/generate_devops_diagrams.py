import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as patheffects
import os

os.makedirs("docs/architecture", exist_ok=True)

plt.rcParams["font.sans-serif"] = ["Segoe UI", "Arial", "DejaVu Sans"]
plt.rcParams["axes.edgecolor"] = "#CBD5E1"

def draw_shadowed_box(ax, x, y, w, h, bg_color, border_color, border_width=1.5, radius=0.03):
    # Shadow
    shadow = patches.FancyBboxPatch(
        (x + 0.005, y - 0.008), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor="#0F172A", alpha=0.08, edgecolor="none"
    )
    ax.add_patch(shadow)
    # Main Box
    box = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor=bg_color, edgecolor=border_color, linewidth=border_width
    )
    ax.add_patch(box)
    return box

# ==============================================================================
# DIAGRAM 1: Sơ đồ Kiến trúc DevOps & Hạ tầng Tổng thể
# ==============================================================================
def create_diagram_1():
    fig, ax = plt.subplots(figsize=(16, 8.5), dpi=300)
    ax.set_xlim(0, 1.6)
    ax.set_ylim(0, 0.85)
    ax.axis("off")

    # Background canvas
    fig.patch.set_facecolor("#F8FAFC")

    # Title
    ax.text(0.8, 0.81, "KIẾN TRÚC DEVOPS & HẠ TẦNG TRIỂN KHAI BÁN HÀNG VIỆT MONOREPO",
            ha="center", va="center", fontsize=15, weight="bold", color="#1E3A8A")
    ax.text(0.8, 0.775, "Mô hình khép kín: Developer -> GitHub Actions CI/CD -> GHCR -> Production VPS (Docker Isolated)",
            ha="center", va="center", fontsize=9.5, color="#64748B")

    # Column 1: Developer & Local Env
    draw_shadowed_box(ax, 0.04, 0.12, 0.28, 0.60, "#FFFFFF", "#3B82F6", border_width=2, radius=0.02)
    ax.text(0.18, 0.68, "DEVELOPER & WORKSPACE", ha="center", va="center", fontsize=11, weight="bold", color="#1D4ED8")
    
    dev_items = [
        ("Git Version Control", "Quản lý mã nguồn Monorepo BE & FE"),
        ("Local Development", "Spring Boot (Port 8080) & Vite (Port 3000)"),
        ("Feature Branching", "Phát triển theo nhánh tính năng / hotfix"),
        ("Clean Code Standards", "Robert C. Martin Clean Code & Sonar"),
        ("Git Commit & Push", "Trigger tự động GitHub Actions Pipeline")
    ]
    for i, (title, desc) in enumerate(dev_items):
        y_pos = 0.58 - i * 0.095
        draw_shadowed_box(ax, 0.06, y_pos, 0.24, 0.075, "#F1F5F9", "#CBD5E1", border_width=1, radius=0.015)
        ax.text(0.08, y_pos + 0.048, f"- {title}", fontsize=8.5, weight="bold", color="#0F172A")
        ax.text(0.08, y_pos + 0.022, desc, fontsize=7.5, color="#475569")

    # Arrow 1 -> 2
    ax.annotate("", xy=(0.36, 0.42), xytext=(0.32, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#2563EB", lw=2.5, mutation_scale=15))
    ax.text(0.34, 0.445, "git push", ha="center", fontsize=8, weight="bold", color="#2563EB")

    # Column 2: GitHub CI/CD & Registry
    draw_shadowed_box(ax, 0.36, 0.12, 0.38, 0.60, "#FFFFFF", "#6366F1", border_width=2, radius=0.02)
    ax.text(0.55, 0.68, "GITHUB ACTIONS & GHCR", ha="center", va="center", fontsize=11, weight="bold", color="#4338CA")

    # Sub-box CI
    draw_shadowed_box(ax, 0.38, 0.42, 0.34, 0.22, "#EEF2FF", "#A5B4FC", border_width=1.5, radius=0.015)
    ax.text(0.40, 0.605, "1. CI Verify (Mọi Nhánh):", fontsize=9, weight="bold", color="#312E81")
    ax.text(0.41, 0.565, "- Backend: Maven Test (1406 Unit & Integration Tests)", fontsize=7.5, color="#3730A3")
    ax.text(0.41, 0.530, "- Frontend: npm ci -> ESLint -> npm run build", fontsize=7.5, color="#3730A3")
    ax.text(0.41, 0.495, "- Concurrency Group: Chặn xung đột triển khai song song", fontsize=7.5, color="#3730A3")
    ax.text(0.41, 0.460, "- Secrets: PRODUCTION_SSH_KEY, ENV_PRODUCTION", fontsize=7.5, color="#3730A3")

    # Sub-box CD / GHCR
    draw_shadowed_box(ax, 0.38, 0.15, 0.34, 0.23, "#F5F3FF", "#C4B5FD", border_width=1.5, radius=0.015)
    ax.text(0.40, 0.345, "2. Container Registry (ghcr.io):", fontsize=9, weight="bold", color="#4C1D95")
    ax.text(0.41, 0.305, "- Docker Buildx + GHA Layer Caching siêu tốc", fontsize=7.5, color="#5B21B6")
    ax.text(0.41, 0.270, "- Multi-stage Build: BE (Temurin 17 JRE), FE (Nginx)", fontsize=7.5, color="#5B21B6")
    ax.text(0.41, 0.235, "- Image BE: ghcr.io/lean1835/banhangviet-be:<sha>", fontsize=7.5, color="#5B21B6")
    ax.text(0.41, 0.200, "- Image FE: ghcr.io/lean1835/banhangviet-fe:<sha>", fontsize=7.5, color="#5B21B6")
    ax.text(0.41, 0.165, "- Non-root User & Security Hardening", fontsize=7.5, color="#5B21B6")

    # Arrow 2 -> 3
    ax.annotate("", xy=(0.78, 0.42), xytext=(0.74, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#4F46E5", lw=2.5, mutation_scale=15))
    ax.text(0.76, 0.445, "SSH Deploy", ha="center", fontsize=8, weight="bold", color="#4F46E5")

    # Column 3: Production VPS Server
    draw_shadowed_box(ax, 0.78, 0.06, 0.78, 0.66, "#FFFFFF", "#059669", border_width=2, radius=0.02)
    ax.text(1.17, 0.68, "PRODUCTION HOST (UBUNTU VPS & DOCKER ENGINE)", ha="center", va="center", fontsize=11, weight="bold", color="#065F46")

    # Service 1: Nginx & Frontend
    draw_shadowed_box(ax, 0.81, 0.47, 0.35, 0.17, "#ECFDF5", "#6EE7B7", border_width=1.5, radius=0.015)
    ax.text(0.83, 0.605, "Frontend & Nginx Proxy (Port 80/443)", fontsize=8.5, weight="bold", color="#064E3B")
    ax.text(0.84, 0.570, "- Container: banhangviet-fe (Alpine Linux)", fontsize=7.5, color="#047857")
    ax.text(0.84, 0.540, "- SSL Let's Encrypt Auto Renewal (/etc/letsencrypt)", fontsize=7.5, color="#047857")
    ax.text(0.84, 0.510, "- Reverse Proxy -> http://banhangviet-be:8080", fontsize=7.5, color="#047857")
    ax.text(0.84, 0.480, "- client_max_body_size 50M (Chống lỗi 413 upload)", fontsize=7.5, color="#047857")

    # Service 2: Spring Boot Backend
    draw_shadowed_box(ax, 1.18, 0.47, 0.35, 0.17, "#F0FDF4", "#86EFAC", border_width=1.5, radius=0.015)
    ax.text(1.20, 0.605, "Backend API (Spring Boot 3.3.4)", fontsize=8.5, weight="bold", color="#14532D")
    ax.text(1.21, 0.570, "- Container: banhangviet-be (Temurin 17 JRE)", fontsize=7.5, color="#15803D")
    ax.text(1.21, 0.540, "- Healthcheck: GET /api/v1/sync/health (HTTP 200)", fontsize=7.5, color="#15803D")
    ax.text(1.21, 0.510, "- Multi-tenancy Context & JWT Filter Protection", fontsize=7.5, color="#15803D")
    ax.text(1.21, 0.480, "- Log Rotation: max-size 10m, max-file 3 (JSON)", fontsize=7.5, color="#15803D")

    # Service 3: MySQL Database
    draw_shadowed_box(ax, 0.81, 0.26, 0.35, 0.17, "#FEF3C7", "#FCD34D", border_width=1.5, radius=0.015)
    ax.text(0.83, 0.395, "MySQL Database (banhangviet-db)", fontsize=8.5, weight="bold", color="#78350F")
    ax.text(0.84, 0.360, "- Container: banhangviet-db (MySQL 8.0)", fontsize=7.5, color="#B45309")
    ax.text(0.84, 0.330, "- Internal Network Only: Không mở port ra ngoài", fontsize=7.5, color="#B45309")
    ax.text(0.84, 0.300, "- Volume Bền vững: /var/lib/mysql", fontsize=7.5, color="#B45309")
    ax.text(0.84, 0.270, "- Flyway Migrations: Tự động chạy khi BE khởi động", fontsize=7.5, color="#B45309")

    # Service 4: DevOps Scripts & Automation
    draw_shadowed_box(ax, 1.18, 0.26, 0.35, 0.17, "#F3F4F6", "#D1D5DB", border_width=1.5, radius=0.015)
    ax.text(1.20, 0.395, "Scripts Vận Hành Tự Động (/scripts)", fontsize=8.5, weight="bold", color="#1F2937")
    ax.text(1.21, 0.360, "- deploy.sh: Rolling Zero-Downtime Deployment", fontsize=7.5, color="#374151")
    ax.text(1.21, 0.330, "- backup_db.sh: mysqldump nén gzip-9 tự động", fontsize=7.5, color="#374151")
    ax.text(1.21, 0.300, "- Cron Job: Tự động dọn bản sao lưu > 7 ngày", fontsize=7.5, color="#374151")
    ax.text(1.21, 0.270, "- Docker Prune: Tự giải phóng container/image rác", fontsize=7.5, color="#374151")

    # Isolated Network Box at bottom
    draw_shadowed_box(ax, 0.81, 0.08, 0.72, 0.14, "#ECFEFF", "#A5F3FC", border_width=1, radius=0.01)
    ax.text(1.17, 0.180, "MẠNG CÔ LẬP NỘI BỘ (DOCKER SHARED NETWORK: shared_network)", ha="center", fontsize=8.5, weight="bold", color="#0E7490")
    ax.text(1.17, 0.145, "Giao tiếp nội bộ giữa các container qua DNS tĩnh: FE -> BE (http://banhangviet-be:8080) -> DB (jdbc:mysql://banhangviet-db:3306/ban_hang_viet)", ha="center", fontsize=7.5, color="#155E75")
    ax.text(1.17, 0.110, "Bảo mật: MySQL không map port ra host VPS. Chỉ có Nginx mở port 80 & 443 ra Internet công cộng.", ha="center", fontsize=7.5, color="#0E7490")

    plt.tight_layout()
    plt.savefig("docs/architecture/devops_system_architecture.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Diagram 1 created: docs/architecture/devops_system_architecture.png")

# ==============================================================================
# DIAGRAM 2: Luồng CI/CD Pipeline 3 Giai Đoạn & Quality Gates
# ==============================================================================
def create_diagram_2():
    fig, ax = plt.subplots(figsize=(16, 7.5), dpi=300)
    ax.set_xlim(0, 1.6)
    ax.set_ylim(0, 0.75)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")

    ax.text(0.8, 0.71, "LUỒNG CI/CD PIPELINE 3 GIAI ĐOẠN & CỔNG KIỂM SOÁT CHẤT LƯỢNG",
            ha="center", va="center", fontsize=15, weight="bold", color="#1E3A8A")
    ax.text(0.8, 0.675, "Đảm bảo mã nguồn được kiểm thử 100% trước khi đóng gói và chỉ nhánh production mới được kích hoạt lên VPS",
            ha="center", va="center", fontsize=9.5, color="#64748B")

    # Box Stage 1: Continuous Integration
    draw_shadowed_box(ax, 0.05, 0.12, 0.44, 0.50, "#FFFFFF", "#3B82F6", border_width=2, radius=0.02)
    ax.text(0.27, 0.58, "GIAI ĐOẠN 1: VERIFY SONG SONG", ha="center", fontsize=11, weight="bold", color="#1D4ED8")
    ax.text(0.27, 0.545, "Kích hoạt trên 100% các nhánh & PR (branches: ['**'])", ha="center", fontsize=8, color="#475569")

    draw_shadowed_box(ax, 0.07, 0.34, 0.40, 0.16, "#EFF6FF", "#BFDBFE", border_width=1.2, radius=0.015)
    ax.text(0.09, 0.46, "Job 1: Verify Backend Spring Boot", fontsize=8.5, weight="bold", color="#1E40AF")
    ax.text(0.09, 0.42, "- cd backend && mvn test -B", fontsize=8, color="#1D4ED8")
    ax.text(0.09, 0.38, "- Chạy trọn vẹn 1406 tests (Unit, Service, Controller)", fontsize=7.5, color="#475569")
    ax.text(0.09, 0.35, "- Kiểm tra Flyway migration scripts & Entity schema", fontsize=7.5, color="#475569")

    draw_shadowed_box(ax, 0.07, 0.15, 0.40, 0.16, "#F0FDF4", "#BBF7D0", border_width=1.2, radius=0.015)
    ax.text(0.09, 0.27, "Job 2: Verify Frontend React Vite", fontsize=8.5, weight="bold", color="#166534")
    ax.text(0.09, 0.23, "- cd frontend && npm ci && npm run lint", fontsize=8, color="#15803D")
    ax.text(0.09, 0.19, "- Vitest Test Suite: 522/522 tests passed", fontsize=7.5, color="#475569")
    ax.text(0.09, 0.16, "- npm run build: Biên dịch kiểm tra TypeScript 100%", fontsize=7.5, color="#475569")

    # Gate 1: Check pass
    ax.annotate("", xy=(0.54, 0.37), xytext=(0.49, 0.37),
                arrowprops=dict(arrowstyle="-|>", color="#2563EB", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 0.54, 0.28, 0.14, 0.18, "#FEF3C7", "#F59E0B", border_width=1.5, radius=0.015)
    ax.text(0.61, 0.41, "CỔNG 1:", ha="center", fontsize=8.5, weight="bold", color="#92400E")
    ax.text(0.61, 0.37, "Cả 2 Job\nđều PASS?", ha="center", fontsize=8, weight="bold", color="#78350F")
    ax.text(0.61, 0.31, "[X] Lỗi -> Dừng\n[OK] Đạt -> Đi tiếp", ha="center", fontsize=7.5, color="#B45309")

    # Gate 2: Check branch
    ax.annotate("", xy=(0.73, 0.37), xytext=(0.68, 0.37),
                arrowprops=dict(arrowstyle="-|>", color="#10B981", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 0.73, 0.28, 0.14, 0.18, "#FEF3C7", "#F59E0B", border_width=1.5, radius=0.015)
    ax.text(0.80, 0.41, "CỔNG 2:", ha="center", fontsize=8.5, weight="bold", color="#92400E")
    ax.text(0.80, 0.37, "Nhánh là\nproduction?", ha="center", fontsize=8, weight="bold", color="#78350F")
    ax.text(0.80, 0.31, "[X] Khác -> Dừng\n[OK] prod -> Build", ha="center", fontsize=7.5, color="#B45309")

    # Box Stage 2: Build & Push
    ax.annotate("", xy=(0.92, 0.37), xytext=(0.87, 0.37),
                arrowprops=dict(arrowstyle="-|>", color="#10B981", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 0.92, 0.12, 0.31, 0.50, "#FFFFFF", "#6366F1", border_width=2, radius=0.02)
    ax.text(1.075, 0.58, "GIAI ĐOẠN 2: BUILD & PUSH", ha="center", fontsize=11, weight="bold", color="#4338CA")
    ax.text(1.075, 0.545, "Chỉ kích hoạt khi merge vào production", ha="center", fontsize=8, color="#475569")

    draw_shadowed_box(ax, 0.94, 0.34, 0.27, 0.16, "#EEF2FF", "#C7D2FE", border_width=1.2, radius=0.015)
    ax.text(0.96, 0.46, "Docker Buildx Multi-stage", fontsize=8.5, weight="bold", color="#3730A3")
    ax.text(0.96, 0.42, "- Cache GHA: Giảm thời gian build", fontsize=7.5, color="#4338CA")
    ax.text(0.96, 0.39, "- Gắn tag: :<commit-sha> và :latest", fontsize=7.5, color="#4338CA")
    ax.text(0.96, 0.36, "- Kiểm tra lỗ hổng bảo mật", fontsize=7.5, color="#4338CA")

    draw_shadowed_box(ax, 0.94, 0.15, 0.27, 0.16, "#F5F3FF", "#DDD6FE", border_width=1.2, radius=0.015)
    ax.text(0.96, 0.27, "Push GitHub Registry (GHCR)", fontsize=8.5, weight="bold", color="#5B21B6")
    ax.text(0.96, 0.23, "- ghcr.io/lean1835/banhangviet-be", fontsize=7.5, color="#6D28D9")
    ax.text(0.96, 0.20, "- ghcr.io/lean1835/banhangviet-fe", fontsize=7.5, color="#6D28D9")
    ax.text(0.96, 0.17, "- Xác thực qua GITHUB_TOKEN tự động", fontsize=7.5, color="#6D28D9")

    # Box Stage 3: SSH Deploy
    ax.annotate("", xy=(1.28, 0.37), xytext=(1.23, 0.37),
                arrowprops=dict(arrowstyle="-|>", color="#6366F1", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 1.28, 0.12, 0.27, 0.50, "#FFFFFF", "#059669", border_width=2, radius=0.02)
    ax.text(1.415, 0.58, "GIAI ĐOẠN 3: SSH DEPLOY", ha="center", fontsize=11, weight="bold", color="#065F46")
    ax.text(1.415, 0.545, "Triển khai an toàn trên VPS", ha="center", fontsize=8, color="#475569")

    draw_shadowed_box(ax, 1.30, 0.34, 0.23, 0.16, "#ECFDF5", "#A7F3D0", border_width=1.2, radius=0.015)
    ax.text(1.32, 0.46, "Kết nối & Đồng bộ Tệp", fontsize=8.5, weight="bold", color="#064E3B")
    ax.text(1.32, 0.42, "- SSH Agent + PRODUCTION_SSH_KEY", fontsize=7.5, color="#047857")
    ax.text(1.32, 0.39, "- scp docker-compose.yml & scripts/", fontsize=7.5, color="#047857")
    ax.text(1.32, 0.36, "- Truyền bí mật ENV_PRODUCTION an toàn", fontsize=7.5, color="#047857")

    draw_shadowed_box(ax, 1.30, 0.15, 0.23, 0.16, "#F0FDF4", "#BBF7D0", border_width=1.2, radius=0.015)
    ax.text(1.32, 0.27, "Thực thi scripts/deploy.sh", fontsize=8.5, weight="bold", color="#14532D")
    ax.text(1.32, 0.23, "- Pull image mới có retry x3", fontsize=7.5, color="#15803D")
    ax.text(1.32, 0.20, "- Re-deploy BE -> Healthcheck 4m", fontsize=7.5, color="#15803D")
    ax.text(1.32, 0.17, "- Re-deploy FE -> Zero-downtime Live!", fontsize=7.5, color="#15803D")

    plt.tight_layout()
    plt.savefig("docs/architecture/devops_cicd_flow.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Diagram 2 created: docs/architecture/devops_cicd_flow.png")

# ==============================================================================
# DIAGRAM 3: Quy trình Deploy Zero-Downtime & Healthcheck Polling
# ==============================================================================
def create_diagram_3():
    fig, ax = plt.subplots(figsize=(16, 7.0), dpi=300)
    ax.set_xlim(0, 1.6)
    ax.set_ylim(0, 0.70)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")

    ax.text(0.8, 0.66, "QUY TRÌNH TRIỂN KHAI ZERO-DOWNTIME & HEALTHCHECK POLLING",
            ha="center", va="center", fontsize=15, weight="bold", color="#1E3A8A")
    ax.text(0.8, 0.625, "Kịch bản tự động scripts/deploy.sh bảo vệ hệ thống không bao giờ bị gián đoạn hay trả lỗi HTTP 502",
            ha="center", va="center", fontsize=9.5, color="#64748B")

    steps = [
        ("BƯỚC 1", "Tải BE & FE Images", "docker pull với cơ chế\nretry 3 lần nếu rớt mạng", "#EFF6FF", "#3B82F6"),
        ("BƯỚC 2", "Khởi chạy Backend trước", "docker compose up -d\nbanhangviet-be\n(FE cũ vẫn phục vụ khách)", "#EEF2FF", "#6366F1"),
        ("BƯỚC 3", "Thăm dò trạng thái BE", "Vòng lặp curl /health\n5s/lần, tối đa 48 lần (4p)\nKiểm tra DB kết nối & Flyway", "#FEF3C7", "#D97706"),
        ("BƯỚC 4", "Khởi chạy Frontend sau", "docker compose up -d\nbanhangviet-fe\nNginx chuyển traffic sang BE mới", "#ECFDF5", "#059669"),
        ("BƯỚC 5", "Hoàn tất Zero-Downtime", "docker image prune -f\nXóa sạch image cũ không dùng\nGiải phóng dung lượng đĩa", "#F3F4F6", "#4B5563")
    ]

    box_width = 0.24
    box_height = 0.38
    spacing = 0.07
    start_x = 0.05

    for i, (step_num, title, detail, bg, border) in enumerate(steps):
        x = start_x + i * (box_width + spacing)
        draw_shadowed_box(ax, x, 0.12, box_width, box_height, bg, border, border_width=2, radius=0.02)
        
        # Step header
        ax.text(x + box_width/2, 0.45, step_num, ha="center", fontsize=11, weight="bold", color=border)
        ax.text(x + box_width/2, 0.39, title, ha="center", fontsize=9.5, weight="bold", color="#0F172A")
        
        # Detail box
        draw_shadowed_box(ax, x + 0.015, 0.15, box_width - 0.03, 0.19, "#FFFFFF", "#E2E8F0", border_width=1, radius=0.01)
        ax.text(x + box_width/2, 0.24, detail, ha="center", va="center", fontsize=8, color="#334155")

        # Arrow to next step
        if i < len(steps) - 1:
            arrow_x_start = x + box_width
            arrow_x_end = arrow_x_start + spacing
            ax.annotate("", xy=(arrow_x_end, 0.31), xytext=(arrow_x_start, 0.31),
                        arrowprops=dict(arrowstyle="-|>", color="#0284C7", lw=2.5, mutation_scale=15))

    # Error handling branch callout
    draw_shadowed_box(ax, 0.25, 0.01, 1.10, 0.08, "#FEF2F2", "#EF4444", border_width=1.2, radius=0.01)
    ax.text(0.80, 0.05, "CƠ CHẾ BẢO VỆ ROLLBACK: Nếu sau 4 phút Backend vẫn Unhealthy -> In log 100 dòng, dừng ngay (Exit 1). Frontend cũ giữ nguyên hoạt động.",
            ha="center", va="center", fontsize=8, weight="bold", color="#B91C1C")

    plt.tight_layout()
    plt.savefig("docs/architecture/devops_zero_downtime_deploy.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Diagram 3 created: docs/architecture/devops_zero_downtime_deploy.png")

if __name__ == "__main__":
    create_diagram_1()
    create_diagram_2()
    create_diagram_3()
    print("All 3 DevOps diagrams generated successfully!")
