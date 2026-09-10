package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedCustomerDeliveryInvoiceResponse {
    private String invoiceId;
    private String invoiceNumber;
    private String lookupCode;
    private String buyerName;
    private String buyerPhone;
    private String buyerEmail;
    private BigDecimal finalAmount;
    private String status;
    private String customerDeliveryStatus;
    private String lastChannel;
    private String lastRecipientAddress;
    private String lastErrorMessage;
    private Long deliveryAttemptCount;
    private LocalDateTime lastSentAt;
    private LocalDateTime createdAt;
}
