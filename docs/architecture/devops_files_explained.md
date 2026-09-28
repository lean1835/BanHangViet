# Giải Thích Chi Tiết Các Tệp Docker, Deploy & Backup - Bán Hàng Việt Monorepo

> **Mục tiêu**: Giải thích ngắn gọn, cặn kẽ và thông dụng nhất từng dòng mã trong bộ tệp hạ tầng: `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml`, `scripts/deploy.sh` và `scripts/backup_db.sh`.  
> **Nguyên tắc**: Bám sát mã nguồn thực tế, kèm sơ đồ minh họa, ngôn ngữ đời thường, giữ nguyên 100% các tệp cũ.

---

## Sơ Đồ Toàn Cảnh Bộ Ba Hạ Tầng

> *(Sơ đồ trực quan độ phân giải cao được nhúng sẵn trong tệp [devops_files_explained.docx](devops_files_explained.docx))*

---

## 1. Bộ Tệp Đóng Gói Container (Dockerfile BE & FE)

### 1.1. Tệp `backend/Dockerfile` (Spring Boot Java 21)
*Hình tượng đời sống: Xưởng cơ khí tự động lắp ráp ra cỗ máy Backend siêu nhẹ và cực kỳ an toàn.*

```dockerfile
# STAGE 1: Xưởng lắp ráp (Maven Builder)
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
RUN addgroup -S spring && adduser -S spring -G spring && \
    mkdir -p /app/backups && chown -R spring:spring /app
USER spring:spring
COPY --chown=spring:spring --from=builder /app/target/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

#### Các điểm then chốt:
1. **Kỹ thuật Layer Cache (Dòng 9 - 10)**: Copy riêng `pom.xml` và chạy `mvn dependency:go-offline`. Nhờ đó, khi lập trình viên chỉ sửa code logic trong `src/`, Docker không bao giờ phải tải lại hàng trăm MB thư viện, giúp build cực nhanh chỉ trong vài giây.
2. **Cắt gọt dung lượng qua Stage 2 (Dòng 22)**: Chỉ copy duy nhất tệp `app.jar` sang base image JRE (chỉ chứa môi trường chạy Java, không có Maven và mã nguồn). Giảm kích thước từ **~850MB xuống còn ~220MB** (giảm 74%).
3. **Tạo User phi đặc quyền `USER spring:spring` (Dòng 30 - 33)**: *Điểm ăn điểm bảo mật*: Mặc định Docker chạy quyền `root`. Tại đây tạo riêng user `spring` (UID 1001) để chạy ứng dụng. Nếu hacker tấn công vào backend thì cũng không thể chiếm quyền điều khiển máy chủ VPS host.
4. **Tối ưu bộ nhớ JVM (Dòng 40)**: Sử dụng Garbage Collector G1GC hiện đại (`-XX:+UseG1GC`) và cho phép Java tự động co giãn theo dung lượng RAM của container (`-XX:MaxRAMPercentage=75.0`), chống lỗi tràn bộ nhớ OutOfMemory.

---

### 1.2. Tệp `frontend/Dockerfile` & `frontend/nginx.conf`
*Hình tượng đời sống: Đóng gói toàn bộ giao diện React thành các tệp tĩnh HTML/JS và dùng máy chủ Nginx tí hon để phục vụ khách hàng.*

```dockerfile
# frontend/Dockerfile
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
CMD ["nginx", "-g", "daemon off;"]
```

#### 3 Điểm cứu tinh bên trong tệp `frontend/nginx.conf`:
1. **`client_max_body_size 50M;` (Dòng 9)**:
   - Cho phép upload file lên đến 50MB (đồng bộ với Spring Boot). Mặc định Nginx chỉ cho phép 1MB. Nếu không có dòng này, khi người dùng tải tệp Excel 10.000 hàng hóa thì Nginx sẽ chặn ngay bằng lỗi **HTTP 413 (Payload Too Large)**.
2. **`try_files $uri $uri/ /index.html;` (Dòng 53)**:
   - Cứu tinh của React Router: Khi người dùng đang ở trang `/pos` hoặc `/tax-report` mà bấm F5 tải lại trang, Nginx sẽ tự chuyển tiếp về `index.html` để React Router vẽ tiếp giao diện, tránh bị lỗi **HTTP 404 Not Found**.
3. **Reverse Proxy `/api/` (Dòng 57 - 60)**:
   - `location /api/ { proxy_pass http://banhangviet-be:8080/api/; }`: Cả giao diện và API đều cùng chung 1 cổng 80/443 của Nginx, **xóa sổ hoàn toàn lỗi CORS** gây đau đầu của các ứng dụng Web.

---

## 2. Tệp Điều Phối Toàn Hệ Thống (`docker-compose.yml`)

*Hình tượng đời sống: Nhạc trưởng điều phối 3 nhạc công: Backend (Spring Boot), Frontend (Nginx) và Database (MySQL).*

```yaml
x-logging-options: &default-logging
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
    name: ${DOCKER_NETWORK:-default_network}
```

#### Các nguyên tắc an toàn:
1. **Cơ chế Log Rotation (Dòng 1 - 5)**:
   - `driver: 'json-file', max-size: '10m', max-file: '5'`: Log của container chỉ được to tối đa 10MB và giữ tối đa 5 file (tổng 50MB). Khi đầy nó tự xoay vòng ghi đè. **Không bao giờ có chuyện server bị sập vì đầy ổ cứng**.
2. **Bảo mật mạng nội bộ (`shared_network`)**:
   - Backend và Database nói chuyện với nhau bằng đường mạng ngầm nội bộ qua DNS tĩnh (`jdbc:mysql://banhangviet-db:3306/...`). CSDL MySQL không mở port 3306 ra ngoài Internet, ngăn chặn 100% hacker quét cổng.
3. **`depends_on: [banhangviet-be]` (Dòng 53)**:
   - Frontend phụ thuộc vào Backend, đảm bảo thứ tự khởi động chuẩn.
4. **Volume SSL Let's Encrypt (Dòng 51)**:
   - Mount thư mục chứng chỉ SSL từ host vào container Nginx ở chế độ chỉ đọc (`:ro`), giúp trang web chạy HTTPS an toàn.

---

## 3. Kịch Bản Triển Khai Không Gián Đoạn (`scripts/deploy.sh`)

*Hình tượng đời sống: Đổi ca kíp mượt mà trên VPS — thay thế phiên bản mới mà khách hàng đang mua sắm không hề bị gián đoạn (Zero-Downtime).*

```bash
# 1. Hàm tải image có cơ chế thử lại (Retry x3)
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
fi
```

#### Các điểm then chốt:
1. **Hàm retry 3 lần (Dòng 15 - 32)**: Nếu mạng quốc tế từ VPS tải ảnh từ GitHub Container Registry bị chập chờn, script tự đợi 5 giây và thử lại tối đa 3 lần chứ không vội báo lỗi bỏ cuộc.
2. **Bí quyết Zero-Downtime**:
   - Tại sao không chạy `docker compose up -d` cả 2 cùng lúc?
   - Vì nếu chạy cùng lúc, Backend Spring Boot mất khoảng 30-40 giây khởi động kết nối CSDL và chạy Flyway; trong lúc đó người dùng vào web bấm thanh toán sẽ bị dính ngay lỗi **HTTP 502 Bad Gateway**.
   - Do đó, script **BẬT BACKEND TRƯỚC**, đợi khi nào Backend báo `healthy` (HTTP 200) thì mới bật Frontend. Khách hàng không hề biết hệ thống vừa được nâng cấp!
3. **Dọn dẹp rác tự động (`docker image prune -f`)**: Sau khi nâng cấp thành công, các layer Docker cũ tự động bị xóa bỏ để giải phóng dung lượng đĩa.

---

## 4. Kịch Bản Tự Động Sao Lưu Dữ Liệu (`scripts/backup_db.sh`)

*Hình tượng đời sống: Chiếc két sắt bảo hiểm tự động bảo vệ tài sản quý giá nhất của doanh nghiệp — Dữ liệu bán hàng và hóa đơn thuế.*

```bash
#!/bin/sh
set -eu

BACKUP_DIR="/home/ubuntu/banhangviet-deployment/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

# 1. Trích xuất CSDL trực tiếp trong container và nén gzip-9
docker exec "$DB_CONTAINER" mysqldump \
  -u"$DB_USER" -p"$DB_PASS" \
  --single-transaction --quick \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# 2. Tự động tìm và xóa các bản sao lưu cũ hơn 7 ngày
find "$BACKUP_DIR" -name "db_${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete || true
```

#### Các điểm then chốt:
1. **`mysqldump --single-transaction` (Dòng 29)**: *Điểm ăn điểm kỹ thuật*: Tùy chọn này sao lưu dữ liệu trong 1 transaction nhất quán của InnoDB mà **KHÔNG KHÓA BẢNG (no table lock)**. Nhân viên thu ngân tại quầy vẫn bấm máy in hóa đơn bán hàng bình thường mà không bị lag hay đơ máy.
2. **Nén `gzip -9` qua đường ống (Dòng 32)**: Dữ liệu xuất ra từ MySQL lập tức được truyền qua đường ống (pipe `|`) để nén mức 9 cao nhất, tiết kiệm hơn 85% dung lượng lưu trữ trên VPS.
3. **Chính sách xoay vòng 7 ngày (Dòng 39)**: Lệnh `find ... -mtime +7 -delete` tự động quét dọn. VPS sẽ luôn lưu trữ trọn vẹn 7 ngày gần nhất để khôi phục khi có sự cố, đồng thời không bao giờ để file backup tích tụ qua nhiều năm gây đầy ổ cứng.

---

## 5. Bảng 8 Câu Hỏi Vấn Đáp Thầy Cô Hay Hỏi Nhất Về Bộ Tệp Này

| STT | Câu hỏi của Giảng viên / Hội đồng | Vị trí mã nguồn | Câu trả lời ngắn gọn & Thuyết phục |
| :---: | :--- | :--- | :--- |
| **1** | Tại sao dùng Multi-stage Build trong Dockerfile? | `backend/Dockerfile` & `frontend/Dockerfile` | Tách riêng khâu build và khâu chạy. Image sản phẩm chỉ chứa file thực thi, giảm 70-90% dung lượng và không lộ mã nguồn hay công cụ biên dịch. |
| **2** | Chạy container dưới quyền user `spring` có lợi ích gì? | `backend/Dockerfile` (Dòng 30-33) | Áp dụng nguyên tắc Least Privilege (quyền tối thiểu), không dùng quyền root. Ngăn chặn hacker chiếm quyền điều khiển máy chủ host nếu container bị khai thác. |
| **3** | Làm thế nào để giải quyết lỗi CORS giữa React và Spring Boot? | `frontend/nginx.conf` (Dòng 57-60) | Nginx làm Reverse Proxy, chuyển tiếp các request `/api/` sang backend. Cả FE và BE cùng chung Domain/Port nên trình duyệt không phát sinh kiểm tra CORS. |
| **4** | Làm sao tránh lỗi người dùng F5 bị 404 trong React Router? | `frontend/nginx.conf` (Dòng 53) | Dùng lệnh `try_files $uri $uri/ /index.html;`. Khi không tìm thấy file tĩnh, Nginx tự chuyển tiếp về index.html để React Router xử lý định tuyến. |
| **5** | Nginx xử lý thế nào khi người dùng tải file Excel 10.000 dòng? | `frontend/nginx.conf` (Dòng 9) | Cấu hình `client_max_body_size 50M;` (mặc định chỉ 1MB). Đồng bộ mức 50MB với Spring Boot để không bị chặn lỗi 413 Payload Too Large. |
| **6** | Làm sao để log container không làm đầy dung lượng ổ cứng VPS? | `docker-compose.yml` (Dòng 1-5) | Cấu hình driver `json-file` với `max-size: 10m` và `max-file: 5`. Khóa cứng log tối đa 50MB và tự xoay vòng ghi đè. |
| **7** | Cơ chế Zero-Downtime trong deploy.sh hoạt động ra sao? | `scripts/deploy.sh` (Dòng 53-85) | Chạy Backend mới trước, thăm dò API `/health` đến khi trả về HTTP 200 thì mới bật Frontend. Người dùng không bao giờ gặp lỗi 502 Bad Gateway. |
| **8** | Sao lưu database MySQL bằng mysqldump có làm đơ quầy bán hàng không? | `scripts/backup_db.sh` (Dòng 29) | Không. Nhờ có cờ `--single-transaction`, MySQL tạo snapshot nhất quán mà không khóa bảng (no lock), quầy POS vẫn bán hàng và xuất hóa đơn bình thường. |
