package com.sales.modules.order.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class ExchangeNewItemRequest {

    @NotBlank(message = "ID sản phẩm muốn đổi sang không được để trống")
    private String productId;

    @NotNull(message = "Số lượng muốn đổi sang không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng muốn đổi sang phải lớn hơn 0")
    private BigDecimal quantity;
}
