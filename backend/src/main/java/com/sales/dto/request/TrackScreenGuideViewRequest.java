package com.sales.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackScreenGuideViewRequest {

    @Min(value = 0, message = "Thời gian xem không được âm")
    @Builder.Default
    private Integer durationSeconds = 0;

    @Builder.Default
    private Boolean completed = false;
}
