package com.sales.dto.request;

import com.sales.constant.AnomalyAlertStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAnomalyAlertRequest {

    @NotNull(message = "Trạng thái xử lý không được để trống")
    private AnomalyAlertStatus status;

    private String reviewNotes;
}
