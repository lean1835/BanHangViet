package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicInvoiceResponse {
    private String invoiceNumber;
    private String invoicePattern;
    private String invoiceSymbol;
    private String title;
    private String footerNote;
    private String householdName;
    private String householdTaxCode;
    private String householdAddress;
    private String householdPhone;
    private String buyerName;
    private String buyerTaxCode;
    private String buyerAddress;
    private String buyerPhone;
    private String buyerEmail;
    private String status;
    private BigDecimal totalAmountBeforeTax;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private LocalDateTime createdAt;
    private String taxAuthorityCode;
    private List<EInvoiceItemResponse> items;
}
