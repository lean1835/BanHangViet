package com.sales.modules.promotion.dto.request;
import com.sales.common.constant.PromotionApplyScope;
import com.sales.common.constant.PromotionStatus;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionSearchParam {

    private String keyword;

    private PromotionStatus status;

    private PromotionApplyScope applyScope;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    private Boolean activeNowOnly;
}
