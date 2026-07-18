package com.viet.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseShiftRequest {

    @NotNull(message = "Số tiền thực tế kiểm đếm không được để trống")
    @DecimalMin(value = "0.0", message = "Số tiền mặt thực tế không được phép nhỏ hơn 0")
    private BigDecimal closingCashActual;

    @Size(max = 500, message = "Lý do chênh lệch không được vượt quá 500 ký tự")
    private String differenceReason;
}
