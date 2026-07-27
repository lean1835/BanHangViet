package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectDebtRequest {

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String customerId;

    @NotNull(message = "Số tiền trả không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền trả phải lớn hơn 0")
    private BigDecimal amount;

    private String notes;
}
