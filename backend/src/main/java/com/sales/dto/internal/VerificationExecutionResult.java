package com.sales.dto.internal;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationExecutionResult {

    private boolean passed;
    private boolean fileReadable;
    private boolean recordCountsMatched;
    private boolean auditChainIntact;
    private int productCount;
    private int customerCount;
    private int supplierCount;
    private int userCount;
    private int auditLogCount;
    private String failureReason;
    private long durationMs;
}
