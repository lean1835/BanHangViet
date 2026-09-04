package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosRevenueSummaryResponse {
    private String posId;
    private String posCode;
    private String posName;
    private String address;
    private String phoneNumber;
    private String invoiceSymbol;
    private Boolean isDefault;
    private Boolean isActive;
    private Long orderCount;
    private Long invoiceCount;
    private BigDecimal grossSales;
    private BigDecimal totalDiscount;
    private BigDecimal netRevenue;
    private BigDecimal cashRevenue;
    private BigDecimal bankRevenue;
    private BigDecimal debtRevenue;
    private BigDecimal revenuePercentage;
}
