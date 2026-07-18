package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyDiscountRequest {

    @NotBlank(message = "Loại giảm giá không được để trống")
    @Pattern(regexp = "^(PERCENTAGE|CASH)$", message = "Loại giảm giá chỉ có thể là PERCENTAGE hoặc CASH")
    private String discountType;

    @NotNull(message = "Mức giảm giá không được để trống")
    @DecimalMin(value = "0.0", message = "Mức giảm giá không được nhỏ hơn 0")
    private BigDecimal discountValue;
}
