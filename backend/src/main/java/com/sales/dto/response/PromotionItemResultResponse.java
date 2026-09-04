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
public class PromotionItemResultResponse {

    private String productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal originalSubtotal;
    private BigDecimal discountAmount;
    private BigDecimal finalSubtotal;
    private String promotionId;
    private String promotionName;

    @Builder.Default
    private boolean hasPromotion = false;

    @Builder.Default
    private boolean bypassPromotion = false;
}
