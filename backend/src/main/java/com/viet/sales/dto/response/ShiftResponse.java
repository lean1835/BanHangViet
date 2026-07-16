package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponse {
    private String id;
    private String userId;
    private String username;
    private String fullName;
    private String householdId;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal openingCash;
    private BigDecimal closingCashExpected;
    private BigDecimal closingCashActual;
    private BigDecimal differenceAmount;
    private String differenceReason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
