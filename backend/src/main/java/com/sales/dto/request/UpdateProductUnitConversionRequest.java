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
public class UpdateProductUnitConversionRequest {

    @NotBlank(message = "Tên đơn vị quy đổi không được để trống")
    @Size(max = 50, message = "Tên đơn vị quy đổi không vượt quá 50 ký tự")
    private String unitName;

    @NotNull(message = "Tỷ lệ quy đổi không được để trống")
    @DecimalMin(value = "0.001", message = "Tỷ lệ quy đổi phải lớn hơn 0")
    private BigDecimal conversionFactor;

    @DecimalMin(value = "0.0", message = "Giá bán quy đổi không được nhỏ hơn 0")
    private BigDecimal price;

    @Size(max = 100, message = "Mã vạch không vượt quá 100 ký tự")
    private String barcode;

    @Builder.Default
    private Boolean isDefaultImport = false;

    @Builder.Default
    private Boolean isDefaultSale = false;
}
