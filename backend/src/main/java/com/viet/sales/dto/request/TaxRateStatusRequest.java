package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRateStatusRequest {

    @NotNull(message = "Trạng thái hiệu lực (isActive) không được để trống")
    private Boolean isActive;
}
