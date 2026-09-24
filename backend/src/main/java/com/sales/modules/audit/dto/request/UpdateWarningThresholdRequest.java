package com.sales.modules.audit.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWarningThresholdRequest {

    @NotNull(message = "Tỷ lệ phần trăm cảnh báo không được để trống")
    @DecimalMin(value = "50.00", message = "Tỷ lệ cảnh báo tối thiểu là 50.00%")
    @DecimalMax(value = "99.00", message = "Tỷ lệ cảnh báo tối đa là 99.00%")
    private BigDecimal warningThresholdPercentage;
}
