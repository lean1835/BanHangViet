#!/bin/sh
# ===================================================================
# Kịch bản tự động sao lưu cơ sở dữ liệu MySQL BanHangViet
# Tự động nén gzip và tự xoay vòng xóa bản sao lưu cũ hơn 7 ngày
# ===================================================================
set -eu

BACKUP_DIR="${DEPLOY_PATH:-/home/${USER:-ubuntu}/banhangviet-deployment}/backups"
DB_CONTAINER="${DB_CONTAINER:-banhangviet-db}"
DB_NAME="${DB_NAME:-ban_hang_viet}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-MatKhauManh123@}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu sao lưu CSDL '$DB_NAME' từ container '$DB_CONTAINER'..."

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "LỖI: Container CSDL '$DB_CONTAINER' hiện không hoạt động!" >&2
  exit 1
fi

docker exec "$DB_CONTAINER" mysqldump \
  -u"$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --quick \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sao lưu thành công: $BACKUP_FILE ($FILE_SIZE)"

# Tự động dọn dẹp các bản sao lưu cũ hơn 7 ngày
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Đang dọn dẹp các bản sao lưu cũ hơn 7 ngày..."
find "$BACKUP_DIR" -name "db_${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hoàn tất quy trình sao lưu an toàn."
