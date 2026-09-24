package com.sales.modules.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwitchDiningTableRequest {

    @NotBlank(message = "Mã bàn chuyển đến không được để trống")
    private String newDiningTableId;
}
