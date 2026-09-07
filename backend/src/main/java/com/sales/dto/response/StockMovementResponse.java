package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementResponse {
    private String id;
    private String documentId;
    private String documentType;
    private String documentTypeName;
    private String documentNumber;
    private String documentUrl;
    private LocalDateTime timestamp;
    private String changeType; // IN, OUT, ADJUST, INITIAL
    private BigDecimal quantityIn;
    private BigDecimal quantityOut;
    private BigDecimal quantityChange;
    private BigDecimal balanceAfter;
    private String performedBy;
    private String notes;
}
