package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetPaymentMethodRequest {

    @NotBlank(message = "Hình thức thanh toán không được để trống")
    @Pattern(regexp = "^(CASH|BANK_TRANSFER|DEBT)$", message = "Hình thức thanh toán chỉ có thể là CASH, BANK_TRANSFER hoặc DEBT")
    private String paymentMethod;

    @DecimalMin(value = "0.0", message = "Số tiền khách đưa không được nhỏ hơn 0")
    private BigDecimal amountGiven;
}
