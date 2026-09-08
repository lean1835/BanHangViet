package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceNumberRangeResponse {

    private String id;
    private String householdId;
    private String invoicePattern;
    private String invoiceSymbol;
    private Integer startNumber;
    private Integer endNumber;
    private Integer currentNumber;
    private Integer remainingCount;
    private Integer warningThreshold;
    private Double dailyConsumptionRate;
    private String status; // ACTIVE, WARNING_LOW, EXHAUSTED, INACTIVE
    private String warningMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
