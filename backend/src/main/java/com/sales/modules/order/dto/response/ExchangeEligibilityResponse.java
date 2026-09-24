package com.sales.modules.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeEligibilityResponse {

    private boolean isEligible;
    private String exchangeType; // EQUAL_VALUE, HIGHER_VALUE, LOWER_VALUE
    private BigDecimal totalReturnAmount;
    private BigDecimal totalExchangeAmount;
    private BigDecimal differenceAmount;
    private boolean requireNewInvoice;
    private boolean redirectToReturnFlow;
    private BigDecimal suggestedRefundAmount;
    private String message;
}
