package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosStockBreakdownResponse {
    private String posId;
    private String posCode;
    private String posName;
    private BigDecimal stockQuantity;
    private BigDecimal minStockQuantity;
}
