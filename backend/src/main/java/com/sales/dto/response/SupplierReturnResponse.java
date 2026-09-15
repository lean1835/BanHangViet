package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierReturnResponse {
    private String id;
    private String returnNumber;
    private String receiptId;
    private String receiptNumber;
    private String supplierId;
    private String supplierName;
    private BigDecimal totalReturnAmount;
    private String reason;
    private String notes;
    private LocalDateTime returnDate;
    private String createdByUserId;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private Integer totalItems;
}
