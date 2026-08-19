package com.sales.service.interfaces;

import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionSearchParam;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.PromotionDetailResponse;
import com.sales.dto.response.PromotionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PromotionService {

    PromotionResponse createPromotion(String currentUsername, PromotionCreateRequest request);

    PromotionResponse updatePromotion(String currentUsername, String promotionId, PromotionUpdateRequest request);

    void deletePromotion(String currentUsername, String promotionId);

    PromotionDetailResponse getPromotionById(String currentUsername, String promotionId);

    Page<PromotionResponse> getPromotions(String currentUsername, PromotionSearchParam param, Pageable pageable);

    PromotionResponse togglePromotionStatus(String currentUsername, String promotionId);
}
