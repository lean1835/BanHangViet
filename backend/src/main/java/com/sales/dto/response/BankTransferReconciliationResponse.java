package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferReconciliationResponse {
    private String shiftId;
    private String shiftCode;
    private Integer totalTransactions;
    private BigDecimal totalConfirmedAmount;
    private Integer unconfirmedTransactionsCount;
    private BigDecimal totalUnconfirmedAmount;
    private List<BankTransferItemResponse> transactions;
}
