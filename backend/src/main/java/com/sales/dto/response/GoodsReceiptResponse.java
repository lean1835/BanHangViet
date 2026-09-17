package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptResponse {
    private String id;
    private String receiptNumber;
    private String supplierId;
    private String supplierName;
    private BigDecimal totalAmount;
    private LocalDateTime receivedAt;
    private String notes;
    private String createdByUserId;
    private String createdByUserName;
    private String returnStatus; // NOT_RETURNED, PARTIALLY_RETURNED, FULLY_RETURNED
    private BigDecimal totalReturnedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
