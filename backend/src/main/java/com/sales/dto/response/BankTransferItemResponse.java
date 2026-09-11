package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferItemResponse {
    private String paymentId;
    private String orderId;
    private String orderCode;
    private BigDecimal amount;
    private String transactionCode;
    private Boolean isConfirmed;
    private LocalDateTime confirmedAt;
    private String confirmedByUserId;
    private String confirmedByUsername;
    private String confirmedByFullName;
    private String confirmedByUserName; // Kept for backward compatibility
    private String notes;
    private Boolean isTransferOverdue;
    private LocalDateTime createdAt;
    private String orderStatus;
}
