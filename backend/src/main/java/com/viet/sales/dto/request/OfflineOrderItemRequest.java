package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineOrderItemRequest {
    @NotBlank(message = "Mã sản phẩm không được để trống")
    private String productId;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng bán phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPrice;

    private BigDecimal discountAmount;
    private BigDecimal taxRatePercentage;
    private BigDecimal taxAmount;
    private BigDecimal subtotal;
}
