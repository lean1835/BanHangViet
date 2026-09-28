import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs("docs/architecture", exist_ok=True)
plt.rcParams["font.sans-serif"] = ["Segoe UI", "Arial", "DejaVu Sans"]

def draw_shadowed_box(ax, x, y, w, h, bg_color, border_color, border_width=1.5, radius=0.02):
    shadow = patches.FancyBboxPatch(
        (x + 0.004, y - 0.006), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor="#0F172A", alpha=0.07, edgecolor="none"
    )
    ax.add_patch(shadow)
    box = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor=bg_color, edgecolor=border_color, linewidth=border_width
    )
    ax.add_patch(box)
    return box

def create_components_diagram():
    fig, ax = plt.subplots(figsize=(16, 8.5), dpi=300)
    ax.set_xlim(0, 1.6)
    ax.set_ylim(0, 0.85)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")

    # Header
    ax.text(0.8, 0.81, "SƠ ĐỒ BỘ BA HẠ TẦNG VẬN HÀNH: DOCKER, DEPLOY.SH VÀ BACKUP_DB.SH",
            ha="center", va="center", fontsize=15, weight="bold", color="#1E3A8A")
    ax.text(0.8, 0.775, "Giải thích thông dụng: Đóng gói thùng hàng -> Điều phối mạng -> Lắp đặt không gián đoạn -> Bảo hiểm an toàn dữ liệu",
            ha="center", va="center", fontsize=9.5, color="#64748B")

    # Column 1: Dockerization (BE + FE Dockerfiles)
    draw_shadowed_box(ax, 0.04, 0.12, 0.36, 0.60, "#FFFFFF", "#3B82F6", border_width=2, radius=0.02)
    ax.text(0.22, 0.68, "BỘ DOCKERFILE ĐA TẦNG\n(backend/ & frontend/)", ha="center", va="center", fontsize=10.5, weight="bold", color="#1D4ED8")

    # Sub BE Dockerfile
    draw_shadowed_box(ax, 0.06, 0.41, 0.32, 0.21, "#EFF6FF", "#BFDBFE", border_width=1.2, radius=0.015)
    ax.text(0.08, 0.58, "1. backend/Dockerfile (Spring Boot):", fontsize=8.5, weight="bold", color="#1E40AF")
    ax.text(0.08, 0.54, "- Stage 1: maven:3.9 -> Cache pom.xml", fontsize=7.5, color="#1D4ED8")
    ax.text(0.08, 0.50, "- Stage 2: temurin:17-jre siêu nhẹ (~220MB)", fontsize=7.5, color="#334155")
    ax.text(0.08, 0.46, "- Non-root: USER spring:spring (UID 1001)", fontsize=7.5, weight="bold", color="#0F172A")
    ax.text(0.08, 0.43, "- Cấu hình: -XX:+UseG1GC -XX:MaxRAMPercentage=75", fontsize=7.2, color="#475569")

    # Sub FE Dockerfile + Nginx
    draw_shadowed_box(ax, 0.06, 0.16, 0.32, 0.21, "#F0FDF4", "#BBF7D0", border_width=1.2, radius=0.015)
    ax.text(0.08, 0.33, "2. frontend/Dockerfile & nginx.conf:", fontsize=8.5, weight="bold", color="#166534")
    ax.text(0.08, 0.29, "- Stage 1: node:22-alpine -> npm run build", fontsize=7.5, color="#15803D")
    ax.text(0.08, 0.25, "- Stage 2: nginx:alpine (~32MB)", fontsize=7.5, color="#334155")
    ax.text(0.08, 0.21, "- Reverse Proxy: /api/ -> backend:8080 (Hết CORS)", fontsize=7.5, weight="bold", color="#0F172A")
    ax.text(0.08, 0.18, "- client_max_body_size 50M: Hết lỗi 413 upload", fontsize=7.2, color="#475569")

    # Arrow 1 -> 2
    ax.annotate("", xy=(0.44, 0.42), xytext=(0.40, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#2563EB", lw=2.5, mutation_scale=15))

    # Column 2: Docker Compose Orchestration
    draw_shadowed_box(ax, 0.44, 0.12, 0.36, 0.60, "#FFFFFF", "#6366F1", border_width=2, radius=0.02)
    ax.text(0.62, 0.68, "ĐIỀU PHỐI DOCKER COMPOSE\n(docker-compose.yml)", ha="center", va="center", fontsize=10.5, weight="bold", color="#4338CA")

    dc_items = [
        ("Mạng cô lập shared_network", "BE và DB trao đổi qua DNS nội bộ (banhangviet-db:3306), CSDL không mở port ra Internet"),
        ("Log Rotation (json-file)", "Giới hạn max-size: 10m, max-file: 5. Khóa chặt log tối đa 50MB, chống tràn ổ cứng VPS"),
        ("Healthcheck tích hợp", "Kiểm tra curl /api/v1/sync/health mỗi 10s, timeout 5s, start_period 180s cho Spring Boot"),
        ("Bảo mật & Volume bền vững", "no-new-privileges:true, gắn volume /etc/letsencrypt (SSL) và ./backups an toàn")
    ]
    for i, (title, desc) in enumerate(dc_items):
        y_pos = 0.55 - i * 0.115
        draw_shadowed_box(ax, 0.46, y_pos, 0.32, 0.09, "#EEF2FF", "#C7D2FE", border_width=1, radius=0.012)
        ax.text(0.475, y_pos + 0.058, title, fontsize=8.0, weight="bold", color="#3730A3")
        ax.text(0.475, y_pos + 0.025, desc, fontsize=7.2, color="#334155")

    # Arrow 2 -> 3
    ax.annotate("", xy=(0.84, 0.42), xytext=(0.80, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#4F46E5", lw=2.5, mutation_scale=15))

    # Column 3: Deploy & Backup Scripts
    draw_shadowed_box(ax, 0.84, 0.12, 0.72, 0.60, "#FFFFFF", "#059669", border_width=2, radius=0.02)
    ax.text(1.20, 0.68, "BỘ KỊCH BẢN VẬN HÀNH THỰC THI TRÊN VPS (scripts/)", ha="center", va="center", fontsize=10.5, weight="bold", color="#065F46")

    # Sub deploy.sh
    draw_shadowed_box(ax, 0.86, 0.39, 0.68, 0.23, "#ECFDF5", "#A7F3D0", border_width=1.2, radius=0.015)
    ax.text(0.88, 0.58, "1. Kịch bản Triển khai Tự động Zero-Downtime (scripts/deploy.sh):", fontsize=8.5, weight="bold", color="#064E3B")
    ax.text(0.88, 0.54, "- Tải Image mới: docker pull có hàm retry 3 lần, delay 5s chống rớt gói mạng", fontsize=7.5, color="#047857")
    ax.text(0.88, 0.50, "- Bật Backend trước: docker compose up -d banhangviet-be (Frontend cũ vẫn phục vụ khách)", fontsize=7.5, color="#047857")
    ax.text(0.88, 0.46, "- Thăm dò Health Check: Vòng lặp 48 lần (tối đa 4 phút) đến khi Backend báo 'healthy'", fontsize=7.5, weight="bold", color="#064E3B")
    ax.text(0.88, 0.42, "- Bật Frontend sau: Nginx chuyển tiếp ngay sang Backend mới, không 1 giây gián đoạn", fontsize=7.5, color="#047857")

    # Sub backup_db.sh
    draw_shadowed_box(ax, 0.86, 0.15, 0.68, 0.21, "#FEF3C7", "#FDE68A", border_width=1.2, radius=0.015)
    ax.text(0.88, 0.32, "2. Kịch bản Tự động Sao lưu CSDL MySQL (scripts/backup_db.sh):", fontsize=8.5, weight="bold", color="#78350F")
    ax.text(0.88, 0.28, "- Dump an toàn: mysqldump --single-transaction --quick trực tiếp trong banhangviet-db (không khóa bảng)", fontsize=7.5, color="#B45309")
    ax.text(0.88, 0.24, "- Nén mức cao nhất: Đường ống gzip -9 giảm 85% dung lượng lưu trữ", fontsize=7.5, color="#B45309")
    ax.text(0.88, 0.20, "- Xoay vòng 7 ngày: find $BACKUP_DIR -name '*.sql.gz' -mtime +7 -delete tự xóa bản cũ", fontsize=7.5, weight="bold", color="#78350F")
    ax.text(0.88, 0.17, "- Cron Job tự động: Chạy ngầm 02:00 sáng mỗi ngày, không cần người bấm tay", fontsize=7.5, color="#B45309")

    # Bottom ribbon
    draw_shadowed_box(ax, 0.04, 0.02, 1.52, 0.07, "#F1F5F9", "#CBD5E1", border_width=1, radius=0.01)
    ax.text(0.80, 0.055, "BỘ BA HOÀN CHỈNH: Docker đóng gói gọn nhẹ -> Docker Compose điều phối an toàn -> Scripts triển khai & sao lưu tự động.",
            ha="center", va="center", fontsize=8.5, weight="bold", color="#1E293B")

    plt.tight_layout()
    plt.savefig("docs/architecture/devops_components_diagram.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Components diagram created: docs/architecture/devops_components_diagram.png")

if __name__ == "__main__":
    create_components_diagram()
