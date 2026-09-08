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
public class UninvoicedOrderSummaryResponse {

    private String orderId;
    private String orderNumber;
    private LocalDateTime createdAt;
    private String createdByUsername;
    private String createdByFullName;
    private BigDecimal finalAmount;
    private Long pendingDurationHours;
    private Long pendingDurationDays;
}
