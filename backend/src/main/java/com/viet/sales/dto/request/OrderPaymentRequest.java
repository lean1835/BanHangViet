package com.viet.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentRequest {

    @NotBlank(message = "Hình thức thanh toán không được để trống")
    @Pattern(regexp = "^(CASH|BANK_TRANSFER|DEBT)$", message = "Hình thức thanh toán chỉ có thể là CASH, BANK_TRANSFER hoặc DEBT")
    private String paymentMethod;

    @DecimalMin(value = "0.0", message = "Số tiền khách đưa không được nhỏ hơn 0")
    private BigDecimal amountGiven;
}
