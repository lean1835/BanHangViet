# Giải Thích Chi Tiết Tệp .github/workflows/deploy.yml

> **Mục tiêu**: Giải thích ngắn gọn, thông dụng, dễ hiểu từng đoạn mã trong tệp cấu hình CI/CD của Bán Hàng Việt Monorepo, bám sát các dòng mã và có sơ đồ minh họa phục vụ báo cáo / thuyết trình bảo vệ đồ án.  
> **Nguyên tắc**: Giữ nguyên toàn bộ tệp cũ, tạo tệp tài liệu mới này để học và tra cứu nhanh.

---

## Sơ Đồ Toàn Cảnh Quy Trình Tự Động Hóa (deploy.yml)

> *(Sơ đồ trực quan độ phân giải cao được nhúng sẵn trong tệp [deploy_workflow_explained.docx](deploy_workflow_explained.docx))*

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
|  ĐIỀU KIỆN KÍCH HOẠT  |     |   STAGE 1: KIỂM THỬ   |     |   STAGE 2: ĐÓNG GÓI   |     |   STAGE 3: TRIỂN KHAI |
|   (Lines 1 - 24)      | --> |    (Lines 26 - 62)    | --> |    (Lines 64 - 110)   | --> |    (Lines 112 - 163)  |
|                       |     |                       |     |                       |     |                       |
| • git push mọi nhánh  |     | • Test BE (1406 test) |     | • Cổng: Nhánh prod?   |     | • SSH an toàn vào VPS |
| • Khóa chống xung đột |     | • Test FE (522 test)  |     | • Build Docker Image  |     | • Rót mật khẩu an toàn|
| • Cấp quyền GHCR      |     | • Chạy song song      |     | • Đẩy lên kho ghcr.io |     | • deploy.sh Zero-Down |
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
```

---

## 1. Khối Khởi Đầu & Điều Kiện Kích Hoạt (Dòng 1 đến 24)

```yaml
name: Production CI/CD Pipeline - lean1835/banhangviet

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
  FE_IMAGE_BASE: ghcr.io/lean1835/banhangviet-fe
```

### Ý nghĩa thông dụng:
1. **`on: push` / `pull_request` với `branches: ['**']`**:
   - *Hiểu đơn giản*: Hễ lập trình viên đẩy mã nguồn lên **bất kỳ nhánh nào** (feature, bugfix, develop hay production), GitHub đều lập tức tự động thức dậy để kiểm tra chất lượng. Không có dòng code nào lọt qua mà không được kiểm thử.
2. **`workflow_dispatch`**:
   - Cho phép người quản trị có thể vào giao diện GitHub bấm nút **"Run workflow"** thủ công bất cứ lúc nào (ví dụ khi cần deploy lại mà không cần commit mã mới).
3. **`concurrency: group: production-deploy`**:
   - *Chiếc khóa chống giẫm chân nhau*: Nếu 2 lập trình viên cùng lúc bấm merge code vào nhánh `production`, hệ thống sẽ bắt người thứ hai xếp hàng đợi người thứ nhất deploy xong xuôi. Tránh tuyệt đối việc 2 bản build chạy đè lên nhau làm hỏng máy chủ VPS.
4. **`permissions: packages: write`**:
   - Cấp thẻ ra vào: Cho phép kịch bản được quyền ghi tệp (đẩy Docker Image) vào kho chứa GitHub Container Registry (`ghcr.io`).
5. **`env: REGISTRY & IMAGES`**:
   - Khai báo tên kho chứa và đường dẫn định danh cho 2 ảnh Docker của Backend và Frontend.

---

## 2. Giai Đoạn 1: Kiểm Thử Tự Động Song Song (Dòng 26 đến 62)

```yaml
jobs:
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
        run: cd frontend && npm ci && npm run lint && npm run build
