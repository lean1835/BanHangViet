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
public class PendingTaxInvoiceSummaryResponse {

    private String invoiceId;
    private String invoiceNumber;
    private String orderNumber;
    private LocalDateTime createdAt;
    private String createdByUsername;
    private String createdByFullName;
    private BigDecimal finalAmount;
    private String status;
    private Long pendingDurationHours;
    private Long pendingDurationDays;
}
