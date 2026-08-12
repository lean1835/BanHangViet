package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDebtResponse {
    private String id;
    private String householdId;
    private String supplierId;
    private String supplierName;
    private String goodsReceiptId;
    private String receiptNumber;
    private BigDecimal amount;
    private BigDecimal remainingAmount;
    private String type; // DEBT_CREATED, DEBT_PAID
    private String status; // PENDING, PAID, OVERDUE
    private LocalDateTime dueDate;
    private String paymentMethod;
    private String notes;
    private String createdByUserId;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
