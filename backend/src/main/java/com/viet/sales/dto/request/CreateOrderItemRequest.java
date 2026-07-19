package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {

    @NotBlank(message = "Mã hàng hóa không được để trống")
    @Size(max = 36, message = "Mã hàng hóa không vượt quá 36 ký tự")
    private String productId;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng bán phải lớn hơn 0")
    private BigDecimal quantity;
}
