package com.sales.service.interfaces;

import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.Promotion;
import com.sales.entity.User;

import java.math.BigDecimal;

public interface PromotionService {

    AutoApplyPromotionResponse autoApplyPromotions(String username, AutoApplyPromotionRequest request);

    PromotionItemResultResponse calculateItemPromotion(
            User user,
            String productId,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion,
            String requestedPromotionId
    );
}
