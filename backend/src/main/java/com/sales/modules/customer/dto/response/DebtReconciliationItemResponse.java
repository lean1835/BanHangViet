package com.sales.modules.customer.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtReconciliationItemResponse {
    private String id;
    private LocalDateTime transactionDate;
    private String type;
    private String typeDescription;
    private String referenceCode;
    private String debtId;
    private BigDecimal amount;
    private BigDecimal runningBalance;
    private String notes;
}
