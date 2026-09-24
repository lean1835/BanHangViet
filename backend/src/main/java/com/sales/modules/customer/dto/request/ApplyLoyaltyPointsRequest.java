package com.sales.modules.customer.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyLoyaltyPointsRequest {

    @NotNull(message = "Số điểm muốn đổi không được để trống")
    @Min(value = 1, message = "Số điểm muốn đổi phải lớn hơn 0")
    private Integer pointsToRedeem;
}
