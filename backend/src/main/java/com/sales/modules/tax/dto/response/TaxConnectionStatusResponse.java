package com.sales.modules.tax.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxConnectionStatusResponse {
    private String status;
    private Integer responseTimeMs;
    private LocalDateTime lastSuccessfulResponseAt;
    private Integer pendingQueueCount;
    private String userGuideMessage;
    private LocalDateTime checkedAt;
}
