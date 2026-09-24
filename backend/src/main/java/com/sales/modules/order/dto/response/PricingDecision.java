package com.sales.modules.order.dto.response;
import com.sales.modules.product.entity.ProductPriceTier;
import com.sales.modules.promotion.entity.Promotion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingDecision {
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private ProductPriceTier priceTier;
    private String priceTierName;
    private Promotion promotion;
    private String promotionName;
}
