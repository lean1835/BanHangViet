package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PromotionResponse {

    private String id;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private PromotionApplyScope applyScope;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private PromotionStatus status;
    private String calculatedState; // 'UPCOMING', 'ACTIVE', 'EXPIRED', 'INACTIVE'
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer totalProductsCount;
    private Integer totalProductGroupsCount;
}
