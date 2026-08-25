package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosInventoryItemRequest {

    @NotBlank(message = "Mã sản phẩm không được để trống")
    private String productId;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @DecimalMin(value = "0.000", message = "Số lượng tồn kho không được nhỏ hơn 0")
    private BigDecimal stockQuantity;

    @DecimalMin(value = "0.000", message = "Định mức tồn tối thiểu không được nhỏ hơn 0")
    @Builder.Default
    private BigDecimal minStockQuantity = BigDecimal.ZERO;
}
