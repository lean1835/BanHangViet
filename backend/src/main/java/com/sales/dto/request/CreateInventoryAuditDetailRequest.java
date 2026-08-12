package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInventoryAuditDetailRequest {

    @NotBlank(message = "Mã sản phẩm không được để trống")
    private String productId;

    @NotNull(message = "Số lượng đếm thực tế không được để trống")
    @PositiveOrZero(message = "Số lượng đếm thực tế không được là số âm")
    private BigDecimal actualQuantity;

    private String reason;
}
