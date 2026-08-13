package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncReconciliationSummaryResponse {
    private long totalSessions;
    private long matchedSessions;
    private long discrepancySessions;
    private long totalSyncedOrders;
}
