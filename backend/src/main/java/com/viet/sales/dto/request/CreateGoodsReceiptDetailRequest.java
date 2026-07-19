package com.viet.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGoodsReceiptDetailRequest {

    @NotBlank(message = "Mã hàng hóa không được để trống")
    private String productId;

    @NotNull(message = "Số lượng nhập không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng nhập phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá nhập không được âm")
    private BigDecimal purchasePrice;
}
