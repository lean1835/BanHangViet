package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedInvoiceSummaryResponse {

    private String invoiceId;
    private String invoiceNumber;
    private String orderNumber;
    private LocalDateTime createdAt;
    private String createdByUsername;
    private String createdByFullName;
    private BigDecimal finalAmount;
    private String status; // SEND_ERROR, MANUAL_PROCESSING
    private String taxAuthorityResponse;
    private String errorCategory;
    private Integer retryCount;
    private Long pendingDurationHours;
    private Long pendingDurationDays;
}