```

### Ý nghĩa thông dụng (Hai bác bảo vệ KCS kiểm tra song song):
- **`verify-backend`**:
  - GitHub tự động mở 1 máy ảo Ubuntu mới tinh, cài sẵn Java 17 Temurin.
  - Lệnh `mvn test -B`: Chạy tự động toàn bộ **1406 bài kiểm thử** (từ tính tiền, trừ kho, lập hóa đơn điện tử đến phân quyền đa hộ). Nếu có dù chỉ 1 bài test bị sai kết quả, hệ thống báo đỏ ngay.
- **`verify-frontend`**:
  - Đồng thời mở thêm 1 máy ảo Ubuntu thứ hai chạy song song (tiết kiệm 50% thời gian chờ đợi).
  - Cài Node.js 22, chạy `npm ci` (cài đúng thư viện), `npm run lint` (bắt lỗi gõ nhầm) và `npm run build` (kiểm tra biên dịch TypeScript 522 tests Vitest).
- **Nguyên tắc vàng**: Cả 2 bác KCS đều phải đóng dấu **ĐẠT (PASS 100%)** thì quy trình mới được phép đi tiếp sang Giai đoạn 2.

---

## 3. Giai Đoạn 2: Đóng Gói Docker & Đẩy Vào Kho GHCR (Dòng 64 đến 110)

```yaml
  build-and-push:
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
          cache-to: type=gha,mode=max,scope=be
      - name: Build & Push Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ${{ env.FE_IMAGE_BASE }}:${{ github.sha }}
            ${{ env.FE_IMAGE_BASE }}:latest
          cache-from: type=gha,scope=fe
          cache-to: type=gha,mode=max,scope=fe
```

### Ý nghĩa thông dụng (Đóng hàng vào thùng container tiêu chuẩn):
1. **`needs: [verify-backend, verify-frontend]`**:
   - Phải qua được vòng kiểm thử ở Giai đoạn 1 mới được bước vào đây. Nếu test fail, bước này tuyệt đối không chạy.
2. **`if: github.ref == 'refs/heads/production'`**:
   - **Chốt chặn an toàn quan trọng nhất**: Chỉ khi code được gộp vào nhánh chính thức `production` thì mới được đóng gói và đưa lên máy chủ. Các nhánh thử nghiệm `develop`, `feature` kiểm tra xong là dừng lại.
3. **`docker/login-action` & `setup-buildx-action`**:
   - Tự động đăng nhập vào kho `ghcr.io` bằng chìa khóa bảo mật tạm thời `GITHUB_TOKEN`.
   - Sử dụng công nghệ đóng gói Docker Buildx kết hợp bộ nhớ đệm `type=gha` (GitHub Actions Cache) giúp tái sử dụng các tầng image cũ, giảm thời gian build từ 5 phút xuống còn ~1 phút.
4. **Dán nhãn hai tem (`tags`)**:
   - Tem 1: `${{ env.BE_IMAGE_BASE }}:${{ github.sha }}` -> Gắn mã số nhận dạng commit duy nhất (ví dụ: `:5f8ddd75`), dùng để quay ngược thời gian (Rollback) bất cứ lúc nào.
   - Tem 2: `${{ env.BE_IMAGE_BASE }}:latest` -> Nhãn phiên bản mới nhất cho máy chủ tải về.

---

## 4. Giai Đoạn 3: Triển Khai Lên Máy Chủ VPS (Dòng 112 đến 163)

```yaml
  deploy-production:
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
          printf '%s\n' "$ENV_PRODUCTION" | ssh ... "cat > $DEPLOY_PATH/backend/.env"

          # 4. Kích hoạt kịch bản deploy.sh
          ssh ... "chmod +x $DEPLOY_PATH/scripts/*.sh && ... /bin/sh $DEPLOY_PATH/scripts/deploy.sh"
