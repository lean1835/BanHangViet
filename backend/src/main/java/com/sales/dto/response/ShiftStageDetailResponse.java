package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftStageDetailResponse {
    private Integer stageNumber;
    private String stageType; // "HANDOVER" hoặc "FINAL_CLOSE"
    private String cashierUserId;
    private String cashierFullName;
    private String cashierUsername;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal stageOpeningCash;
    private BigDecimal stageCashRevenue;
    private BigDecimal stageExpectedCash;
    private BigDecimal stageActualCash;
    private BigDecimal stageDifferenceAmount;
    private String stageDifferenceReason;
    private Integer completedOrdersCount;
    private String receiverFullName; // null nếu là FINAL_CLOSE
}
