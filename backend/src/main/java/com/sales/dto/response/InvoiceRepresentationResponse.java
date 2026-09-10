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
public class InvoiceRepresentationResponse {

    private String invoiceId;
    private String invoiceNumber;
    private String invoicePattern;
    private String invoiceSymbol;
    private String title;
    private String status;
    private String watermarkText; // NULL, "HÓA ĐƠN ĐÃ HỦY", "BẢN NHÁP - CHƯA CÓ GIÁ TRỊ PHÁP LÝ"
    private boolean isDraft;
    private boolean isCanceled;
    private boolean isAdjusted;

    // Household Info
    private String householdName;
    private String householdTaxCode;
    private String householdAddress;
    private String householdPhone;

    // Buyer Info
    private String buyerName;
    private String buyerTaxCode;
    private String buyerAddress;
    private String buyerPhone;
    private String buyerEmail;

    // Financial
    private BigDecimal totalAmountBeforeTax;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String amountInWords;

    // Tax & Verification
    private String taxAuthorityCode;
    private String lookupCode;
    private LocalDateTime issuedAt;

    // References
    private String referenceNote; // Link to original or adjustment invoice
    private String originalInvoiceId;

    // Formatted HTML Content for preview
    private String htmlRepresentation;
}
