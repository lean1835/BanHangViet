package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMinStockRequest {

    @NotNull(message = "Ngưỡng tồn tối thiểu không được để trống")
    @DecimalMin(value = "0.0", message = "Ngưỡng tồn tối thiểu không được nhỏ hơn 0")
    private BigDecimal minStockQuantity;
}
