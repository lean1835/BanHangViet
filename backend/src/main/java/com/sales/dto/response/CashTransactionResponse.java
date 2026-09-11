package com.sales.dto.response;

import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
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
public class CashTransactionResponse {
    private String id;
    private String code;
    private String shiftId;
    private String categoryId;
    private String categoryName;
    private CashTransactionType type;
    private BigDecimal amount;
    private String personName;
    private String notes;
    private CashTransactionStatus status;
    private String createdByUserId;
    private String createdByUsername;
    private String createdByFullName;
    private String approvedByUserId;
    private String approvedByFullName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
