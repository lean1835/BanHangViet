package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnlockTaxPeriodRequest {

    @NotBlank(message = "Lý do mở lại kỳ kê khai không được để trống")
    private String reason;
}
