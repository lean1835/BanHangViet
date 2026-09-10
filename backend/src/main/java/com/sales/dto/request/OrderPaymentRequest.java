package com.sales.dto.request;

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
public class OrderPaymentRequest {

    @NotBlank(message = "Hình thức thanh toán không được để trống")
    private String paymentMethod; // CASH, BANK_TRANSFER, DEBT

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal amount;

    @DecimalMin(value = "0.00", message = "Số tiền khách đưa không được nhỏ hơn 0")
    private BigDecimal amountGiven;

    @Size(max = 100, message = "Mã giao dịch ngân hàng không vượt quá 100 ký tự")
    private String transactionCode;

    @Builder.Default
    private Boolean isConfirmed = true;

    @Size(max = 500, message = "Ghi chú thanh toán không vượt quá 500 ký tự")
    private String notes;
}
