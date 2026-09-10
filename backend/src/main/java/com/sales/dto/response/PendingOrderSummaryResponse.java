package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingOrderSummaryResponse {
    private String orderId;
    private String orderNumber;
    private String orderLabel;
    private String tableName;
    private BigDecimal finalAmount;
    private LocalDateTime createdAt;
}
