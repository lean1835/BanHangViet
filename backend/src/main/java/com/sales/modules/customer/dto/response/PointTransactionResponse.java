package com.sales.modules.customer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointTransactionResponse {
    private String id;
    private String customerId;
    private String customerName;
    private String orderId;
    private String orderNumber;
    private String returnTicketId;
    private String returnTicketNumber;
    private String type;
    private Integer pointsChange;
    private Integer balanceAfter;
    private BigDecimal monetaryEquivalent;
    private String description;
    private LocalDate expiryDate;
    private String createdByUserId;
    private String createdByUsername;
    private LocalDateTime createdAt;
}
