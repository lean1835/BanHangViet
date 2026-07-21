package com.viet.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenShiftRequest {

    @NotNull(message = "Tiền đầu ca không được để trống")
    @DecimalMin(value = "0.0", message = "Tiền đầu ca không được âm")
    private BigDecimal openingCash;

    private String userId;
}
