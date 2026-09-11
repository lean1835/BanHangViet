package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentResponse {
    private String id;
    private String orderId;
    private String orderCode;
    private String householdId;
    private String paymentMethod;
    private BigDecimal amount;
    private BigDecimal amountGiven;
    private BigDecimal changeAmount;
    private String transactionCode;
    private Boolean isConfirmed;
    private LocalDateTime confirmedAt;
    private String confirmedByUserId;
    private String confirmedByUsername;
    private String confirmedByFullName;
    private String notes;
    private Boolean isTransferOverdue;
    private LocalDateTime createdAt;
}

