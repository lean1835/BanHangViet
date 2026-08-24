package com.sales.dto.request;

import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
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
