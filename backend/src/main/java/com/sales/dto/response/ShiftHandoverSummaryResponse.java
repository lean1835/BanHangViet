package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftHandoverSummaryResponse {
    private String shiftId;
    private Integer currentStage;
    private String senderUserId;
    private String senderUsername;
    private String senderFullName;
    private String posName;
    private String posCode;
    private LocalDateTime stageStartedAt;
    private BigDecimal openingCash;
    private BigDecimal cashRevenue;
    private BigDecimal expectedCash;
    private Integer completedOrdersCount;
    private Integer pendingOrdersCount;
    private Integer pendingExpenseCount;
    private BigDecimal totalPendingExpense;
    private List<PendingOrderSummaryResponse> pendingOrders;
    private List<EligibleRecipientResponse> eligibleRecipients;
}
