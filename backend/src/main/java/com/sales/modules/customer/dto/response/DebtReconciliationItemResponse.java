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
    private String type; // DEBT_CREATED, DEBT_PAID
    private String typeDescription; // "Mua hàng ghi nợ", "Khách trả nợ", "Giảm trừ trả hàng"
    private String referenceCode; // orderNumber, invoiceNumber, receiptCode
    private String debtId;
    private BigDecimal amount;
    private BigDecimal runningBalance; // Số dư nợ sau giao dịch
    private String notes;
}
