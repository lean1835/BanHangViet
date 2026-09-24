package com.sales.modules.product.dto.response;
import com.sales.common.constant.AdjustmentType;
import com.sales.common.constant.BatchStatus;
import com.sales.common.constant.PriceRoundingMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAdjustmentBatchResponse {

    private String id;
    private String batchCode;
    private String name;
    private AdjustmentType adjustmentType;
    private BigDecimal adjustmentValue;
    private String targetGroupId;
    private String targetGroupName;
    private PriceRoundingMethod roundingMethod;
    private BatchStatus status;
    private Integer totalItems;
    private Integer belowCostItems;
    private String appliedBy;
    private String appliedByName;
    private LocalDateTime appliedAt;
    private String revertedBy;
    private String revertedByName;
    private LocalDateTime revertedAt;
    private String revertReason;
    private Boolean canRevert;
    private List<PriceAdjustmentItemPreviewResponse> items;
}
