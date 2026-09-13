package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDebtAdjustmentRequest {

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String customerId;

    @NotBlank(message = "Loại điều chỉnh không được để trống (DEBT_INCREASE hoặc DEBT_DECREASE)")
    @Pattern(regexp = "^(DEBT_INCREASE|DEBT_DECREASE)$", message = "Loại điều chỉnh chỉ được là DEBT_INCREASE hoặc DEBT_DECREASE")
    private String adjustmentType; // DEBT_INCREASE (tăng nợ), DEBT_DECREASE (giảm nợ)

    @NotNull(message = "Số tiền điều chỉnh không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền điều chỉnh phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Lý do điều chỉnh không được để trống theo quy định kiểm toán")
    @Size(max = 500, message = "Lý do điều chỉnh không vượt quá 500 ký tự")
    private String reason;
}
