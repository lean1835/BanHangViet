package com.sales.modules.supplier.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierReturnDetailResponse {
    private String id;
    private String returnNumber;
    private String receiptId;
    private String receiptNumber;
    private LocalDateTime receiptReceivedAt;
    private String supplierId;
    private String supplierName;
    private String supplierPhone;
    private BigDecimal supplierDebtReduced;
    private BigDecimal totalReturnAmount;
    private String reason;
    private String notes;
    private LocalDateTime returnDate;
    private String createdByUserId;
    private String createdByUserName;
    private List<SupplierReturnItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
