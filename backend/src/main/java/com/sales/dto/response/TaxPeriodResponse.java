package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxPeriodResponse {

    private String id;
    private String householdId;
    private String periodName;
    private String periodType;
    private Integer year;
    private Integer periodNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer totalValidInvoices;
    private BigDecimal totalRevenue;
    private BigDecimal totalTaxAmount;
    private String createdByName;
    private LocalDateTime lockedAt;
    private String lockedByName;
    private LocalDateTime createdAt;
}
