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
public class PromotionReportResponse {

    private String promotionId;
    private String promotionName;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private PromotionApplyScope applyScope;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private PromotionStatus status;
    private String calculatedState;

    private Boolean hasData;
    private String message;

    private Long totalOrdersCount;
    private BigDecimal totalQuantitySold;
    private BigDecimal promotionRevenue;
    private BigDecimal totalDiscountAmount;

    private LocalDateTime baselineStartDate;
    private LocalDateTime baselineEndDate;
    private BigDecimal baselineRevenue;
    private BigDecimal incrementalRevenue;
    private BigDecimal netResult;

    private List<PromotionProductStatResponse> productStats;
}
