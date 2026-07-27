package com.viet.sales.dto.request;

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
public class CreateAdjustmentInvoiceItemRequest {

    @Size(max = 36, message = "Mã hàng hóa không vượt quá 36 ký tự")
    private String productId;

    @NotBlank(message = "Tên hàng hóa không được để trống")
    @Size(max = 255, message = "Tên hàng hóa không vượt quá 255 ký tự")
    private String productName;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 50, message = "Đơn vị tính không vượt quá 50 ký tự")
    private String unit;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá không được nhỏ hơn 0")
    private BigDecimal unitPrice;

    @NotNull(message = "Thuế suất không được để trống")
    @DecimalMin(value = "0.00", message = "Thuế suất không được nhỏ hơn 0")
    private BigDecimal taxRatePercentage;

    @NotNull(message = "Tiền chiết khấu không được để trống")
    @DecimalMin(value = "0.00", message = "Tiền chiết khấu không được nhỏ hơn 0")
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;
}
