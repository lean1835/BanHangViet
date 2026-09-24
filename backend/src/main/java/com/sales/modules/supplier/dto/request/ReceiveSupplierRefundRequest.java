package com.sales.modules.supplier.dto.request;

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
public class ReceiveSupplierRefundRequest {

    @NotBlank(message = "Nhà cung cấp không được để trống")
    @Size(max = 36, message = "Mã nhà cung cấp không vượt quá 36 ký tự")
    private String supplierId;

    @NotNull(message = "Số tiền thu hoàn không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền thu hoàn phải lớn hơn 0")
    private BigDecimal amount;

    @Size(max = 20, message = "Hình thức nhận tiền không vượt quá 20 ký tự")
    private String paymentMethod; // CASH, BANK_TRANSFER

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;
}
