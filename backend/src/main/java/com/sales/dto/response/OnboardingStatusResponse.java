package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStatusResponse {

    private boolean isCompleted;
    private boolean isSkipped;
    private boolean isReadyForInvoicing;
    private int remainingRequiredSteps;
    private List<OnboardingStepDetail> steps;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OnboardingStepDetail {
        private String stepCode;      // HOUSEHOLD_INFO, INVOICE_TEMPLATE, TAX_RATE, PRODUCT, STAFF
        private String stepName;
        private boolean isRequired;
        private boolean isCompleted;
        private String redirectUrl;
        private String description;
    }
}
