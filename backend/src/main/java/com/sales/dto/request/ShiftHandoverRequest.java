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
public class ShiftHandoverRequest {

    private String shiftId;

    @NotBlank(message = "Người nhận bàn giao không được để trống")
    private String recipientUserId;

    @NotBlank(message = "Mật khẩu xác nhận của người nhận không được để trống")
    @ToString.Exclude
    private String recipientPassword;

    @NotNull(message = "Số tiền mặt thực tế bàn giao không được để trống")
    @DecimalMin(value = "0.00", message = "Số tiền bàn giao không được âm")
    private BigDecimal actualCash;

    @Size(max = 1000, message = "Lý do chênh lệch không được vượt quá 1000 ký tự")
    private String differenceReason;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;
}
