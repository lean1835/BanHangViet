package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenGuideTopViewedResponse {
    private String screenCode;
    private String screenName;
    private String actionUrl;
    private String targetRole;
    private Long totalViews;
    private Long recent7DaysViews;
    private Double averageDurationSeconds;
    private Double completionRatePercentage;
}
