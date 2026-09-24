package com.sales.modules.support.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenGuideStepResponse {
    private String id;
    private Integer stepNumber;
    private String title;
    private String content;
    private String targetElementSelector;
    private String buttonLabel;
    private String imageUrl;
}
