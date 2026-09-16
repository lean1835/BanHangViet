package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateNotificationSettingsRequest {

    @NotEmpty(message = "Danh sách cài đặt thông báo không được rỗng")
    @Valid
    private List<UpdateNotificationSettingRequest> settings;
}
