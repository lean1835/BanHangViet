package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeldOrderSummaryResponse {
    private String id;
    private String orderNumber;
    private String orderLabel;
    private String diningTableId;
    private String diningTableName;
    private String diningTableArea;
    private String customerId;
    private String customerName;
    private Integer itemCount;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private Long holdingDurationMinutes;
    private Boolean isOverdue;
    private String createdByUserId;
    private String createdByUsername;
    private String createdByFullName;
}
