package com.sales.modules.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwitchPaymentMethodRequest {
    @NotBlank(message = "Phương thức thanh toán mới không được để trống")
    private String newPaymentMethod;

    private BigDecimal amountGiven;

    private String customerId;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String notes;
}