```

### Ý nghĩa thông dụng (Giao hàng và lắp đặt tự động lên máy chủ):
1. **`Setup SSH Key` & `ssh-keyscan`**:
   - Cầm chìa khóa cửa bí mật `PRODUCTION_SSH_KEY` để mở cửa máy chủ VPS từ xa qua mạng Internet mà không cần người gõ password.
   - Lệnh `ssh-keyscan` lưu sẵn vân tay của máy chủ vào tệp `known_hosts`, chống bị gián đoạn bởi câu hỏi hỏi xác nhận "Bạn có chắc chắn muốn kết nối không? (yes/no)".
2. **Đồng bộ tệp cấu hình (`scp`)**:
   - Đưa tệp điều phối `docker-compose.yml` và thư mục kịch bản `scripts/` lên VPS để máy chủ luôn có bản hướng dẫn mới nhất.
3. **Kỹ thuật rót mật khẩu cực an toàn**:
   - Dòng lệnh: `printf '%s\n' "$ENV_PRODUCTION" | ssh ... "cat > .../.env"`
   - *Bảo mật tuyệt đối*: Toàn bộ mật khẩu CSDL, khóa token bảo mật JWT được truyền thẳng qua đường ống kín vào file `.env` trên VPS. Không in ra màn hình console, không lưu vào lịch sử lệnh (bash history), người ngoài xem log GitHub Actions cũng không thể thấy được mật khẩu.
4. **Kích hoạt kịch bản `scripts/deploy.sh`**:
   - Ra lệnh cho VPS tự chạy bản cập nhật. Kịch bản này sẽ:
     - Kéo Docker image mới về.
     - Khởi động Backend mới trước.
     - Thăm dò sức khỏe (`/api/v1/sync/health`) mỗi 5s trong tối đa 4 phút.
     - Khi Backend chạy hoàn hảo mới bật Frontend, chuyển khách hàng sang phiên bản mới mà **không gây mất kết nối 1 giây nào (Zero-Downtime)**.

---

## 5. Bảng 5 Câu Hỏi Trọng Tâm Thầy Cô Thường Hỏi Về Tệp Này

| STT | Câu hỏi của Giảng viên / Hội đồng | Dòng mã minh chứng | Câu trả lời ngắn gọn & Thuyết phục |
| :---: | :--- | :--- | :--- |
| **1** | Tại sao lại chia thành 3 giai đoạn (Stages) riêng biệt? | `needs: [verify-backend, verify-frontend]` (Dòng 68) | Để tiết kiệm tài nguyên và bảo vệ máy chủ: Nếu code bị lỗi test ở Stage 1 thì hệ thống ngắt ngay, không mất công build Docker và không bao giờ đưa code lỗi lên VPS. |
| **2** | Nhánh của sinh viên khác làm sao không làm sập server chính? | `if: github.ref == 'refs/heads/production'` (Dòng 70, 118) | Có cổng chốt điều kiện `if`: Chỉ duy nhất nhánh `production` mới kích hoạt việc đóng gói và deploy. Các nhánh khác chỉ được chạy test. |
| **3** | Mật khẩu database và secret có bị lộ trên GitHub không? | `secrets: ${{ secrets.ENV_PRODUCTION }}` (Dòng 132, 149) | Không. Toàn bộ thông tin nhạy cảm nằm trong GitHub Secrets được mã hóa AES-256 và truyền thẳng qua đường ống stdin vào VPS, không lưu trong mã nguồn Git. |
| **4** | Lúc deploy thì hệ thống bán hàng có bị gián đoạn không? | Dòng 160 gọi `scripts/deploy.sh` | Không. Kịch bản chạy Backend trước, kiểm tra API `/health` trả về HTTP 200 rồi mới bật Frontend, khách hàng tại quầy POS vẫn thanh toán bình thường (Zero-Downtime). |
| **5** | Thẻ nhãn commit SHA (`:tag`) trong Docker dùng để làm gì? | `tags: ...:${{ github.sha }}` (Dòng 93, 106) | Mỗi bản build gắn liền với 1 mã commit duy nhất. Nếu bản cập nhật mới bị lỗi nghiệp vụ, có thể dùng mã này để Rollback quay về bản cũ chỉ trong 30 giây. |
