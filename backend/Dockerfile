# ==========================================
# STAGE 1: Builder (Maven Build Spring Boot JAR)
# ==========================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml và pre-fetch dependencies trước để tận dụng Docker Layer Cache
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy mã nguồn và đóng gói ứng dụng Spring Boot sang file .jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Đổi tên file JAR đầu ra thành app.jar
RUN mv target/*.jar target/app.jar

# ==========================================
# STAGE 2: Runtime (JRE 17 Alpine siêu nhẹ)
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Cài đặt curl cho Health Check
RUN apk --no-cache add curl && rm -rf /var/cache/apk/*

# Tạo user phi đặc quyền (non-root) tăng bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/target/app.jar app.jar

# Port Spring Boot mặc định (8080)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
