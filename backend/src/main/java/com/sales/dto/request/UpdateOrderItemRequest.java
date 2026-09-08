package com.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderItemRequest {

    @DecimalMin(value = "0.001", message = "Số lượng bán phải lớn hơn 0")
    private BigDecimal quantity;

    @DecimalMin(value = "1.0", message = "Số tiền mua phải lớn hơn 0")
    private BigDecimal buyAmount;

    private String unitConversionId;
}
