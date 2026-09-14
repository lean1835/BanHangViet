package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPurchaseGroupResponse {
    private String supplierId;
    private String supplierName;
    private String supplierTaxCode;
    private List<TaxPurchaseRegisterItemResponse> items;
    private BigDecimal subtotalQuantity;
    private BigDecimal subtotalAmount;
    private Integer receiptCount;
}
