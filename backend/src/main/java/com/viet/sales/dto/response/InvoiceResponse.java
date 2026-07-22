package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private String id;
    private String householdId;
    private String householdName;
    private String orderId;
    private String orderNumber;
    private String originalInvoiceId;
    private String createdByUserId;
    private String createdByUsername;
    private String createdByFullName;
    private String canceledByUserId;
    private String canceledByUsername;
    private String invoiceNumber;
    private String invoicePattern;
    private String invoiceSymbol;
    private String buyerName;
    private String buyerTaxCode;
    private String buyerAddress;
    private String buyerPhone;
    private String buyerEmail;
    private BigDecimal totalAmountBeforeTax;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String status;
    private String taxAuthorityCode;
    private String taxAuthorityResponse;
    private String cancelReason;
    private String lookupCode;
    private LocalDateTime sentToTaxAt;
    private LocalDateTime taxResponseAt;
    private LocalDateTime canceledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceItemResponse> items;
}
