package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePriceTierRequest {

    @NotBlank(message = "Tên bậc giá không được để trống")
    @Size(max = 100, message = "Tên bậc giá không vượt quá 100 ký tự")
    private String tierName;

    @NotNull(message = "Số lượng tối thiểu không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng tối thiểu phải lớn hơn 0")
    private BigDecimal minQuantity;

    @DecimalMin(value = "0.001", message = "Số lượng tối đa nếu có phải lớn hơn 0")
    private BigDecimal maxQuantity;

    @NotNull(message = "Đơn giá bậc không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá bậc không được nhỏ hơn 0")
    private BigDecimal price;

    private String unitConversionId;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean confirmBelowCost = false;
}
