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
public class CanceledOrderSummaryDto {
    private String orderId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String cancelReason;
    private String cancelReasonDescription;
    private String cancelReasonNote;
    private String canceledByFullName;
    private LocalDateTime canceledAt;
}
