package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateWeightRequest {

    @NotBlank(message = "Mã hàng hóa không được để trống")
    @Size(max = 36, message = "Mã hàng hóa không vượt quá 36 ký tự")
    private String productId;

    @NotNull(message = "Số tiền mua không được để trống")
    @DecimalMin(value = "1.0", message = "Số tiền mua phải lớn hơn 0")
    private BigDecimal buyAmount;

    private String unitConversionId;
}
