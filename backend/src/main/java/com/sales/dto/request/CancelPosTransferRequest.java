package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelPosTransferRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    private String cancelReason;
}
