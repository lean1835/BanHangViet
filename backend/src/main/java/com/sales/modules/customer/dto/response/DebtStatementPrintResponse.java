package com.sales.modules.customer.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtStatementPrintResponse {
    private String documentTitle;
    private String reconciliationCode;
    private LocalDate printedDate;

    private String householdName;
    private String householdTaxCode;
    private String householdAddress;
    private String householdPhone;
    private String householdRepresentative;

    private String customerName;
    private String customerPhone;
    private String customerTaxCode;
    private String customerAddress;

    private LocalDate startDate;
    private LocalDate endDate;

    private BigDecimal openingDebtBalance;
    private BigDecimal totalDebtIncurred;
    private BigDecimal totalDebtPaid;
    private BigDecimal closingDebtBalance;
    private String closingDebtInWords;

    private boolean hasTransactions;
    private String notes;

    private List<DebtReconciliationItemResponse> transactions;

    private String sellerSignTitle;
    private String buyerSignTitle;
}
