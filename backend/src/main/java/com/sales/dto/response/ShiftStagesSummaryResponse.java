package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftStagesSummaryResponse {
    private String shiftId;
    private String shiftStatus;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal shiftOpeningCash;
    private BigDecimal totalShiftRevenue;
    private BigDecimal totalDifferenceAmount;
    private List<ShiftStageDetailResponse> stages;
}
