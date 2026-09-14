package com.sales.dto.response;

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
public class TaxPurchaseRegisterItemResponse {
    private String id;
    private String receiptId;
    private String receiptNumber;
    private LocalDateTime receiptDate;
    private String supplierId;
    private String supplierName;
    private String supplierTaxCode;
    private String supplierInvoiceNumber;
    private String productId;
    private String productCode;
    private String productName;
    private String unitName;
    private BigDecimal baseQuantity;
    private BigDecimal basePurchasePrice;
    private BigDecimal totalAmount;
    private Boolean isSupplierMissing;
    private String notes;
}
