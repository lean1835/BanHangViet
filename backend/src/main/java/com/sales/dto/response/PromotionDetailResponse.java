package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PromotionDetailResponse {

    private String id;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private PromotionApplyScope applyScope;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private PromotionStatus status;
    private String calculatedState;
    private String createdByUserId;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ProductSummary> products;
    private List<ProductGroupSummary> productGroups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private String id;
        private String sku;
        private String name;
        private BigDecimal price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductGroupSummary {
        private String id;
        private String name;
    }
}
