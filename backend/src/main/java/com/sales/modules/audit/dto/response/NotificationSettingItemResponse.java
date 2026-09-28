package com.sales.modules.audit.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingItemResponse {
    private String notificationType;
    private String title;
    private String description;
    private String category;
    private Boolean isEnabled;
    private Boolean isMandatory;
}
