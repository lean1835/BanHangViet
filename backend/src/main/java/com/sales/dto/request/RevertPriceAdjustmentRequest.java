package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevertPriceAdjustmentRequest {

    @NotBlank(message = "Lý do hoàn tác không được để trống")
    @Size(max = 500, message = "Lý do hoàn tác tối đa 500 ký tự")
    private String revertReason;
}
