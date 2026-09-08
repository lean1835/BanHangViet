package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxConnectionHistoryResponse {

    private String householdId;
    private Integer totalLogs;
    private List<TaxConnectionLogItem> historyLogs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxConnectionLogItem {
        private String id;
        private String status;
        private Integer responseTimeMs;
        private LocalDateTime lastSuccessfulResponseAt;
        private Integer pendingQueueCount;
        private String errorMessage;
        private LocalDateTime createdAt;
    }
}
