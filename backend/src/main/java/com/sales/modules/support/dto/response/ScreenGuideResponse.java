package com.sales.modules.support.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenGuideResponse {
    private String id;
    private String screenCode;
    private String screenName;
    private String description;
    private String actionUrl;
    private String targetRole;
    private Long viewCount;
    private Boolean isActive;
    private Integer totalSteps;
    private List<ScreenGuideStepResponse> steps;
    private LocalDateTime updatedAt;
}
