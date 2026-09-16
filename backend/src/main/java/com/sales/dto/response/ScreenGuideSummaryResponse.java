package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenGuideSummaryResponse {
    private String id;
    private String screenCode;
    private String screenName;
    private String actionUrl;
    private String targetRole;
    private Long viewCount;
    private Boolean isActive;
    private Integer stepCount;
    private LocalDateTime updatedAt;
}
