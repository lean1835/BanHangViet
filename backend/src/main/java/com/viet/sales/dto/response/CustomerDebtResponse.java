package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDebtResponse {
    private String id;
    private String householdId;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String orderId;
    private String orderNumber;
    private BigDecimal amount;
    private BigDecimal remainingAmount;
    private String type; // DEBT_CREATED, DEBT_PAID
    private String status; // PENDING, PAID, OVERDUE
    private LocalDateTime dueDate;
    private String notes;
    private String createdByUserId;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
