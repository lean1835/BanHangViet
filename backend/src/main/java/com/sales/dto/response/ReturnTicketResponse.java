package com.sales.dto.response;

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
public class ReturnTicketResponse {
    private String id;
    private String ticketNumber;
    private String householdId;
    private String originalInvoiceId;
    private String originalInvoiceNumber;
    private String originalInvoiceLookupCode;
    private String originalOrderId;
    private String customerId;
    private String customerName;
    private String createdByUserId;
    private String createdByUserName;
    private String approvedByUserId;
    private String approvedByUserName;
    private BigDecimal totalReturnAmount;
    private String refundPaymentMethod;
    private String status;
    private String reason;
    private String rejectReason;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ReturnTicketItemResponse> items;
}
