package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNotificationSettingRequest {

    @NotBlank(message = "Mã loại thông báo không được để trống")
    private String notificationType;

    @NotNull(message = "Trạng thái bật/tắt không được để trống")
    private Boolean isEnabled;
}
