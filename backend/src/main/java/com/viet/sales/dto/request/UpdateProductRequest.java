package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "Mã hàng (SKU) không được để trống")
    @Size(max = 50, message = "Mã hàng (SKU) không vượt quá 50 ký tự")
    private String sku;

    @NotBlank(message = "Tên hàng hóa không được để trống")
    @Size(max = 255, message = "Tên hàng hóa không vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 50, message = "Đơn vị tính không vượt quá 50 ký tự")
    private String unit;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", message = "Giá bán không được nhỏ hơn 0")
    private BigDecimal price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @DecimalMin(value = "0.0", message = "Số lượng tồn kho không được nhỏ hơn 0")
    private BigDecimal stockQuantity;

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái chỉ có thể là ACTIVE hoặc INACTIVE")
    private String status;

    private String groupId;

    @NotBlank(message = "Thuế suất không được để trống")
    private String taxRateId;
}
