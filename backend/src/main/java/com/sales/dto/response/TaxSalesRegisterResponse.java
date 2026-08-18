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
public class TaxSalesRegisterResponse {

    private String id;
    private String periodId;
    private String invoiceId;
    private String invoicePattern;
    private String invoiceSymbol;
    private String invoiceNumber;
    private LocalDateTime issueDate;
    private String buyerName;
    private String buyerTaxCode;
    private BigDecimal taxRatePercentage;
    private BigDecimal revenueAmount;
    private BigDecimal taxAmount;
    private String invoiceType;
    private String notes;
    private LocalDateTime createdAt;
}
