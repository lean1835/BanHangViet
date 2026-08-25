package com.sales.service.interfaces;

import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionSearchParam;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PromotionDetailResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.PromotionResponse;
import com.sales.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface PromotionService {

    PromotionResponse createPromotion(String currentUsername, PromotionCreateRequest request);

    PromotionResponse updatePromotion(String currentUsername, String promotionId, PromotionUpdateRequest request);

    void deletePromotion(String currentUsername, String promotionId);

    PromotionDetailResponse getPromotionById(String currentUsername, String promotionId);

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
            com.sales.entity.Product product,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion
    );
}
