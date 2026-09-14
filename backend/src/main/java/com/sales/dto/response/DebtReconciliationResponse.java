package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtReconciliationResponse {
    private String id;
    private String code;
    private String householdId;
    private String householdName;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private String customerTaxCode;
    private BigDecimal creditLimit;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal openingDebtBalance;
    private BigDecimal totalDebtIncurred;
    private BigDecimal totalDebtPaid;
    private BigDecimal closingDebtBalance;
    private String closingDebtInWords;
    private String status; // DRAFT, CONFIRMED, CANCELLED
    private boolean hasTransactions; // TC-03 flag
    private String notes;
    private LocalDate reconciledToDate;
    private LocalDateTime confirmedAt;
    private String confirmedByUsername;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private List<DebtReconciliationItemResponse> items;
}
