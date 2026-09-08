package com.sales.dto.response;

import com.sales.constant.AdjustmentType;
import com.sales.constant.PriceRoundingMethod;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAdjustmentPreviewResponse {

    private AdjustmentType adjustmentType;
    private BigDecimal adjustmentValue;
    private PriceRoundingMethod roundingMethod;
    private Integer totalItems;
    private Integer increasedItems;
    private Integer decreasedItems;
    private Integer unchangedItems;
    private Integer belowCostItems;
    private List<PriceAdjustmentItemPreviewResponse> items;
}
