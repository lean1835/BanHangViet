package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderItemRequest {

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng bán phải lớn hơn 0")
    private BigDecimal quantity;
}
