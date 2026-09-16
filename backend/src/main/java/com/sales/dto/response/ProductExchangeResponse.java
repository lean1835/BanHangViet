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
public class ProductExchangeResponse {

    private String id;
    private String ticketNumber;
    private String originalInvoiceId;
    private String originalInvoiceNumber;
    private String originalOrderId;
    private String customerId;
    private String customerName;
    private String createdById;
    private String createdByName;
    private String exchangeType; // EQUAL_VALUE, HIGHER_VALUE, LOWER_VALUE
    private BigDecimal totalReturnAmount;
    private BigDecimal totalExchangeAmount;
    private BigDecimal differenceAmount;
    private String extraPaymentMethod;
    private String additionalInvoiceId;
    private String additionalInvoiceNumber;
    private String status;
    private String reason;
    private String notes;
    private LocalDateTime createdAt;
    private List<ProductExchangeItemResponse> items;
}
