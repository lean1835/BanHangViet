package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierReturnItemRequest {

    @NotBlank(message = "Mã chi tiết phiếu nhập gốc không được để trống")
    private String receiptDetailId;

    @NotNull(message = "Số lượng trả không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng trả phải lớn hơn 0")
    private BigDecimal quantity;

    private String itemReason; // Lý do riêng cho từng dòng mặt hàng
}
