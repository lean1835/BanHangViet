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
public class InvoiceReturnableCheckResponse {
    private String invoiceId;
    private String invoiceNumber;
    private LocalDateTime invoiceDate;
    private String buyerName;
    private boolean isEligibleForReturn;
    private boolean isExpired;
    private long daysSinceIssued;
    private int maxReturnDays;
    private String ineligibilityReason;
    private List<ReturnableItemDto> items;
}
