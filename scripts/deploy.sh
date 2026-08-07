#!/bin/sh

# Script Deployment Monorepo BanHangViet trên VPS (POSIX Compliant)
set -eu

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "--- Bắt đầu Deploy Monorepo BanHangViet (BE & FE) ---"
echo "Thư mục đích: ${DEPLOY_PATH}"
echo "Backend Image: ${BE_IMAGE_NAME}"
echo "Frontend Image: ${FE_IMAGE_NAME}"

retry() {
  _n=1
  _max=3
  _delay=5
  while [ $_n -le $_max ]; do
    if "$@"; then
      return 0
    else
      if [ $_n -eq $_max ]; then
        echo -e "${RED}Lệnh thất bại sau $_n lần thử.${NC}"
        return 1
      fi
      echo "Thử lại lần $_n/$_max sau ${_delay}s..."
      sleep $_delay
      _n=$((_n + 1))
    fi
  done
}

cd "$DEPLOY_PATH"

if [ -n "${REGISTRY_USER:-}" ] && [ -n "${REGISTRY_PASSWORD:-}" ]; then
  echo "Đăng nhập Container Registry (${REGISTRY_URL:-ghcr.io})..."
  retry sh -c "echo '$REGISTRY_PASSWORD' | docker login -u '$REGISTRY_USER' --password-stdin '${REGISTRY_URL:-ghcr.io}'"
fi

echo "Tải Docker Images mới nhất..."
retry docker pull "$BE_IMAGE_NAME"
retry docker pull "$FE_IMAGE_NAME"

DOCKER_NET="${DOCKER_NETWORK:-default_network}"
docker network create "$DOCKER_NET" 2>/dev/null || true

if docker ps -a --format '{{.Names}}' | grep -q "^banhangviet-db$"; then
  echo "Kết nối container banhangviet-db vào Docker Network ($DOCKER_NET)..."
  docker network connect "$DOCKER_NET" banhangviet-db 2>/dev/null || true
fi

echo "Re-deploy Backend container..."
BE_IMAGE_NAME=$BE_IMAGE_NAME FE_IMAGE_NAME=$FE_IMAGE_NAME docker compose up -d banhangviet-be

echo "Kiểm tra Health Check Backend..."
MAX_RETRIES=24 # 2 phút
RETRY_COUNT=0
HEALTHY=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' banhangviet-be 2>/dev/null || echo "starting")
  echo "[$RETRY_COUNT/$MAX_RETRIES] Trạng thái Backend: $STATUS"
  
  if [ "$STATUS" = "healthy" ]; then
    HEALTHY=1
    break
  fi
  
  if [ "$STATUS" = "unhealthy" ]; then
    echo -e "${RED}!!! Backend Unhealthy - In log chi tiết 100 dòng của Backend: !!!${NC}"
    docker logs --tail 100 banhangviet-be || true
    exit 1
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 5
done

if [ $HEALTHY -eq 1 ]; then
  echo "Backend đã healthy! Tiến hành Re-deploy Frontend container..."
  BE_IMAGE_NAME=$BE_IMAGE_NAME FE_IMAGE_NAME=$FE_IMAGE_NAME docker compose up -d banhangviet-fe
  echo -e "${GREEN}=== DEPLOYMENT MONOREPO THÀNH CÔNG ===${NC}"
  docker image prune -f
else
  echo -e "${RED}xxx Deployment Hết thời gian chờ (Timeout) - In log Backend: xxx${NC}"
  docker logs --tail 100 banhangviet-be || true
  exit 1
fi
