package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptReturnableCheckResponse {
    private String receiptId;
    private String receiptNumber;
    private LocalDateTime receivedAt;
    private String supplierId;
    private String supplierName;
    private String supplierPhone;
    private BigDecimal supplierCurrentDebt;
    private BigDecimal receiptTotalAmount;
    private List<ReceiptReturnableItemResponse> items;
}
