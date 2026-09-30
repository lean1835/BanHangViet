package com.sales.modules.invoice.dto.response;
import com.sales.modules.order.dto.response.ReturnableItemDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceReturnableCheckResponse {
    private String invoiceId;
    private String invoiceNumber;
    private LocalDateTime invoiceDate;
    private String buyerName;

    @JsonProperty("isEligibleForReturn")
    private boolean isEligibleForReturn;

    @JsonProperty("isExpired")
    private boolean isExpired;

    private long daysSinceIssued;
    private int maxReturnDays;
    private String ineligibilityReason;
    private List<ReturnableItemDto> items;

    @JsonProperty("isEligibleForReturn")
    public boolean isEligibleForReturn() {
        return isEligibleForReturn;
    }

    @JsonProperty("eligibleForReturn")
    public boolean getEligibleForReturn() {
        return isEligibleForReturn;
    }

    @JsonProperty("isExpired")
    public boolean isExpired() {
        return isExpired;
    }

    @JsonProperty("expired")
    public boolean getExpired() {
        return isExpired;
    }
}

