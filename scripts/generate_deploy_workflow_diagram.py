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

def create_deploy_workflow_diagram():
    fig, ax = plt.subplots(figsize=(16, 8.5), dpi=300)
    ax.set_xlim(0, 1.6)
    ax.set_ylim(0, 0.85)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")

    # Header
    ax.text(0.8, 0.81, "SƠ ĐỒ BÁM SÁT TỆP .github/workflows/deploy.yml",
            ha="center", va="center", fontsize=15, weight="bold", color="#1E3A8A")
    ax.text(0.8, 0.775, "Giải thích thông dụng: Kích hoạt -> Kiểm tra chất lượng -> Đóng gói vào thùng -> Chở hàng lên máy chủ VPS",
            ha="center", va="center", fontsize=9.5, color="#64748B")

    # Block 1: Trigger & Rules (Lines 1 - 24)
    draw_shadowed_box(ax, 0.04, 0.12, 0.26, 0.60, "#FFFFFF", "#3B82F6", border_width=2, radius=0.02)
    ax.text(0.17, 0.68, "KHỐI 1: ĐIỀU KIỆN KÍCH HOẠT\n(Lines 1 - 24)", ha="center", va="center", fontsize=10.5, weight="bold", color="#1D4ED8")
    
    k1_items = [
        ("on: push & pull_request", "Tự động chạy khi dev push code vào bất kỳ nhánh nào (**)"),
        ("concurrency: production-deploy", "Khóa đơn luồng: Chống 2 người cùng deploy đè nhau"),
        ("permissions: packages:write", "Cấp quyền ghi Docker Image lên kho GitHub GHCR"),
        ("env: REGISTRY & IMAGES", "Khai báo địa chỉ kho ghcr.io và tên image BE/FE")
    ]
    for i, (title, desc) in enumerate(k1_items):
        y_pos = 0.55 - i * 0.115
        draw_shadowed_box(ax, 0.055, y_pos, 0.23, 0.09, "#EFF6FF", "#BFDBFE", border_width=1, radius=0.012)
        ax.text(0.07, y_pos + 0.058, title, fontsize=8.0, weight="bold", color="#1E40AF")
        ax.text(0.07, y_pos + 0.025, desc, fontsize=7.2, color="#334155")

    # Arrow 1 -> 2
    ax.annotate("", xy=(0.34, 0.42), xytext=(0.30, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#2563EB", lw=2.5, mutation_scale=15))

    # Block 2: Stage 1 Verify (Lines 26 - 62)
    draw_shadowed_box(ax, 0.34, 0.12, 0.35, 0.60, "#FFFFFF", "#0284C7", border_width=2, radius=0.02)
    ax.text(0.515, 0.68, "STAGE 1: KIỂM THỬ SONG SONG\n(Lines 26 - 62)", ha="center", va="center", fontsize=10.5, weight="bold", color="#0369A1")

    # Sub BE
    draw_shadowed_box(ax, 0.36, 0.41, 0.31, 0.21, "#F0F9FF", "#BAE6FD", border_width=1.2, radius=0.015)
    ax.text(0.38, 0.58, "Job 1: verify-backend", fontsize=8.5, weight="bold", color="#075985")
    ax.text(0.38, 0.54, "- Máy ảo: ubuntu-latest", fontsize=7.5, color="#0284C7")
    ax.text(0.38, 0.50, "- Cài Java 17 (Temurin) + Cache Maven", fontsize=7.5, color="#334155")
    ax.text(0.38, 0.46, "- Lệnh: cd backend && mvn test -B", fontsize=7.5, weight="bold", color="#0F172A")
    ax.text(0.38, 0.43, "- Mục đích: Chạy 1406 tests, kiểm tra DB", fontsize=7.2, color="#475569")

    # Sub FE
    draw_shadowed_box(ax, 0.36, 0.16, 0.31, 0.21, "#F8FAFC", "#E2E8F0", border_width=1.2, radius=0.015)
    ax.text(0.38, 0.33, "Job 2: verify-frontend", fontsize=8.5, weight="bold", color="#1E293B")
    ax.text(0.38, 0.29, "- Máy ảo: ubuntu-latest (chạy song song)", fontsize=7.5, color="#475569")
    ax.text(0.38, 0.25, "- Cài Node.js 22 + Cache npm", fontsize=7.5, color="#334155")
    ax.text(0.38, 0.21, "- Lệnh: npm ci && lint && build", fontsize=7.5, weight="bold", color="#0F172A")
    ax.text(0.38, 0.18, "- Mục đích: 522 tests Vitest, check lỗi TS", fontsize=7.2, color="#475569")

    # Decision Gate
    ax.annotate("", xy=(0.73, 0.42), xytext=(0.69, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#0284C7", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 0.73, 0.30, 0.14, 0.24, "#FEF3C7", "#D97706", border_width=1.5, radius=0.015)
    ax.text(0.80, 0.49, "ĐIỀU KIỆN:", ha="center", fontsize=8.5, weight="bold", color="#92400E")
    ax.text(0.80, 0.44, "- Cả 2 Job ĐẠT?", ha="center", fontsize=7.8, weight="bold", color="#78350F")
    ax.text(0.80, 0.39, "- Nhánh production?", ha="center", fontsize=7.8, weight="bold", color="#78350F")
    ax.text(0.80, 0.33, "[X] Sai: DỪNG LẠI\n[OK] Đúng: ĐÓNG GÓI", ha="center", fontsize=7.2, color="#B45309")

    # Block 3: Stage 2 Build & Push (Lines 64 - 110)
    ax.annotate("", xy=(0.91, 0.42), xytext=(0.87, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#10B981", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 0.91, 0.12, 0.31, 0.60, "#FFFFFF", "#6366F1", border_width=2, radius=0.02)
    ax.text(1.065, 0.68, "STAGE 2: BUILD & PUSH DOCKER\n(Lines 64 - 110)", ha="center", va="center", fontsize=10.5, weight="bold", color="#4338CA")

    s2_items = [
        ("docker/login-action", "Đăng nhập kho GHCR bằng GITHUB_TOKEN"),
        ("docker/setup-buildx", "Kích hoạt Buildx hỗ trợ cache nhiều lớp"),
        ("Build & Push Backend", "Đóng gói backend/Dockerfile -> đẩy ghcr.io: banhangviet-be:<sha> và :latest"),
        ("Build & Push Frontend", "Đóng gói frontend/Dockerfile -> đẩy ghcr.io: banhangviet-fe:<sha> và :latest")
    ]
    for i, (title, desc) in enumerate(s2_items):
        y_pos = 0.55 - i * 0.115
        draw_shadowed_box(ax, 0.93, y_pos, 0.27, 0.09, "#EEF2FF", "#C7D2FE", border_width=1, radius=0.012)
        ax.text(0.945, y_pos + 0.058, title, fontsize=8.0, weight="bold", color="#3730A3")
        ax.text(0.945, y_pos + 0.025, desc, fontsize=7.2, color="#4B5563")

    # Block 4: Stage 3 SSH Deploy (Lines 112 - 163)
    ax.annotate("", xy=(1.26, 0.42), xytext=(1.22, 0.42),
                arrowprops=dict(arrowstyle="-|>", color="#6366F1", lw=2.5, mutation_scale=15))
    draw_shadowed_box(ax, 1.26, 0.12, 0.30, 0.60, "#FFFFFF", "#059669", border_width=2, radius=0.02)
    ax.text(1.41, 0.68, "STAGE 3: TRIỂN KHAI LÊN VPS\n(Lines 112 - 163)", ha="center", va="center", fontsize=10.5, weight="bold", color="#065F46")

    s3_items = [
        ("ssh-agent & Private Key", "Nạp PRODUCTION_SSH_KEY kết nối VPS"),
        ("ssh-keyscan", "Lưu vân tay máy chủ vào known_hosts"),
        ("scp file cấu hình", "Chép docker-compose.yml và scripts/*.sh"),
        ("cat > backend/.env", "Rót biến bí mật an toàn qua đường ống stdin"),
        ("Chạy deploy.sh", "Ra lệnh VPS chạy Re-deploy Zero-Downtime")
    ]
    for i, (title, desc) in enumerate(s3_items):
        y_pos = 0.55 - i * 0.095
        draw_shadowed_box(ax, 1.28, y_pos, 0.26, 0.075, "#ECFDF5", "#A7F3D0", border_width=1, radius=0.012)
        ax.text(1.295, y_pos + 0.048, title, fontsize=8.0, weight="bold", color="#064E3B")
        ax.text(1.295, y_pos + 0.020, desc, fontsize=7.2, color="#374151")

    # Bottom summary ribbon
    draw_shadowed_box(ax, 0.04, 0.02, 1.52, 0.07, "#F1F5F9", "#CBD5E1", border_width=1, radius=0.01)
    ax.text(0.80, 0.055, "Ý NGHĨA THỰC TIỄN: Quá trình tự động diễn ra trong 2-3 phút, lập trình viên chỉ cần 'git push', không cần thao tác tay trên server.",
            ha="center", va="center", fontsize=8.5, weight="bold", color="#1E293B")

    plt.tight_layout()
    plt.savefig("docs/architecture/deploy_workflow_diagram.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Workflow diagram created: docs/architecture/deploy_workflow_diagram.png")

if __name__ == "__main__":
    create_deploy_workflow_diagram()
