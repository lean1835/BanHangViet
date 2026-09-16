package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    private String targetUserId;     // null = toàn bộ hộ

    @NotBlank(message = "Loại thông báo không được để trống")
    private String notificationType;

    @Pattern(regexp = "INFO|WARNING|DANGER", message = "Mức độ chỉ nhận INFO, WARNING hoặc DANGER")
    @Builder.Default
    private String severity = "WARNING";

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String message;

    private String actionUrl;
    private String targetType;
    private String targetId;
    private String metadata;
}
