package com.viet.sales.dto.request;

import jakarta.validation.constraints.DecimalMax;
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
public class TaxRateRequest {

    @NotBlank(message = "Tên mức thuế không được để trống")
    @Size(max = 50, message = "Tên mức thuế không vượt quá 50 ký tự")
    private String name;

    @NotNull(message = "Tỷ lệ phần trăm thuế không được để trống")
    @DecimalMin(value = "0.00", message = "Tỷ lệ thuế không được nhỏ hơn 0%")
    @DecimalMax(value = "100.00", message = "Tỷ lệ thuế không được vượt quá 100%")
    private BigDecimal ratePercentage;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;
}
