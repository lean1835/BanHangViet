package com.sales.dto.request;

import com.sales.constant.AnomalySeverity;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAnomalyRuleRequest {

    @NotNull(message = "Ngưỡng kích hoạt không được để trống")
    @DecimalMin(value = "0.01", message = "Ngưỡng kích hoạt phải lớn hơn 0")
    private BigDecimal thresholdValue;

    @NotNull(message = "Khung thời gian không được để trống")
    @Min(value = 1, message = "Khung thời gian tối thiểu là 1 phút")
    private Integer timeWindowMinutes;

    @NotNull(message = "Mức độ nghiêm trọng không được để trống")
    private AnomalySeverity severity;

    @NotNull(message = "Trạng thái kích hoạt không được để trống")
    private Boolean isEnabled;
}
