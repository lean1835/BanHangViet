package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftHandoverResponse {
    private String id;
    private String shiftId;
    private Integer stageNumber;
    private String senderUserId;
    private String senderUsername;
    private String senderFullName;
    private String receiverUserId;
    private String receiverUsername;
    private String receiverFullName;
    private LocalDateTime handoverTime;
    private BigDecimal openingCash;
    private BigDecimal cashRevenue;
    private BigDecimal expectedCash;
    private BigDecimal actualCash;
    private BigDecimal differenceAmount;
    private String differenceReason;
    private Integer completedOrdersCount;
    private Integer pendingOrdersCount;
    private String notes;
    private LocalDateTime createdAt;
}
