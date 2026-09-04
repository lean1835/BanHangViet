package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundPaymentMethodSummary {
    private String paymentMethod;
    private String paymentMethodName;
    private Long ticketCount;
    private BigDecimal totalAmount;
}
