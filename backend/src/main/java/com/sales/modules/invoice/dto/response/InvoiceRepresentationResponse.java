package com.sales.modules.invoice.dto.response;

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
public class InvoiceRepresentationResponse {
    private String invoiceId;
    private String invoiceNumber;
    private String invoicePattern;
    private String invoiceSymbol;
    private String title;
    private String status;
    private String watermarkText;
    private boolean isDraft;
    private boolean isCanceled;
    private boolean isAdjusted;

    private String householdName;
    private String householdTaxCode;
    private String householdAddress;
    private String householdPhone;

    private String buyerName;
    private String buyerTaxCode;
    private String buyerAddress;
    private String buyerPhone;
    private String buyerEmail;

    private BigDecimal totalAmountBeforeTax;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String amountInWords;

    private String taxAuthorityCode;
    private String lookupCode;
    private LocalDateTime issuedAt;

    private String referenceNote;
    private String originalInvoiceId;

    private String htmlRepresentation;
}
