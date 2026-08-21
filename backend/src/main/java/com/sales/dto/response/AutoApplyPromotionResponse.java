package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoApplyPromotionResponse {

    private List<PromotionItemResultResponse> items;
    private BigDecimal totalOriginalAmount;
    private BigDecimal totalDiscountAmount;
    private BigDecimal totalFinalAmount;
}
