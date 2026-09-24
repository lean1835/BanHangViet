package com.sales.modules.promotion.service;
import com.sales.modules.promotion.dto.request.AutoApplyPromotionRequest;
import com.sales.modules.promotion.dto.request.PromotionCreateRequest;
import com.sales.modules.promotion.dto.request.PromotionSearchParam;
import com.sales.modules.promotion.dto.request.PromotionUpdateRequest;
import com.sales.modules.promotion.dto.response.AutoApplyPromotionResponse;
import com.sales.modules.promotion.dto.response.PromotionDetailResponse;
import com.sales.modules.promotion.dto.response.PromotionItemResultResponse;
import com.sales.modules.promotion.dto.response.PromotionReportResponse;
import com.sales.modules.promotion.dto.response.PromotionResponse;
import com.sales.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface PromotionService {

    PromotionResponse createPromotion(String currentUsername, PromotionCreateRequest request);

    PromotionResponse updatePromotion(String currentUsername, String promotionId, PromotionUpdateRequest request);

    void deletePromotion(String currentUsername, String promotionId);

    PromotionDetailResponse getPromotionById(String currentUsername, String promotionId);

    PromotionReportResponse getPromotionReport(String currentUsername, String promotionId);

    Page<PromotionResponse> getPromotions(String currentUsername, PromotionSearchParam param, Pageable pageable);

    PromotionResponse togglePromotionStatus(String currentUsername, String promotionId);

    AutoApplyPromotionResponse autoApplyPromotions(String username, AutoApplyPromotionRequest request);

    PromotionItemResultResponse calculateItemPromotion(
            User user,
            String productId,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion
    );

    PromotionItemResultResponse calculateItemPromotion(
            User user,
            com.sales.modules.product.entity.Product product,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion
    );
}
