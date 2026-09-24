package com.sales.modules.support.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContextualGuideResponse {
    private int errorCode;
    private String actionUrl;
    private String guideScreenCode;
    private String guideScreenName;
    private String suggestedAction;
}
