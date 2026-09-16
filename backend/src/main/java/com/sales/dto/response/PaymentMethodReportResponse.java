package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodReportResponse {

    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    private List<PaymentMethodStatDto> methods = new ArrayList<>();

    @Builder.Default
    private DebtCollectionSummaryDto debtDetails = new DebtCollectionSummaryDto();

    @Builder.Default
    private List<DailyPaymentTrendDto> dailyTrends = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodStatDto {
        private String method;
        private String methodName;

        @Builder.Default
        private BigDecimal totalAmount = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal percentage = BigDecimal.ZERO;

        @Builder.Default
        private Long transactionCount = 0L;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebtCollectionSummaryDto {
        @Builder.Default
        private BigDecimal totalDebtCreated = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal totalDebtPaid = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal totalDebtRemaining = BigDecimal.ZERO;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPaymentTrendDto {
        private LocalDate date;

        @Builder.Default
        private BigDecimal cashAmount = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal bankTransferAmount = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal debtAmount = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal totalAmount = BigDecimal.ZERO;
    }
}
